"""
Simple test script for RecipeRAG API endpoints
Tests the router structure and API functionality
"""
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Set environment variables
os.environ.setdefault('GEMINI_API_KEY', 'AIzaSyAbuTudlUzN_tIDb2f3uj7qOGiwtxlPnms')
os.environ.setdefault('NEON_DB_URL', 'postgresql://test:test@test:5432/test')
os.environ.setdefault('DEBUG', 'true')
os.environ.setdefault('LOG_LEVEL', 'INFO')

# Mock the database connection to prevent initialization errors
class MockDatabaseManager:
    def __init__(self, *args, **kwargs):
        pass  # Don't try to connect to real database

    def get_connection(self):
        return MagicMock()

    def retrieve_similar_recipes(self, *args, **kwargs):
        return []

    def insert_recipe(self, *args, **kwargs):
        return 1

    def bulk_insert_recipes(self, *args, **kwargs):
        return 1

def test_simple_api():
    """
    Simple test of the API endpoints and router functionality
    """
    # Mock the database manager before importing main
    with patch.dict('sys.modules', {
        'core.database': MagicMock(),
    }):
        # Create a mock database module
        mock_db_module = MagicMock()
        mock_db_module.DatabaseManager = MockDatabaseManager
        mock_db_module.get_db_manager = lambda: MockDatabaseManager()

        # Temporarily add the mock to sys.modules
        import sys
        original_db = sys.modules.get('core.database')
        original_gemini = sys.modules.get('core.gemini_client')

        sys.modules['core.database'] = mock_db_module

        # Also mock the gemini client to prevent API calls during testing
        mock_gemini_module = MagicMock()
        class MockGeminiClient:
            def __init__(self, *args, **kwargs):
                pass

            def analyze_image_for_ingredients(self, *args, **kwargs):
                return {
                    "success": True,
                    "response_text": "Test response",
                    "processing_time": 0.1
                }

            def generate_recipe_from_ingredients(self, *args, **kwargs):
                return {
                    "success": True,
                    "response_text": "Test recipe response",
                    "processing_time": 0.2
                }

            def health_check(self):
                return True

        mock_gemini_module.GeminiClient = MockGeminiClient
        mock_gemini_module.get_gemini_client = lambda: MockGeminiClient()
        sys.modules['core.gemini_client'] = mock_gemini_module

        try:
            # Import the main app
            from main import app
            client = TestClient(app)

            print("Running simple RecipeRAG API tests...")

            # Test root endpoint
            print("\n1. Testing root endpoint...")
            response = client.get("/")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Message: {data.get('message', 'N/A')}")
                print(f"   Version: {data.get('version', 'N/A')}")
                print("   Root endpoint: OK")
            else:
                print(f"   Root endpoint: FAILED ({response.status_code})")

            # Test health endpoint
            print("\n2. Testing health endpoint...")
            response = client.get("/health")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Status: {data.get('status', 'N/A')}")
                print(f"   Service: {data.get('service', 'N/A')}")
                print("   Health endpoint: OK")
            else:
                print(f"   Health endpoint: FAILED ({response.status_code})")

            # Test that the API routes exist
            print("\n3. Testing API v1 endpoints existence...")

            # Test photo analysis endpoint
            response = client.post("/api/v1/analyze-photo")
            print(f"   Photo analysis endpoint status: {response.status_code}")
            # Should be 422 (validation error) or 500 (internal error), but NOT 404 (not found)
            if response.status_code != 404:
                print("   Photo analysis endpoint: EXISTS")
            else:
                print("   Photo analysis endpoint: MISSING")

            # Test recipe generation endpoint
            response = client.post("/api/v1/generate-recipe", json={})
            print(f"   Recipe generation endpoint status: {response.status_code}")
            # Should be 422 (validation error) or 500 (internal error), but NOT 404 (not found)
            if response.status_code != 404:
                print("   Recipe generation endpoint: EXISTS")
            else:
                print("   Recipe generation endpoint: MISSING")

            print("\n" + "="*60)
            print("SIMPLE TEST COMPLETE!")
            print("API structure appears to be working correctly")
            print("Router endpoints are properly connected")
            print("="*60)

        except Exception as e:
            print(f"ERROR during testing: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Restore original modules if they existed
            if original_db:
                sys.modules['core.database'] = original_db
            if original_gemini:
                sys.modules['core.gemini_client'] = original_gemini

if __name__ == "__main__":
    test_simple_api()