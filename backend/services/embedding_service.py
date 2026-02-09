"""
Embedding Service for RecipeRAG
Handles generation of embeddings for recipes and similarity calculations
"""
from typing import List, Union
import logging
import numpy as np
from sentence_transformers import SentenceTransformer
import pickle
import os

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Service class for handling embedding operations
    Uses sentence-transformers/all-MiniLM-L6-v2 model for 384-dimensional embeddings
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding service with the specified model

        Args:
            model_name: Name of the sentence transformer model to use
        """
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text string

        Args:
            text: Input text to generate embedding for

        Returns:
            List of 384 floats representing the embedding vector
        """
        embedding = self.model.encode([text])[0]
        return embedding.tolist()

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple text strings

        Args:
            texts: List of input texts to generate embeddings for

        Returns:
            List of embedding vectors (each a list of 384 floats)
        """
        embeddings = self.model.encode(texts)
        return [emb.tolist() for emb in embeddings]

    def embed_ingredients(self, ingredients: List[str]) -> List[float]:
        """
        Generate embedding for a list of ingredients

        Args:
            ingredients: List of ingredient strings

        Returns:
            List of 384 floats representing the embedding vector
        """
        # Join ingredients into a single string for embedding
        ingredients_text = " ".join(ingredients)
        return self.embed_text(ingredients_text)

    def embed_recipe(self, title: str, ingredients: List[str], instructions: List[str] = None) -> List[float]:
        """
        Generate embedding for a complete recipe

        Args:
            title: Recipe title
            ingredients: List of ingredients
            instructions: List of instructions (optional)

        Returns:
            List of 384 floats representing the embedding vector
        """
        # Combine all recipe elements into a single text
        recipe_text = f"{title} " + " ".join(ingredients)
        if instructions:
            recipe_text += " " + " ".join(instructions)

        return self.embed_text(recipe_text)

    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Cosine similarity score between 0 and 1
        """
        # Convert to numpy arrays
        arr1 = np.array(embedding1)
        arr2 = np.array(embedding2)

        # Calculate cosine similarity
        dot_product = np.dot(arr1, arr2)
        norm1 = np.linalg.norm(arr1)
        norm2 = np.linalg.norm(arr2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = dot_product / (norm1 * norm2)

        # Ensure similarity is between 0 and 1
        return max(0.0, min(1.0, float(similarity)))

    def find_most_similar(self, query_embedding: List[float],
                         candidate_embeddings: List[List[float]],
                         top_k: int = 3) -> List[tuple]:
        """
        Find the most similar embeddings to the query

        Args:
            query_embedding: Embedding to compare against
            candidate_embeddings: List of candidate embeddings
            top_k: Number of most similar embeddings to return

        Returns:
            List of tuples (index, similarity_score) for the top-k most similar embeddings
        """
        similarities = []
        for i, candidate_emb in enumerate(candidate_embeddings):
            similarity = self.calculate_similarity(query_embedding, candidate_emb)
            similarities.append((i, similarity))

        # Sort by similarity score in descending order and return top-k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]


# Global embedding service instance (singleton pattern)
embedding_service = None

def get_embedding_service() -> EmbeddingService:
    """
    Get or create the embedding service instance

    Returns:
        EmbeddingService: Singleton instance of the embedding service
    """
    global embedding_service
    if embedding_service is None:
        embedding_service = EmbeddingService()
    return embedding_service