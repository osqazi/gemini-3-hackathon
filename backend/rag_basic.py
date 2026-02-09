"""
Basic RAG (Retrieval Augmented Generation) implementation for RecipeRAG project.
This module provides functionality to retrieve similar recipes from a local collection.
"""
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Dict, Tuple


class BasicRecipeRAG:
    """
    Basic RAG system for retrieving similar recipes based on ingredient lists.
    Uses sentence transformers for embeddings and FAISS for efficient similarity search.
    """

    def __init__(self, recipes_file_path: str = "recipes_sample.json"):
        """
        Initialize the RAG system with a collection of recipes.

        Args:
            recipes_file_path: Path to the JSON file containing recipe data
        """
        self.recipes_file_path = recipes_file_path
        self.recipes = []
        self.embeddings = None
        self.index = None
        self.model = SentenceTransformer('all-MiniLM-L6-v2')  # Lightweight model for embeddings

        # Load recipes and create the search index
        self.load_recipes()
        self.create_embeddings()
        self.build_index()

    def load_recipes(self):
        """
        Load recipes from the JSON file.
        """
        try:
            with open(self.recipes_file_path, 'r', encoding='utf-8') as f:
                self.recipes = json.load(f)
            print(f"Loaded {len(self.recipes)} recipes from {self.recipes_file_path}")
        except FileNotFoundError:
            print(f"Recipes file {self.recipes_file_path} not found. Creating sample data.")
            self.create_sample_recipes()
            self.save_sample_recipes()

    def create_sample_recipes(self):
        """
        Create sample recipe data for the RAG system.
        """
        self.recipes = [
            {
                "id": 1,
                "title": "Vegetable Stir Fry",
                "ingredients": ["broccoli", "carrots", "bell peppers", "onions", "garlic", "ginger", "soy sauce"],
                "instructions": ["Stir fry vegetables in wok with oil", "Add sauce and seasonings", "Serve hot with rice"],
                "category": "vegetarian",
                "prep_time": "15 minutes"
            },
            {
                "id": 2,
                "title": "Classic Caesar Salad",
                "ingredients": ["romaine lettuce", "parmesan cheese", "croutons", "caesar dressing", "lemon juice", "anchovies"],
                "instructions": ["Chop lettuce into bite-sized pieces", "Add dressing and toss", "Top with parmesan and croutons"],
                "category": "salad",
                "prep_time": "10 minutes"
            },
            {
                "id": 3,
                "title": "Tomato Basil Pasta",
                "ingredients": ["pasta", "tomatoes", "basil", "olive oil", "garlic", "parmesan"],
                "instructions": ["Cook pasta according to package directions", "Sauté garlic and tomatoes", "Combine with pasta and basil"],
                "category": "pasta",
                "prep_time": "20 minutes"
            },
            {
                "id": 4,
                "title": "Avocado Toast",
                "ingredients": ["bread", "avocado", "lemon juice", "salt", "pepper", "red pepper flakes"],
                "instructions": ["Toast bread slices", "Mash avocado with lemon juice and seasonings", "Spread on toast"],
                "category": "breakfast",
                "prep_time": "5 minutes"
            },
            {
                "id": 5,
                "title": "Chicken and Rice",
                "ingredients": ["chicken breast", "rice", "onions", "garlic", "chicken broth", "mixed herbs"],
                "instructions": ["Brown chicken in pan", "Add rice and broth", "Simmer until cooked"],
                "category": "main dish",
                "prep_time": "30 minutes"
            }
        ]

    def save_sample_recipes(self):
        """
        Save the sample recipes to the JSON file.
        """
        with open(self.recipes_file_path, 'w', encoding='utf-8') as f:
            json.dump(self.recipes, f, indent=2)

    def create_embeddings(self):
        """
        Create embeddings for all recipes based on their ingredients and descriptions.
        """
        texts_to_embed = []
        for recipe in self.recipes:
            # Create a text representation of the recipe for embedding
            text = f"{recipe['title']} ingredients: {', '.join(recipe['ingredients'])} {recipe.get('category', '')}"
            texts_to_embed.append(text)

        # Generate embeddings using the sentence transformer model
        self.embeddings = self.model.encode(texts_to_embed)
        # Normalize embeddings for cosine similarity
        self.embeddings = self.embeddings.astype('float32')
        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        self.embeddings /= norms

    def build_index(self):
        """
        Build the FAISS index for efficient similarity search.
        """
        dimension = self.embeddings.shape[1]
        # Use IndexFlatIP for inner product (cosine similarity with normalized vectors)
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(self.embeddings)

    def retrieve_similar_recipes(self, query_ingredients: List[str], top_k: int = 3) -> List[Dict]:
        """
        Retrieve the top-k most similar recipes based on the provided ingredients.

        Args:
            query_ingredients: List of ingredients to match against
            top_k: Number of similar recipes to return (default 3)

        Returns:
            List of dictionaries containing the most similar recipes
        """
        # Create a query text from the ingredients
        query_text = f"recipe with ingredients: {', '.join(query_ingredients)}"

        # Encode the query
        query_embedding = self.model.encode([query_text]).astype('float32')

        # Normalize the query embedding
        norms = np.linalg.norm(query_embedding, axis=1, keepdims=True)
        query_embedding /= norms

        # Perform similarity search
        similarities, indices = self.index.search(query_embedding, min(top_k, len(self.recipes)))

        # Return the matching recipes
        results = []
        for idx in indices[0]:
            if idx < len(self.recipes):
                recipe = self.recipes[idx]
                # Add the similarity score to the result
                recipe_copy = recipe.copy()
                results.append(recipe_copy)

        return results


# Example usage
if __name__ == "__main__":
    # Initialize the RAG system
    rag_system = BasicRecipeRAG()

    # Example: Find recipes similar to one with specific ingredients
    sample_ingredients = ["chicken", "rice", "onions", "garlic"]
    similar_recipes = rag_system.retrieve_similar_recipes(sample_ingredients, top_k=3)

    print(f"Top 3 recipes similar to ingredients: {', '.join(sample_ingredients)}")
    for i, recipe in enumerate(similar_recipes, 1):
        print(f"{i}. {recipe['title']}")
        print(f"   Ingredients: {', '.join(recipe['ingredients'])}")
        print(f"   Category: {recipe.get('category', 'N/A')}")
        print()