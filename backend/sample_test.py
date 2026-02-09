"""
Simple test to verify the RAG functionality works without calling the Gemini API
"""
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_basic import BasicRecipeRAG

def test_rag_functionality():
    """
    Test the basic RAG functionality without needing an API key
    """
    print("Testing RAG functionality...")

    # Initialize the RAG system
    rag_system = BasicRecipeRAG()

    # Test with some sample ingredients
    sample_ingredients = ["chicken", "rice", "onions", "garlic"]
    similar_recipes = rag_system.retrieve_similar_recipes(sample_ingredients, top_k=3)

    print(f"Top 3 recipes similar to ingredients: {', '.join(sample_ingredients)}")
    for i, recipe in enumerate(similar_recipes, 1):
        print(f"{i}. {recipe['title']}")
        print(f"   Ingredients: {', '.join(recipe['ingredients'][:5])}")
        print(f"   Category: {recipe.get('category', 'N/A')}")
        print()

    print("RAG functionality test completed successfully!")
    return True

if __name__ == "__main__":
    test_rag_functionality()