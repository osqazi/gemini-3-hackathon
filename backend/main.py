"""
RecipeRAG - Multimodal AI Recipe Creator & Personal Chef Agent
Main FastAPI Application Entry Point
"""
import os
import logging
import io
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import photo_analysis, recipe_generation
from src.api.chat_router import router as chat_router
from src.api.profile_router import router as profile_router
from src.api.user_router import router as user_router

# Create FastAPI app instance
app = FastAPI(
    title="RecipeRAG API",
    description="API for the RecipeRAG multimodal recipe creation system",
    version="1.0.0"
)

# Configure CORS to allow requests from your Vercel frontend and localhost for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "https://gemini-3-ht.vercel.app",  # Production Vercel frontend
        "https://osqazi-g3h.hf.space"       # Hugging Face Space backend (for same-origin requests if needed)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Requested-With", "X-User-ID", "X-Session-ID", "Authorization"],
    # Expose headers for client-side access if needed
    expose_headers=["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials", "Set-Cookie"]
)

# Include API routers
app.include_router(photo_analysis.router, prefix="/api/v1", tags=["photo-analysis"])
app.include_router(recipe_generation.router, prefix="/api/v1", tags=["recipe-generation"])
app.include_router(chat_router, prefix="/api/v1", tags=["chat"])
app.include_router(profile_router, prefix="/api/v1", tags=["profile"])
app.include_router(user_router, prefix="/api/v1", tags=["user"])

@app.on_event("startup")
def startup_event():
    """Initialize database tables when the application starts"""
    from database.session import create_tables
    create_tables()

@app.get("/")
def read_root():
    return {
        "message": "Welcome to RecipeRAG API - Multimodal Recipe Creation System",
        "version": "1.0.0",
        "endpoints": {
            "analyze_photo": "/api/v1/analyze-photo",
            "generate_recipe": "/api/v1/generate-recipe",
            "chat": "/api/v1/chat",
            "profile": "/api/v1/profile"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "reciperag-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)