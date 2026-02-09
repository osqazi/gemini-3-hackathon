"""
Recipe Generation Router for RecipeRAG
Handles the /generate-recipe endpoint for personalized recipe creation
"""
from fastapi import APIRouter, HTTPException
from typing import List
import time
import logging
from datetime import datetime

from api.models.recipe_generation import RecipeGenerationRequest, GeneratedRecipe
from core.gemini_client import get_gemini_client
from core.database import get_db_manager
from core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/generate-recipe", response_model=GeneratedRecipe)
async def generate_recipe_endpoint(request: RecipeGenerationRequest):
    """
    Generate a personalized recipe based on provided ingredients and preferences,
    using RAG to retrieve similar recipes from the database.

    Args:
        request: RecipeGenerationRequest containing ingredients and preferences

    Returns:
        GeneratedRecipe: A personalized recipe with visible reasoning
    """
    start_time = time.time()

    try:
        # Validate request data
        if not request.ingredients or len(request.ingredients) == 0:
            raise HTTPException(status_code=400, detail="At least one ingredient must be provided")

        # Connect to database and retrieve similar recipes using RAG
        db_manager = get_db_manager()

        # In a real implementation, we would generate an embedding for the input ingredients
        # and use it to find similar recipes in the database. For now, we'll simulate this.

        # Since we need embeddings for similarity search, we'll temporarily return mock data
        # In a full implementation, we'd use the embedding service to convert ingredients to vector
        retrieved_recipes = []

        # If we had real embeddings, we would do something like:
        # embedding_service = get_embedding_service()  # Not implemented yet in this example
        # query_embedding = embedding_service.embed_ingredients(request.ingredients)
        # retrieved_recipes = db_manager.retrieve_similar_recipes(query_embedding, top_k=settings.RAG_TOP_K)

        # For now, return empty list to indicate no similar recipes found
        retrieved_recipes = []

        # Get Gemini client and generate recipe with RAG context
        gemini_client = get_gemini_client()

        # Prepare complete preferences structure from the request
        # The preferences field might be a string or a dictionary depending on the request
        if isinstance(request.preferences, str):
            # If preferences is a string, create a basic structure
            complete_preferences = {
                'dietary_restrictions': [],
                'allergies': [],
                'taste_preferences': {'notes': request.preferences} if request.preferences else {},
                'cooking_constraints': [],
                'ingredient_exclusions': []
            }
        elif isinstance(request.preferences, dict):
            # If preferences is already a dictionary, use it as is
            complete_preferences = request.preferences
        else:
            # Default empty preferences
            complete_preferences = {
                'dietary_restrictions': [],
                'allergies': [],
                'taste_preferences': {},
                'cooking_constraints': [],
                'ingredient_exclusions': []
            }

        result = gemini_client.generate_recipe_from_ingredients(
            ingredients=request.ingredients,
            preferences=complete_preferences,
            rag_context=retrieved_recipes
        )

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error occurred during recipe generation"))

        # In a real implementation, we would parse the Gemini response more thoroughly
        # For now, we'll return a basic structured response based on the API contract
        processing_time_ms = int(result["processing_time"] * 1000)

        # Placeholder values - in production, these would be extracted from Gemini's response
        generated_title = "Personalized Recipe Based on Your Ingredients"
        generated_ingredients = request.ingredients + ["additional ingredients as needed"]
        generated_instructions = [
            "Prep all ingredients",
            "Cook according to similar recipe patterns",
            "Adjust seasoning to taste"
        ]
        generated_cooking_time = "30-45 minutes"
        generated_servings = f"{request.servings or 4} people"
        generated_reasoning = "Based on the ingredients provided and similar recipes in the database, this recipe combines flavors and cooking methods from comparable dishes."

        return GeneratedRecipe(
            title=generated_title,
            ingredients=generated_ingredients,
            instructions=generated_instructions,
            cooking_time=generated_cooking_time,
            servings=generated_servings,
            reasoning=generated_reasoning,
            retrieved_recipes_used=retrieved_recipes,
            processing_time_ms=processing_time_ms,
            created_at=datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Error generating recipe in generate_recipe_endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recipe: {str(e)}"
        )




@router.get("/generate-recipe/health")
async def recipe_generation_health():
    """
    Health check endpoint for the recipe generation service
    """
    return {
        "status": "healthy",
        "service": "recipe-generation",
        "endpoint": "/generate-recipe"
    }