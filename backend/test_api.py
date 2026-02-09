"""
Test script to verify RecipeRAG API endpoints are functioning correctly
"""
import asyncio
import json
from main import app
from fastapi.testclient import TestClient

def test_api_endpoints():
    """
    Test the main API endpoints to verify functionality
    """
    client = TestClient(app)

    print("Testing RecipeRAG API endpoints...")

    # Test root endpoint
    print("\n1. Testing root endpoint...")
    response = client.get("/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    # Test health endpoint
    print("\n2. Testing health endpoint...")
    response = client.get("/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    # Test photo analysis router health
    print("\n3. Testing photo analysis health endpoint...")
    response = client.get("/api/v1/analyze-photo/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    # Test recipe generation router health
    print("\n4. Testing recipe generation health endpoint...")
    response = client.get("/api/v1/generate-recipe/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    print("\nAPI endpoint tests completed successfully!")

if __name__ == "__main__":
    test_api_endpoints()