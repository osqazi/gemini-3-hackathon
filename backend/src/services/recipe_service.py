from sqlalchemy.orm import Session
from ..models.recipe_card import RecipeCard
from datetime import datetime
import json
import uuid
import logging

logger = logging.getLogger(__name__)

def save_recipe_to_db(db: Session, recipe_data: dict, user_id: str, is_public: bool = False):
    """
    Save a recipe to the database

    Args:
        db: Database session
        recipe_data: Dictionary containing recipe information
        user_id: ID of the user saving the recipe
        is_public: Whether the recipe should be publicly visible

    Returns:
        RecipeCard: The saved recipe object
    """
    try:
        # Generate a unique ID for the recipe
        recipe_id = f"recipe_{uuid.uuid4().hex}"

        # Prepare the recipe data with safe defaults
        title = recipe_data.get('title', 'Untitled Recipe')
        description = recipe_data.get('description', '') or recipe_data.get('reasoning', '')  # Use description first, then reasoning as fallback

        # Ensure ingredients and instructions are properly formatted
        ingredients = recipe_data.get('ingredients', [])
        if isinstance(ingredients, list):
            ingredients_json = json.dumps(ingredients)
        else:
            ingredients_json = json.dumps([])

        # Clean up instructions by removing bold markers (**)
        raw_instructions = recipe_data.get('instructions', [])
        if isinstance(raw_instructions, list):
            cleaned_instructions = []
            for instruction in raw_instructions:
                if isinstance(instruction, str):
                    # Remove leading/trailing ** markers
                    cleaned_instruction = instruction.replace('**', '').strip()
                    cleaned_instructions.append(cleaned_instruction)
                else:
                    cleaned_instructions.append(instruction)
            instructions_json = json.dumps(cleaned_instructions)
        else:
            instructions_json = json.dumps([])

        # Prepare nutrition info - check for multiple possible field names
        nutrition_info = (
            recipe_data.get('nutrition_info', {}) or 
            recipe_data.get('nutritionInfo', {}) or 
            recipe_data.get('nutrition', {}) or 
            {}
        )
        if isinstance(nutrition_info, dict):
            nutrition_info_json = json.dumps(nutrition_info)
        else:
            nutrition_info_json = json.dumps({})

        # Prepare other arrays - check for multiple possible field names for variations
        variations = (
            recipe_data.get('variations', []) or 
            recipe_data.get('tips_variations', []) or 
            recipe_data.get('tipsVariations', []) or 
            recipe_data.get('tips_and_variations', []) or 
            []
        )
        if isinstance(variations, list):
            variations_json = json.dumps(variations)
        else:
            variations_json = json.dumps([])

        images = recipe_data.get('images', [])
        if isinstance(images, list):
            images_json = json.dumps(images)
        else:
            images_json = json.dumps([])

        tags = recipe_data.get('tags', [])
        if isinstance(tags, list):
            tags_json = json.dumps(tags)
        else:
            tags_json = json.dumps([])

        customization_notes = recipe_data.get('customizationNotes', [])
        if isinstance(customization_notes, list):
            customization_notes_json = json.dumps(customization_notes)
        else:
            customization_notes_json = json.dumps([])

        rag_context = recipe_data.get('ragContext', {})
        if isinstance(rag_context, dict):
            rag_context_json = json.dumps(rag_context)
        else:
            rag_context_json = json.dumps({})

        # Create the recipe object
        recipe = RecipeCard(
            id=recipe_id,
            title=title,
            description=description,  # Use the description field instead of reasoning
            ingredients=ingredients_json,
            instructions=instructions_json,
            prep_time=recipe_data.get('prepTime'),
            cook_time=recipe_data.get('cookingTime'),
            total_time=recipe_data.get('totalTime') or (recipe_data.get('prepTime', 0) + recipe_data.get('cookingTime', 0)),
            servings=recipe_data.get('servings'),
            difficulty=recipe_data.get('difficulty'),
            nutrition_info=nutrition_info_json,
            tips_variations=variations_json,
            author=recipe_data.get('author', 'AI Generated'),
            images=images_json,
            tags=tags_json,
            customization_notes=customization_notes_json,
            source_recipe_id=recipe_data.get('sourceRecipeId'),
            rag_context=rag_context_json,
            user_id=user_id,  # Set the user ID
            public=is_public  # Set the public visibility
        )

        db.add(recipe)
        db.commit()
        db.refresh(recipe)

        logger.info(f"Successfully saved recipe {recipe_id} for user {user_id}")
        return recipe
    except Exception as e:
        logger.error(f"Error saving recipe to database: {str(e)}")
        db.rollback()
        raise e