import os
import psycopg2
from typing import List, Dict, Any
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

class RagService:
    """
    Service class for Retrieval-Augmented Generation (RAG) functionality.
    Integrates with the vector database to retrieve relevant recipes for context.
    """

    def __init__(self):
        # Initialize database connection
        self.db_url = os.getenv("NEON_DB_URL")
        if not self.db_url:
            raise ValueError("NEON_DB_URL environment variable is not set")

        self.connection = None
        self._connect_to_db()

    def _connect_to_db(self):
        """
        Establish connection to the Neon PostgreSQL database.
        """
        try:
            self.connection = psycopg2.connect(self.db_url)
            logging.info("Successfully connected to Neon database")
        except Exception as e:
            logging.error(f"Failed to connect to database: {e}")
            raise

    async def get_top_n_recipes(self, ingredients: List[str], n: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieve top N relevant recipes based on provided ingredients.
        This provides grounding for the Gemini model's responses.
        """
        if not self.connection:
            raise Exception("Database connection not established")

        try:
            cursor = self.connection.cursor()

            # This is a simplified query - in a real implementation,
            # you would use vector similarity search with pgvector
            # For now, we'll simulate by returning mock data
            recipes = self._mock_get_recipes_by_ingredients(ingredients, n)

            return recipes
        except Exception as e:
            logging.error(f"Error retrieving recipes: {e}")
            # Return mock data in case of error
            return self._mock_get_recipes_by_ingredients(ingredients, n)

    def _mock_get_recipes_by_ingredients(self, ingredients: List[str], n: int) -> List[Dict[str, Any]]:
        """
        Mock implementation to return sample recipes based on ingredients.
        In a real implementation, this would query the vector database.
        """
        # For now, return some sample recipes
        sample_recipes = [
            {
                "id": 1,
                "name": "Tomato Basil Pasta",
                "ingredients": ["pasta", "tomatoes", "basil", "olive oil"],
                "instructions": "Cook pasta according to package directions...",
                "nutrition": {"calories": 450, "protein": "12g", "carbs": "65g", "fat": "18g"}
            },
            {
                "id": 2,
                "name": "Vegetable Stir Fry",
                "ingredients": ["vegetables", "soy sauce", "garlic", "ginger"],
                "instructions": "Heat oil in wok, add vegetables and stir fry...",
                "nutrition": {"calories": 320, "protein": "8g", "carbs": "45g", "fat": "14g"}
            },
            {
                "id": 3,
                "name": "Chicken Salad",
                "ingredients": ["chicken", "lettuce", "tomatoes", "cucumber"],
                "instructions": "Grill chicken, chop vegetables, mix together...",
                "nutrition": {"calories": 380, "protein": "35g", "carbs": "12g", "fat": "22g"}
            }
        ]

        # Filter recipes that contain at least one of the provided ingredients
        filtered_recipes = []
        ingredient_set = {ing.lower().strip() for ing in ingredients}

        for recipe in sample_recipes:
            recipe_ingredients = {ing.lower().strip() for ing in recipe["ingredients"]}
            if ingredient_set.intersection(recipe_ingredients):
                filtered_recipes.append(recipe)

        # Return up to n recipes
        return filtered_recipes[:n]

    async def close_connection(self):
        """
        Close the database connection.
        """
        if self.connection:
            self.connection.close()
            logging.info("Database connection closed")