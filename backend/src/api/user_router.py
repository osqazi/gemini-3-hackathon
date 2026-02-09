from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
from database.session import get_db
from src.services.user_service import get_user_by_email, create_user, update_user_provider_info
import hashlib
import bcrypt
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["user"])

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    if not password:
        return None
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

@router.post("/lookup-or-create")
async def lookup_or_create_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """Lookup user by email or create if doesn't exist"""
    try:
        body = await request.json()
        email = body.get("email")
        provider = body.get("provider", "credentials")
        provider_id = body.get("provider_id")
        password = body.get("password")  # Only for credentials login
        username = body.get("username")

        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        # Check if user already exists
        user = get_user_by_email(db, email)

        if user:
            # User exists, update provider info if missing
            if provider_id and not user.provider_id:
                user = update_user_provider_info(db, email, provider, provider_id)

            return {
                "success": True,
                "user": {
                    "id": user.user_id,
                    "email": user.email,
                    "username": user.username,
                    "provider": user.provider,
                    "is_active": user.is_active,
                    "is_verified": user.is_verified
                }
            }

        # User doesn't exist, create new user
        password_hash = hash_password(password) if password else None

        user = create_user(
            db=db,
            email=email,
            provider=provider,
            provider_id=provider_id,
            username=username,
            password_hash=password_hash
        )

        if not user:
            # User might have been created by another request
            user = get_user_by_email(db, email)
            if not user:
                raise HTTPException(status_code=500, detail="Failed to create user")

        return {
            "success": True,
            "user": {
                "id": user.user_id,
                "email": user.email,
                "username": user.username,
                "provider": user.provider,
                "is_active": user.is_active,
                "is_verified": user.is_verified
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"User lookup/creation error: {str(e)}")

@router.post("/validate-credentials")
async def validate_credentials(
    request: Request,
    db: Session = Depends(get_db)
):
    """Validate email and password credentials"""
    try:
        body = await request.json()
        email = body.get("email")
        password = body.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        user = get_user_by_email(db, email)

        if not user or not user.password:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Verify password
        if not verify_password(password, user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return {
            "success": True,
            "user": {
                "id": user.user_id,
                "email": user.email,
                "username": user.username,
                "provider": user.provider,
                "is_active": user.is_active,
                "is_verified": user.is_verified
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")


@router.post("/register")
async def register_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user with email and password"""
    try:
        body = await request.json()
        email = body.get("email")
        password = body.get("password")
        username = body.get("username")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        # Check if user already exists
        existing_user = get_user_by_email(db, email)
        if existing_user:
            raise HTTPException(status_code=409, detail="User with this email already exists")

        # Hash the password
        password_hash = hash_password(password)

        # Create the user
        user = create_user(
            db=db,
            email=email,
            provider='credentials',
            username=username,
            password_hash=password_hash
        )

        if not user:
            raise HTTPException(status_code=500, detail="Failed to create user")

        return {
            "success": True,
            "user": {
                "id": user.user_id,
                "email": user.email,
                "username": user.username,
                "provider": user.provider,
                "is_active": user.is_active,
                "is_verified": user.is_verified
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")


@router.post("/forgot-password")
async def forgot_password(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle forgot password request"""
    try:
        body = await request.json()
        email = body.get("email")

        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        # Find user by email
        user = get_user_by_email(db, email)

        if not user:
            # User doesn't exist
            return {
                "exists": False,
                "provider": None,
                "message": "This email account is not registered. Please Signup and Create an Account for Free",
                "messageType": "error"
            }

        # Check if user signed up with a social provider
        if user.provider and user.provider != 'credentials':
            # User signed up with social provider
            return {
                "exists": True,
                "provider": user.provider,
                "message": "Password reset Not required. Please Sign-in using your social account registered.",
                "messageType": "warning"
            }

        # User exists with credentials provider, prepare to send reset email
        # In a real implementation, you would generate a reset token and send an email here

        # TODO: Actually send the password reset email
        # For now, we'll just return success

        return {
            "exists": True,
            "provider": "credentials",
            "message": "Password reset link will be sent to your email address. Thank you for being with us!",
            "messageType": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forgot password error: {str(e)}")