"""
Pydantic models for photo analysis API endpoints
Defines the request and response schemas for ingredient detection
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class IngredientAnalysisResult(BaseModel):
    """
    Response model for the /analyze-photo endpoint
    Contains detected ingredients, quantities, and observations
    """
    ingredients: List[str]
    quantities: List[str]
    observations: List[str]
    confidence_scores: Optional[List[float]] = None
    processing_time_ms: int

    class Config:
        schema_extra = {
            "example": {
                "ingredients": ["chicken breast", "white rice", "yellow onions", "garlic cloves"],
                "quantities": ["2 lbs", "1 cup", "2 medium", "4 cloves"],
                "observations": ["chicken looks fresh", "rice is long grain"],
                "confidence_scores": [0.95, 0.87, 0.92, 0.89],
                "processing_time_ms": 2450
            }
        }


class PhotoAnalysisResponse(BaseModel):
    """
    Wrapper response model for photo analysis results
    """
    success: bool = True
    data: IngredientAnalysisResult
    timestamp: datetime = datetime.now()

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "ingredients": ["chicken breast", "white rice", "yellow onions", "garlic cloves"],
                    "quantities": ["2 lbs", "1 cup", "2 medium", "4 cloves"],
                    "observations": ["chicken looks fresh", "rice is long grain"],
                    "confidence_scores": [0.95, 0.87, 0.92, 0.89],
                    "processing_time_ms": 2450
                },
                "timestamp": "2026-01-29T10:00:00.000Z"
            }
        }