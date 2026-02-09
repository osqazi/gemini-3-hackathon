#!/usr/bin/env python3
"""
Script to reset and populate recipe_cards table with recipes from recipes table
Sets public=true, user_id=user_8447729dea2b3059, and generated_at to today
"""
import os
import sys
import json
import logging
from datetime import datetime
from typing import List, Dict, Any

# Add the backend directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from core.database import get_db_manager
from services.recipe_service import get_recipe_service
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def reset_and_populate_recipe_cards():
    """
    Reset and populate recipe_cards table with recipes from recipes table
    """
    logger.info("Starting recipe_cards reset and population process...")

    # Get database manager
    db_manager = get_db_manager()
    logger.info("Database connection established")

    # Define the user_id and other default values
    user_id = "user_8447729dea2b3059"
    generated_at = datetime.now().isoformat()

    # First, clear existing recipes for this user
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            # Count existing recipes for this user
            cursor.execute("SELECT COUNT(*) FROM recipe_cards WHERE user_id = %s;", (user_id,))
            existing_count = cursor.fetchone()[0]

            if existing_count > 0:
                logger.info(f"Deleting {existing_count} existing recipes for user {user_id}")
                cursor.execute("DELETE FROM recipe_cards WHERE user_id = %s;", (user_id,))
                conn.commit()
                logger.info(f"Deleted {existing_count} existing recipes for user {user_id}")
            else:
                logger.info(f"No existing recipes found for user {user_id}")

            # Query all recipes from the recipes table
            select_sql = """
            SELECT
                id,
                title,
                ingredients,
                instructions,
                category,
                prep_time,
                servings,
                created_at
            FROM recipes;
            """

            cursor.execute(select_sql)
            recipe_rows = cursor.fetchall()

            logger.info(f"Found {len(recipe_rows)} recipes to process")

            if not recipe_rows:
                logger.warning("No recipes found in the recipes table")
                return

            # Prepare to insert into recipe_cards table
            insert_sql = """
            INSERT INTO recipe_cards (
                id,
                title,
                description,
                ingredients,
                instructions,
                prep_time,
                cook_time,
                total_time,
                servings,
                difficulty,
                nutrition_info,
                tips_variations,
                author,
                generated_at,
                updated_at,
                images,
                tags,
                customization_notes,
                source_recipe_id,
                rag_context,
                user_id,
                public
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            );
            """

            success_count = 0
            for row in recipe_rows:
                recipe_id, title, ingredients_str, instructions_str, category, prep_time, servings, created_at = row

                # Convert ingredients string back to list
                ingredients = ingredients_str.split(', ') if ingredients_str else []

                # Convert instructions string back to list
                instructions = instructions_str.split('\n') if instructions_str else []

                # Create a description based on title
                description = f"A delicious {title.lower()} recipe for your cooking pleasure."

                # Determine difficulty based on prep_time
                if prep_time is not None:
                    if prep_time <= 15:
                        difficulty = 'easy'
                    elif prep_time <= 30:
                        difficulty = 'medium'
                    else:
                        difficulty = 'hard'
                else:
                    difficulty = 'medium'  # Default difficulty

                # Calculate total_time (using prep_time as cook_time if not available)
                cook_time = prep_time if prep_time else 15  # Default cook time
                total_time = (prep_time or 0) + cook_time

                # Generate a new UUID for the recipe_cards entry
                import uuid
                recipe_cards_id = f"recipe-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"

                # Prepare values for insertion
                values = (
                    recipe_cards_id,  # id
                    title,  # title
                    description,  # description
                    json.dumps(ingredients),  # ingredients (JSON)
                    json.dumps(instructions),  # instructions (JSON)
                    prep_time,  # prep_time
                    cook_time,  # cook_time
                    total_time,  # total_time
                    servings,  # servings
                    difficulty,  # difficulty
                    json.dumps({}),  # nutrition_info (empty JSON object)
                    json.dumps([]),  # tips_variations (empty array)
                    "Community Chef",  # author
                    generated_at,  # generated_at (today)
                    generated_at,  # updated_at (same as generated_at)
                    json.dumps([]),  # images (empty array)
                    json.dumps([category] if category else ["General"]),  # tags (array with category)
                    json.dumps([]),  # customization_notes (empty array)
                    str(recipe_id),  # source_recipe_id (original recipe id)
                    json.dumps({}),  # rag_context (empty JSON object)
                    user_id,  # user_id
                    True  # public (True)
                )

                try:
                    cursor.execute(insert_sql, values)
                    success_count += 1

                    if success_count % 100 == 0:
                        logger.info(f"Inserted {success_count}/{len(recipe_rows)} recipes...")

                except Exception as e:
                    logger.error(f"Error inserting recipe {recipe_id}: {e}")
                    continue

            # Commit the transaction
            conn.commit()

            logger.info(f"Successfully populated {success_count}/{len(recipe_rows)} recipes in recipe_cards table")
            logger.info(f"Set public=True, user_id={user_id}, and generated_at to today")

    except Exception as e:
        logger.error(f"Error resetting and populating recipe_cards table: {e}")
        raise

def main():
    """
    Main function to execute the recipe_cards reset and population process
    """
    logger.info("Starting recipe_cards reset and population process...")

    try:
        reset_and_populate_recipe_cards()
        logger.info("Recipe cards reset and population completed successfully!")
        return 0
    except Exception as e:
        logger.error(f"Recipe cards reset and population failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main())