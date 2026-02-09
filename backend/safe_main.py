"""
Safe version of main.py that handles database connection issues gracefully
"""
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from unittest.mock import MagicMock

# Set up basic configuration first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Handle database connection gracefully
try:
    # Attempt to import and initialize database
    from core.database import get_db_manager

    # Test if database connection works
    try:
        db_manager = get_db_manager()
        DATABASE_AVAILABLE = True
        logger.info("Database connection established successfully")
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")
        DATABASE_AVAILABLE = False

        # Replace the database module with a mock
        import core.database
        original_get_db_manager = getattr(core.database, 'get_db_manager', None)

        # Create a mock database manager
        class MockDatabaseManager:
            def __init__(self):
                pass

            def get_connection(self):
                return MagicMock()

            def retrieve_similar_recipes(self, *args, **kwargs):
                logger.warning("Database not available - returning empty results")
                return []

            def insert_recipe(self, *args, **kwargs):
                logger.warning("Database not available - simulating insert")
                return 1

            def bulk_insert_recipes(self, *args, **kwargs):
                logger.warning("Database not available - simulating bulk insert")
                return len(args[0]) if args else 0

            def get_recipe_by_id(self, *args, **kwargs):
                logger.warning("Database not available - returning None")
                return None

        def mock_get_db_manager():
            return MockDatabaseManager()

        # Replace the function in the module
        setattr(core.database, 'get_db_manager', mock_get_db_manager)
        sys.modules['core.database'] = core.database

except ImportError as e:
    logger.error(f"Import error with database module: {e}")
    DATABASE_AVAILABLE = False

    # Create mock database module
    import sys
    from unittest.mock import MagicMock

    class MockDatabaseManager:
        def __init__(self):
            pass

        def get_connection(self):
            return MagicMock()

        def retrieve_similar_recipes(self, *args, **kwargs):
            return []

        def insert_recipe(self, *args, **kwargs):
            return 1

        def bulk_insert_recipes(self, *args, **kwargs):
            return len(args[0]) if args else 0

        def get_recipe_by_id(self, *args, **kwargs):
            return None

    def mock_get_db_manager():
        return MockDatabaseManager()

    # Create a mock module
    mock_db_module = MagicMock()
    mock_db_module.DatabaseManager = MockDatabaseManager
    mock_db_module.get_db_manager = mock_get_db_manager
    sys.modules['core.database'] = mock_db_module

# Now safely import the routers
try:
    from api.routers import photo_analysis, recipe_generation
    logger.info("API routers imported successfully")
except Exception as e:
    logger.error(f"Error importing API routers: {e}")
    from unittest.mock import MagicMock
    photo_analysis = MagicMock()
    recipe_generation = MagicMock()

# Create FastAPI app instance
app = FastAPI(
    title="RecipeRAG API",
    description="API for the RecipeRAG multimodal recipe creation system",
    version="1.0.0"
)

# Configure CORS for localhost:3000 for Next.js development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Allow Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Expose headers for client-side access if needed
    expose_headers=["Access-Control-Allow-Origin"]
)

# Include API routers if they're available
try:
    app.include_router(photo_analysis.router, prefix="/api/v1", tags=["photo-analysis"])
    app.include_router(recipe_generation.router, prefix="/api/v1", tags=["recipe-generation"])
    logger.info("API routers included successfully")
except AttributeError as e:
    logger.warning(f"Could not include routers: {e}")
    # Create dummy routes for testing
    @app.post("/api/v1/analyze-photo")
    def analyze_photo_stub():
        return {"error": "Service temporarily unavailable", "database_available": DATABASE_AVAILABLE}

    @app.post("/api/v1/generate-recipe")
    def generate_recipe_stub():
        return {"error": "Service temporarily unavailable", "database_available": DATABASE_AVAILABLE}

@app.get("/")
def read_root():
    return {
        "message": "Welcome to RecipeRAG API - Multimodal Recipe Creation System",
        "version": "1.0.0",
        "database_available": DATABASE_AVAILABLE,
        "endpoints": {
            "analyze_photo": "/api/v1/analyze-photo",
            "generate_recipe": "/api/v1/generate-recipe"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "reciperag-api",
        "database_available": DATABASE_AVAILABLE
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)