from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from ..models.user import User
import hashlib
import logging

logger = logging.getLogger(__name__)

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email address"""
    try:
        return db.query(User).filter(User.email == email).first()
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        return None

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get user by user_id"""
    try:
        return db.query(User).filter(User.user_id == user_id).first()
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}")
        return None

def create_user(
    db: Session,
    email: str,
    provider: str,
    provider_id: Optional[str] = None,
    username: Optional[str] = None,
    password_hash: Optional[str] = None
) -> Optional[User]:
    """Create a new user in the database"""
    try:
        # Generate a consistent user_id based on email to ensure consistency across sessions
        user_id = f"user_{hashlib.sha256(email.encode()).hexdigest()[:16]}"

        # Check if user already exists to avoid duplicates
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            logger.info(f"User with email {email} already exists")
            return existing_user

        user = User(
            user_id=user_id,
            email=email,
            username=username or email.split('@')[0],
            password=password_hash,
            provider=provider,
            provider_id=provider_id,
            is_verified=(provider == 'google'),  # Social accounts are verified by default
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        logger.info(f"Created user with ID: {user.user_id} and email: {email}")
        return user
    except IntegrityError as e:
        logger.error(f"Integrity error creating user: {e}")
        db.rollback()
        # Return existing user if it already exists
        return get_user_by_email(db, email)
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        db.rollback()
        return None

def update_user_provider_info(
    db: Session,
    email: str,
    provider: str,
    provider_id: str
) -> Optional[User]:
    """Update provider information for an existing user"""
    try:
        user = get_user_by_email(db, email)
        if user:
            user.provider = provider
            user.provider_id = provider_id
            db.commit()
            db.refresh(user)
            logger.info(f"Updated provider info for user {user.user_id}")
            return user
    except Exception as e:
        logger.error(f"Error updating user provider info: {e}")
        db.rollback()

    return None