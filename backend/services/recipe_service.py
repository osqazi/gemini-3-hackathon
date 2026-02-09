"""
Recipe Service Module for RecipeRAG
Handles recipe retrieval, similarity search, and generation using RAG
"""
from typing import List, Dict, Any, Optional
import logging
from sentence_transformers import SentenceTransformer
import numpy as np
from core.database import get_db_manager
from core.gemini_client import get_gemini_client

logger = logging.getLogger(__name__)

class RecipeService:
    """
    Service class for recipe-related operations including RAG (Retrieval Augmented Generation)
    Handles recipe retrieval, similarity search, and generation based on user ingredients
    """

    def __init__(self):
        """
        Initialize the recipe service with database and embedding model
        """
        self.db_manager = get_db_manager()
        self.gemini_client = get_gemini_client()

        # Initialize the sentence transformer model for embeddings
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

    def generate_recipe_embedding(self, title: str, ingredients: List[str],
                                instructions: Optional[List[str]] = None) -> List[float]:
        """
        Generate an embedding for a recipe based on its content

        Args:
            title: Recipe title
            ingredients: List of ingredients
            instructions: List of instructions (optional)

        Returns:
            List of floats representing the 384-dimensional embedding
        """
        # Combine title, ingredients, and instructions into a single text for embedding
        recipe_text = f"{title} " + " ".join(ingredients)
        if instructions:
            recipe_text += " " + " ".join(instructions)

        # Generate embedding using the sentence transformer model
        embedding = self.embedding_model.encode([recipe_text])[0]

        # Convert to list of floats (required for database storage)
        return embedding.tolist()

    def find_similar_recipes(self, query_ingredients: List[str], top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Find recipes similar to the provided ingredients using vector similarity

        Args:
            query_ingredients: List of ingredients to match against
            top_k: Number of similar recipes to return (default: 3)

        Returns:
            List of recipe dictionaries with similarity scores
        """
        try:
            # Create a query text from the ingredients
            query_text = f"Recipe with ingredients: {', '.join(query_ingredients)}"

            # Generate embedding for the query
            query_embedding = self.embedding_model.encode([query_text])[0]
            query_embedding_list = query_embedding.tolist()

            # Retrieve similar recipes from the database
            similar_recipes = self.db_manager.retrieve_similar_recipes(query_embedding_list, top_k=top_k)

            return similar_recipes

        except Exception as e:
            logger.error(f"Error finding similar recipes: {e}")
            return []

    def generate_recipe_with_rag(self, ingredients: List[str], preferences: Optional[Dict[str, Any]] = None,
                               max_cook_time: Optional[int] = None,
                               servings: Optional[int] = None) -> Dict[str, Any]:
        """
        Generate a personalized recipe using RAG (Retrieval Augmented Generation)

        Args:
            ingredients: List of available ingredients
            preferences: User preferences dictionary with complete structure (dietary restrictions, allergies, etc.)
            max_cook_time: Maximum desired cooking time in minutes (optional)
            servings: Desired number of servings (optional)

        Returns:
            Dictionary containing the generated recipe and metadata
        """
        try:
            # First, find similar recipes in the database
            similar_recipes = self.find_similar_recipes(ingredients, top_k=3)

            # Use the Gemini client to generate a recipe based on ingredients and similar recipes
            result = self.gemini_client.generate_recipe_from_ingredients(
                ingredients=ingredients,
                preferences=preferences or {},  # Pass complete preferences structure or empty dict
                rag_context=similar_recipes
            )

            if result["success"]:
                return {
                    "success": True,
                    "recipe": result["response_text"],
                    "similar_recipes_used": similar_recipes,
                    "processing_time": result["processing_time"],
                    "model_used": result.get("model_used", "unknown")
                }
            else:
                return {
                    "success": False,
                    "error": result["error"],
                    "similar_recipes_found": similar_recipes
                }

        except Exception as e:
            logger.error(f"Error generating recipe with RAG: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def add_recipe_to_database(self, title: str, ingredients: List[str], instructions: List[str],
                             category: Optional[str] = None, prep_time: Optional[int] = None,
                             servings: Optional[int] = None) -> Optional[int]:
        """
        Add a recipe to the database with its generated embedding

        Args:
            title: Recipe title
            ingredients: List of ingredients
            instructions: List of cooking instructions
            category: Recipe category (optional)
            prep_time: Preparation time in minutes (optional)
            servings: Number of servings (optional)

        Returns:
            ID of the inserted recipe or None if failed
        """
        try:
            # Generate embedding for the recipe
            embedding = self.generate_recipe_embedding(title, ingredients, instructions)

            # Insert the recipe into the database
            recipe_id = self.db_manager.insert_recipe(
                title=title,
                ingredients=ingredients,
                instructions=instructions,
                embedding=embedding,
                category=category,
                prep_time=prep_time,
                servings=servings
            )

            logger.info(f"Successfully added recipe '{title}' with ID {recipe_id}")
            return recipe_id

        except Exception as e:
            logger.error(f"Error adding recipe to database: {e}")
            return None

    def bulk_load_recipes(self, recipes_data: List[Dict[str, Any]]) -> int:
        """
        Bulk load multiple recipes into the database with embeddings

        Args:
            recipes_data: List of recipe dictionaries with keys:
                         title, ingredients(list), instructions(list),
                         category(optional), prep_time(optional), servings(optional)

        Returns:
            Number of recipes successfully added to the database
        """
        try:
            # Prepare recipes data with embeddings
            processed_recipes = []
            for recipe in recipes_data:
                # Generate embedding for each recipe
                embedding = self.generate_recipe_embedding(
                    recipe['title'],
                    recipe['ingredients'],
                    recipe.get('instructions')
                )

                processed_recipe = {
                    'title': recipe['title'],
                    'ingredients': recipe['ingredients'],
                    'instructions': recipe.get('instructions', []),
                    'embedding': embedding,
                    'category': recipe.get('category'),
                    'prep_time': recipe.get('prep_time'),
                    'servings': recipe.get('servings')
                }
                processed_recipes.append(processed_recipe)

            # Bulk insert using database manager
            num_inserted = self.db_manager.bulk_insert_recipes(processed_recipes)
            logger.info(f"Bulk loaded {num_inserted} recipes into database")

            return num_inserted

        except Exception as e:
            logger.error(f"Error during bulk recipe loading: {e}")
            return 0

# Global recipe service instance (singleton pattern)
recipe_service = None

def get_recipe_service() -> RecipeService:
    """
    Get or create the recipe service instance

    Returns:
        RecipeService: Singleton instance of the recipe service
    """
    global recipe_service
    if recipe_service is None:
        recipe_service = RecipeService()
    return recipe_service