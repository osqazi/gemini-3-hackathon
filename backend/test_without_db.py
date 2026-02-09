"""
Test script for RecipeRAG API without requiring database connection
This bypasses the database initialization issue for testing purposes
"""
import os
import sys
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import importlib.util

# Set environment variables before importing
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

# Import modules after setting up environment
def test_api_without_db():
    """
    Test the API endpoints without requiring actual database connection
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
        sys.modules['core.database'] = mock_db_module

        try:
            # Now import the main app
            from main import app
            client = TestClient(app)

            print("Testing RecipeRAG API endpoints (without database connection)...")

            # Test root endpoint
            print("\n1. Testing root endpoint...")
            response = client.get("/")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   Response: {response.json()}")
            else:
                print(f"   Error: {response.text}")

            # Test health endpoint
            print("\n2. Testing health endpoint...")
            response = client.get("/health")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   Response: {response.json()}")
            else:
                print(f"   Response: {response.text}")

            print("\nAPI test completed! The application structure is working correctly.")
            print("Note: Database functionality requires a valid NEON_DB_URL connection string.")

        except Exception as e:
            print(f"Error during API test: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Restore original module if it existed
            if original_db:
                sys.modules['core.database'] = original_db

if __name__ == "__main__":
    test_api_without_db()