#!/usr/bin/env python3
"""
Test script to verify the save-recipe endpoint functionality.
"""

import requests
import json
import os

def test_save_recipe():
    # Get the API base URL from environment or use default
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")

    # Sample recipe data
    sample_recipe = {
        "title": "Test Recipe",
        "ingredients": ["2 cups flour", "1 cup sugar", "3 eggs"],
        "instructions": ["Mix ingredients", "Bake at 350°F for 30 minutes"],
        "cookingTime": 30,
        "servings": 4,
        "difficulty": "medium",
        "nutritionInfo": {
            "calories": 250,
            "protein": 5,
            "carbs": 35,
            "fat": 10
        },
        "reasoning": "This is a test recipe for verifying the save functionality.",
        "variations": ["Add chocolate chips", "Use brown sugar instead of white"],
        "prepTime": 10,
        "totalTime": 40,
        "tags": ["dessert", "baking"],
        "customizationNotes": ["Increase sugar for sweeter taste"],
        "images": [],
        "sourceRecipeId": None,
        "ragContext": {}
    }

    # The user ID should be passed in the X-User-ID header
    # This would typically come from the authenticated session
    headers = {
        "Content-Type": "application/json",
        "X-User-ID": "test_user_123"  # Replace with actual user ID in production
    }

    # Payload for the request
    payload = {
        "recipe": sample_recipe,
        "isPublic": True  # Whether to share on Chef's Board
    }

    print(f"Testing save-recipe endpoint at {base_url}/api/v1/chat/save-recipe")
    print(f"Recipe data: {json.dumps(sample_recipe, indent=2)}")

    try:
        response = requests.post(
            f"{base_url}/api/v1/chat/save-recipe",
            headers=headers,
            json=payload
        )

        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")

        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result}")
            return True
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_save_recipe()
    if success:
        print("\nTest completed successfully!")
    else:
        print("\nTest failed!")
        exit(1)