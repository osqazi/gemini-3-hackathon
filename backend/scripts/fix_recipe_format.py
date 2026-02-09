#!/usr/bin/env python3
"""
Script to fix the recipe data format in the recipe_cards table
Converts ingredients from string format to object format expected by RecipeCard component
"""
import os
import sys
import json
import re
from typing import List, Dict, Any

# Add the backend directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from core.database import get_db_manager
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def parse_ingredient(ingredient_str: str) -> Dict[str, str]:
    """
    Parse an ingredient string into name, quantity, and preparation components

    Args:
        ingredient_str: Raw ingredient string like "1.5 lbs pork tenderloin (cubed/diced as needed)"

    Returns:
        Dictionary with name, quantity, and preparation keys
    """
    # Pattern to match quantity and unit at the beginning
    # Matches patterns like "1.5 lbs", "2 cups", "1 kg", etc.
    quantity_pattern = r'^(\d+(?:\.\d+)?)\s*(\w+)\s+'
    match = re.match(quantity_pattern, ingredient_str)

    if match:
        quantity = f"{match.group(1)} {match.group(2)}"
        remaining = ingredient_str[len(match.group(0)):].strip()
    else:
        # If no clear quantity/unit found, try to find common units
        quantity = ""
        remaining = ingredient_str

        # Look for common units in the string
        units = ["cup", "cups", "tablespoon", "tbsp", "teaspoon", "tsp", "oz", "ounces", "lb", "lbs", "pound", "pounds", "kg", "grams", "g", "ml", "l", "pinch", "dash", "cloves", "pieces", "slices", "pieces", "stalks", "heads", "bunches"]
        for unit in units:
            if f" {unit} " in ingredient_str or ingredient_str.startswith(f"{unit} "):
                # Try to extract the quantity
                parts = ingredient_str.split(" ", 2)
                if len(parts) >= 2 and parts[0].replace('.', '').isdigit():
                    quantity = f"{parts[0]} {parts[1]}"
                    remaining = " ".join(parts[2:]) if len(parts) > 2 else ""
                    break
                elif len(parts) >= 1 and parts[0].replace('.', '').isdigit():
                    quantity = parts[0]
                    remaining = " ".join(parts[1:]) if len(parts) > 1 else ""
                    break
                else:
                    # If the first word is a number-like string
                    if re.match(r'^\d+(?:\.\d+)?', parts[0]):
                        number_match = re.match(r'^(\d+(?:\.\d+)?)', parts[0])
                        if number_match:
                            quantity = number_match.group(1)
                            remaining = ingredient_str[len(quantity):].strip()
                            break

    # Extract preparation info from parentheses
    prep_match = re.search(r'\((.*?)\)', remaining)
    if prep_match:
        preparation = prep_match.group(1)
        name = remaining[:prep_match.start()] + remaining[prep_match.end():]
        name = name.replace(',', '').strip()
    else:
        preparation = None
        name = remaining

    # If we still don't have a quantity, try to extract it from the name
    if not quantity:
        # Try to find common quantity patterns in the name
        quantity_match = re.match(r'^(\d+(?:\.\d+)?)\s*(\w+)\s+', name)
        if quantity_match:
            quantity = f"{quantity_match.group(1)} {quantity_match.group(2)}"
            name = name[len(quantity_match.group(0)):].strip()

    # If name is still empty, use the whole string as name
    if not name:
        name = ingredient_str
        if quantity:
            # Remove quantity from the beginning if it was extracted
            name = ingredient_str[len(quantity):].strip()

    return {
        "name": name,
        "quantity": quantity,
        "preparation": preparation
    }

def fix_recipe_formats():
    """
    Fix the recipe data formats in the recipe_cards table
    """
    logger.info("Starting recipe format fix process...")

    # Get database manager
    db_manager = get_db_manager()
    logger.info("Database connection established")

    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            # Get all recipes from the recipe_cards table
            select_sql = """
            SELECT id, ingredients, instructions
            FROM recipe_cards;
            """

            cursor.execute(select_sql)
            recipe_rows = cursor.fetchall()

            logger.info(f"Found {len(recipe_rows)} recipes to process")

            if not recipe_rows:
                logger.info("No recipes found to update")
                return

            # Update each recipe with properly formatted ingredients
            updated_count = 0
            for i, (recipe_id, ingredients_json, instructions_json) in enumerate(recipe_rows):
                try:
                    # The data is already in list format, not JSON strings
                    ingredients = ingredients_json if ingredients_json else []
                    instructions = instructions_json if instructions_json else []

                    # Transform ingredients from string format to object format
                    formatted_ingredients = []
                    for ingredient in ingredients:
                        if isinstance(ingredient, str):
                            # Parse the ingredient string
                            parsed_ingredient = parse_ingredient(ingredient)
                            formatted_ingredients.append(parsed_ingredient)
                        elif isinstance(ingredient, dict):
                            # Already in the correct format
                            formatted_ingredients.append(ingredient)
                        else:
                            # Unexpected format, add as name only
                            formatted_ingredients.append({
                                "name": str(ingredient),
                                "quantity": "",
                                "preparation": None
                            })

                    # Update the recipe in the database
                    update_sql = """
                    UPDATE recipe_cards
                    SET ingredients = %s
                    WHERE id = %s;
                    """

                    cursor.execute(update_sql, (json.dumps(formatted_ingredients), recipe_id))

                    updated_count += 1

                    if updated_count % 50 == 0:
                        logger.info(f"Updated {updated_count}/{len(recipe_rows)} recipes...")

                except Exception as e:
                    logger.error(f"Error processing recipe {recipe_id}: {e}")
                    continue

            # Commit the transaction
            conn.commit()

            logger.info(f"Successfully updated {updated_count}/{len(recipe_rows)} recipes with proper ingredient formatting")

    except Exception as e:
        logger.error(f"Error updating recipe formats: {e}")
        raise

def main():
    """
    Main function to execute the recipe format fixing process
    """
    logger.info("Starting recipe format fixing process...")

    try:
        fix_recipe_formats()
        logger.info("Recipe format fixing completed successfully!")
        return 0
    except Exception as e:
        logger.error(f"Recipe format fixing failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main())