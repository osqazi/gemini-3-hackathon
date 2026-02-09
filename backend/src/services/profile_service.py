from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from ..models.user_profile import UserProfile
from typing import Dict, Any

def get_user_profile(db: Session, user_id: str) -> UserProfile:
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

def create_or_update_profile(db: Session, user_id: str, preferences: Dict[Any, Any]) -> UserProfile:
    # Handle migration from old structure to new structure
    migrated_preferences = {
        "diet": preferences.get("diet", ""),
        "allergies": preferences.get("allergies", []) if isinstance(preferences.get("allergies"), list) else [],
        "skill_level": preferences.get("skill_level", ""),
        "likes": preferences.get("likes", []) if isinstance(preferences.get("likes"), list) else [],
        "dislikes": preferences.get("dislikes", []) if isinstance(preferences.get("dislikes"), list) else [],
        "cuisine_preferences": preferences.get("cuisine_preferences", []) if isinstance(preferences.get("cuisine_preferences"), list) else [],
        "cooking_time_preference": preferences.get("cooking_time_preference", ""),
        "health_focus": preferences.get("health_focus", []) if isinstance(preferences.get("health_focus"), list) else [],
        "daily_calorie_target": int(preferences.get("daily_calorie_target", 0)) if preferences.get("daily_calorie_target") is not None else 0,
        # Keep old fields for backward compatibility
        "age": preferences.get("age"),
        "gender": preferences.get("gender"),
        "pregnancy": preferences.get("pregnancy", False),
        "doctor_restrictions": preferences.get("doctor_restrictions", ""),
        "calorie_goal": int(preferences.get("calorie_goal", 0)) if preferences.get("calorie_goal") is not None else 0,  # Legacy field
        "likes_dislikes": preferences.get("likes_dislikes", []) if isinstance(preferences.get("likes_dislikes"), list) else []  # Legacy field
    }

    profile = get_user_profile(db, user_id)
    if profile:
        # Merge existing preferences with new ones to preserve any missing fields
        existing_prefs = profile.preferences or {}
        # Ensure all expected fields are present in existing preferences
        for key, default_value in migrated_preferences.items():
            if key not in existing_prefs:
                existing_prefs[key] = default_value
        
        # Update with new values
        for key, value in migrated_preferences.items():
            existing_prefs[key] = value
            
        profile.preferences = existing_prefs
        profile.updated_at = func.now()
    else:
        profile = UserProfile(user_id=user_id, preferences=migrated_preferences)
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return profile

def delete_profile(db: Session, user_id: str) -> bool:
    profile = get_user_profile(db, user_id)
    if profile:
        db.delete(profile)
        db.commit()
        return True
    return False