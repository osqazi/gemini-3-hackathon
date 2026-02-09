from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Boolean
from sqlalchemy.sql import func
from database.session import Base

class RecipeCard(Base):
    __tablename__ = "recipe_cards"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)

    # Ingredients with detailed information
    ingredients = Column(JSON, nullable=False)  # Array of objects with name, quantity, preparation

    # Instructions
    instructions = Column(JSON, nullable=False)  # Array of step-by-step instructions

    # Timing information
    prep_time = Column(Integer)  # Minutes
    cook_time = Column(Integer)  # Minutes
    total_time = Column(Integer)  # Minutes

    # Serving information
    servings = Column(Integer)

    # Difficulty level
    difficulty = Column(String)  # "easy", "medium", "hard"

    # Nutrition information
    nutrition_info = Column(JSON)  # Object with calories, protein, carbs, fat, fiber

    # Tips and variations
    tips_variations = Column(JSON)  # Array of tips and recipe variations

    # Author information
    author = Column(String)  # Recipe author or "AI Generated"

    # Timestamps
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Additional fields
    images = Column(JSON)  # Array of image URLs
    tags = Column(JSON)  # Array of recipe tags for categorization
    customization_notes = Column(JSON)  # Array of notes from user refinements

    # Source information (for RAG context)
    source_recipe_id = Column(String)  # Original recipe ID if generated from RAG
    rag_context = Column(JSON)  # Context used from RAG system

    # User association
    user_id = Column(String, nullable=False)  # User ID of the recipe owner

    # Public visibility
    public = Column(Boolean, default=False)  # Whether the recipe is shared on Chef's Board