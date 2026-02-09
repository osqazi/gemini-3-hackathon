from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
from database.session import get_db
from src.services.profile_service import get_user_profile, create_or_update_profile, delete_profile

router = APIRouter(prefix="/profile", tags=["profile"])

def get_user_id_from_request(request: Request) -> str:
    """Extract user ID from request headers"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        # Try to get from query params as fallback
        user_id = request.query_params.get('user_id')

    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not provided in request headers (X-User-ID)")
    return user_id

@router.post("/")
async def upsert_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        # Parse the request body
        body = await request.json()

        # Extract preferences from the request body (frontend sends {preferences: {...}})
        preferences = body.get("preferences", {})

        user_id = get_user_id_from_request(request)
        profile = create_or_update_profile(db, user_id, preferences)
        return {
            "success": True,
            "message": "Profile updated successfully",
            "data": profile.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def ensure_complete_preferences(preferences: dict) -> dict:
    """Ensure all expected fields are present in the preferences"""
    default_preferences = {
        "diet": "",
        "allergies": [],
        "skill_level": "",
        "likes": [],
        "dislikes": [],
        "cuisine_preferences": [],
        "cooking_time_preference": "",
        "health_focus": [],
        "daily_calorie_target": 0,
        "age": None,
        "gender": None,
        "pregnancy": False,
        "doctor_restrictions": "",
        "calorie_goal": 0,  # Legacy field
        "likes_dislikes": []  # Legacy field
    }
    
    # Fill in any missing fields with defaults
    for key, default_value in default_preferences.items():
        if key not in preferences:
            preferences[key] = default_value
    
    return preferences

@router.get("/")
async def get_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = get_user_id_from_request(request)
    profile = get_user_profile(db, user_id)
    if not profile:
        # Create a default profile if none exists
        default_preferences = {
            "diet": "",
            "allergies": [],
            "skill_level": "",
            "likes": [],
            "dislikes": [],
            "cuisine_preferences": [],
            "cooking_time_preference": "",
            "health_focus": [],
            "daily_calorie_target": 0
        }
        profile = create_or_update_profile(db, user_id, default_preferences)

    # Ensure the returned profile has all expected fields
    profile_data = profile.to_dict()
    profile_data["preferences"] = ensure_complete_preferences(profile_data["preferences"])
    
    return {"success": True, "data": profile_data}

@router.delete("/")
async def remove_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = get_user_id_from_request(request)
    deleted = delete_profile(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {"success": True, "message": "Profile deleted successfully"}


@router.post("/new-session")
async def create_new_session(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create a new chat session for the user upon signing in or new image upload.
    This endpoint is called when a registered user signs in or uploads a new image.
    """
    try:
        user_id = get_user_id_from_request(request)

        # Create a new chat session for the user
        from src.services.chat_session_service import chat_session_service
        import uuid
        session_id = str(uuid.uuid4())

        new_session = chat_session_service.create_new_session(
            user_id=user_id,
            session_id=session_id
        )

        return {
            "success": True,
            "message": "New chat session created successfully",
            "session_id": new_session.session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating new session: {str(e)}")