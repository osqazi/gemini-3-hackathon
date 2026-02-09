"""
Pydantic models for recipe generation API endpoints
Defines the request and response schemas for recipe generation
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RecipeGenerationRequest(BaseModel):
    """
    Request model for the /generate-recipe endpoint
    Contains ingredients and preferences for recipe generation
    """
    ingredients: List[str]
    preferences: Optional[str] = ""  # Can be a simple string or a JSON string representation of a dictionary
    max_cook_time: Optional[int] = None
    servings: Optional[int] = None

    class Config:
        schema_extra = {
            "example": {
                "ingredients": ["chicken", "rice", "onions", "garlic"],
                "preferences": "healthy, low-fat",
                "max_cook_time": 45,
                "servings": 4
            }
        }


class RetrievedRecipe(BaseModel):
    """
    Model for representing a retrieved recipe from the database
    Used as part of the RAG context in recipe generation
    """
    title: str
    similarity: float  # Cosine similarity score
    ingredients: Optional[List[str]] = None

    class Config:
        schema_extra = {
            "example": {
                "title": "Simple Chicken and Rice",
                "similarity": 0.85,
                "ingredients": ["chicken", "rice", "onions", "garlic"]
            }
        }


class GeneratedRecipe(BaseModel):
    """
    Response model for the /generate-recipe endpoint
    Contains the generated recipe with visible reasoning
    """
    title: str
    ingredients: List[str]
    instructions: List[str]
    cooking_time: str
    servings: str
    reasoning: str  # Visible thought process behind recipe generation
    retrieved_recipes_used: List[RetrievedRecipe]  # Top-3 recipes used as RAG context
    processing_time_ms: int
    created_at: str = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ')  # Added for frontend compatibility as ISO string

    class Config:
        schema_extra = {
            "example": {
                "title": "Hearty Chicken and Rice Casserole",
                "ingredients": ["chicken breast", "white rice", "yellow onions", "garlic cloves", "chicken broth", "mixed herbs"],
                "instructions": [
                    "Preheat oven to 350°F...",
                    "Season chicken and brown in pan...",
                    "Combine with rice and broth...",
                    "Bake for 45 minutes..."
                ],
                "cooking_time": "60 minutes",
                "servings": "4-6 people",
                "reasoning": "Based on the chicken and rice in your ingredients, I've created a casserole that incorporates the onions and garlic for flavor. The recipe draws inspiration from similar chicken and rice dishes.",
                "retrieved_recipes_used": [
                    {"title": "Chicken Rice Casserole", "similarity": 0.87},
                    {"title": "One-Pan Chicken and Rice", "similarity": 0.82},
                    {"title": "Baked Chicken Pilaf", "similarity": 0.79}
                ],
                "processing_time_ms": 4200,
                "created_at": "2026-01-29T10:00:00.000Z"
            }
        }


class RecipeGenerationResponse(BaseModel):
    """
    Wrapper response model for recipe generation results
    """
    success: bool = True
    data: GeneratedRecipe
    timestamp: datetime = datetime.now()

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "title": "Hearty Chicken and Rice Casserole",
                    "ingredients": ["chicken breast", "white rice", "yellow onions", "garlic cloves", "chicken broth", "mixed herbs"],
                    "instructions": [
                        "Preheat oven to 350°F...",
                        "Season chicken and brown in pan...",
                        "Combine with rice and broth...",
                        "Bake for 45 minutes..."
                    ],
                    "cooking_time": "60 minutes",
                    "servings": "4-6 people",
                    "reasoning": "Based on the chicken and rice in your ingredients, I've created a casserole that incorporates the onions and garlic for flavor. The recipe draws inspiration from similar chicken and rice dishes.",
                    "retrieved_recipes_used": [
                        {"title": "Chicken Rice Casserole", "similarity": 0.87},
                        {"title": "One-Pan Chicken and Rice", "similarity": 0.82},
                        {"title": "Baked Chicken Pilaf", "similarity": 0.79}
                    ],
                    "processing_time_ms": 4200
                },
                "timestamp": "2026-01-29T10:00:00.000Z"
            }
        }