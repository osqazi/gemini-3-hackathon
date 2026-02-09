"""
Gemini API Client Module for RecipeRAG
Handles communication with Google's Gemini 3 API for multimodal processing
"""
import os
import google.generativeai as genai
from google.generativeai import GenerationConfig
from PIL import Image
import io
from typing import List, Dict, Any, Optional
import logging
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Import settings to get the model name from config
from core.config import settings

logger = logging.getLogger(__name__)

class GeminiClient:
    """
    Client for interacting with Google's Gemini API
    Handles multimodal requests (image + text) for ingredient detection and recipe generation
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = None):
        """
        Initialize the Gemini client with API key and model

        Args:
            api_key: Google API key (defaults to GEMINI_API_KEY env var)
            model_name: Name of the Gemini model to use (defaults to settings.GEMINI_MODEL_NAME)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not found")

        genai.configure(api_key=self.api_key)

        # Use the model name from settings if not provided
        self.model_name = model_name or settings.GEMINI_MODEL_NAME
        
        # For multimodal (image + text) processing, we need vision-capable models
        # Using models in order of preference, with fallbacks for access issues
        available_models = [self.model_name, "gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"]

        self.model = None
        for model_candidate in available_models:
            try:
                self.model = genai.GenerativeModel(model_candidate)
                self.model_name = model_candidate
                logger.info(f"Successfully initialized Gemini model: {self.model_name}")
                break
            except Exception as e:
                logger.warning(f"Could not initialize {model_candidate}, trying next: {str(e)}")
                continue

        if self.model is None:
            # If no preferred models are available, try to use whatever is available
            logger.warning("Could not initialize any preferred models, attempting to use fallback...")
            try:
                # Try with the first available model as a fallback
                self.model = genai.GenerativeModel("gemini-pro")  # Use the standard model
                self.model_name = "gemini-pro"
                logger.info(f"Initialized fallback model: {self.model_name}")
            except Exception as e:
                logger.error(f"All model initialization attempts failed: {e}")
                raise ValueError(f"Could not initialize any Gemini model. Please check your API key access and available models: {e}")

    def analyze_image_for_ingredients(self, image_path: str, custom_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze an image to detect ingredients and suggest a recipe

        Args:
            image_path: Path to the image file to analyze
            custom_prompt: Custom prompt to override the default (optional)

        Returns:
            Dictionary containing detected ingredients, quantities, observations, and recipe suggestion
        """
        start_time = time.time()

        # Load the image
        if isinstance(image_path, str):
            image = Image.open(image_path)
        elif isinstance(image_path, Image.Image):
            image = image_path
        else:
            raise ValueError("image_path must be a file path string or PIL Image object")

        # Create the prompt
        if custom_prompt is None:
            custom_prompt = """Analyze this food image and provide:

1. A list of ingredients detected in the image
2. Approximate quantities for each ingredient (e.g., "1 cup", "2-3 pieces", "small amount")
3. Any observations about the freshness or condition of ingredients
4. A simple recipe suggestion using the detected ingredients

Keep your response structured and concise."""

        try:
            # Call the Gemini API
            response = self.model.generate_content([custom_prompt, image])

            processing_time = time.time() - start_time

            return {
                "success": True,
                "response_text": response.text,
                "processing_time": processing_time,
                "model_used": self.model_name
            }
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Error calling Gemini API: {e}")

            return {
                "success": False,
                "error": str(e),
                "processing_time": processing_time
            }

    def generate_recipe_from_ingredients(self, ingredients: List[str], preferences: Optional[Dict[str, Any]] = None,
                                       rag_context: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Generate a recipe based on ingredients and preferences using optional RAG context

        Args:
            ingredients: List of available ingredients
            preferences: User preferences dictionary with complete structure (dietary restrictions, allergies, etc.)
            rag_context: List of similar recipes retrieved from database (optional)

        Returns:
            Dictionary containing generated recipe and metadata
        """
        start_time = time.time()

        # Format preferences comprehensively for the prompt
        if preferences and isinstance(preferences, dict):
            # Format each preference category
            formatted_prefs = []

            dietary_restrictions = preferences.get('dietary_restrictions', [])
            if dietary_restrictions:
                formatted_prefs.append(f"Dietary restrictions: {', '.join(dietary_restrictions)}")
            else:
                formatted_prefs.append("Dietary restrictions: none specified")

            allergies = preferences.get('allergies', [])
            if allergies:
                formatted_prefs.append(f"Allergies: {', '.join(allergies)}")
            else:
                formatted_prefs.append("Allergies: none specified")

            taste_prefs = preferences.get('taste_preferences', {})
            if taste_prefs:
                formatted_prefs.append(f"Taste preferences: {str(taste_prefs)}")
            else:
                formatted_prefs.append("Taste preferences: none specified")

            cooking_constraints = preferences.get('cooking_constraints', [])
            if cooking_constraints:
                formatted_prefs.append(f"Cooking constraints: {', '.join(cooking_constraints)}")
            else:
                formatted_prefs.append("Cooking constraints: none specified")

            ingredient_exclusions = preferences.get('ingredient_exclusions', [])
            if ingredient_exclusions:
                formatted_prefs.append(f"Ingredient exclusions: {', '.join(ingredient_exclusions)}")
            else:
                formatted_prefs.append("Ingredient exclusions: none specified")

            preferences_str = "; ".join(formatted_prefs)
        else:
            preferences_str = "no specific preferences provided"

        # Create the prompt with RAG context if provided
        if rag_context:
            rag_context_str = "\n\nSimilar recipes found in database:\n"
            for i, recipe in enumerate(rag_context, 1):
                rag_context_str += f"{i}. {recipe.get('title', 'Untitled Recipe')}\n"
                ingreds = recipe.get('ingredients', [])
                if ingreds:
                    rag_context_str += f"   Ingredients: {', '.join(ingreds[:3])}...\n"
                rag_context_str += f"   Similarity: {recipe.get('similarity', 'N/A'):.2f}\n\n"
        else:
            rag_context_str = "\n\n(No similar recipes found in database)\n"

        prompt = f"""Based on these ingredients: {', '.join(ingredients)}

And these user preferences:
{preferences_str}

{rag_context_str}

Generate a recipe that incorporates these ingredients. Include:
1. A recipe title
2. Updated ingredient list (may include additional ingredients for flavor/texture)
3. Step-by-step cooking instructions
4. Estimated cooking time
5. Serving size
6. Explain your reasoning for ingredient choices and cooking methods
7. Address specific dietary restrictions, allergies, and ingredient exclusions if mentioned

Keep the recipe practical and achievable with the provided ingredients and strictly adhere to any dietary restrictions, allergies, or ingredient exclusions."""

        try:
            # Call the Gemini API
            response = self.model.generate_content(prompt)

            processing_time = time.time() - start_time

            return {
                "success": True,
                "response_text": response.text,
                "processing_time": processing_time,
                "model_used": self.model_name
            }
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Error calling Gemini API for recipe generation: {e}")

            return {
                "success": False,
                "error": str(e),
                "processing_time": processing_time
            }

    def embed_text(self, text: str) -> List[float]:
        """
        Generate an embedding for the given text using Gemini's embedding capabilities

        Note: This is a placeholder implementation. Actual embedding would typically use
        sentence-transformers or a dedicated embedding model rather than Gemini.
        """
        # In a real implementation, we would use an embedding model like sentence-transformers
        # For now, we'll return a placeholder to maintain interface compatibility
        # The actual embedding will be handled by the embedding service
        raise NotImplementedError("Use sentence-transformers for embeddings, not Gemini API")

    def health_check(self) -> bool:
        """
        Perform a basic health check by making a simple API call

        Returns:
            bool: True if API is accessible and responding, False otherwise
        """
        try:
            # Make a simple text-only request to check API health
            response = self.model.generate_content("Hello, are you working?")
            return response and len(response.text) > 0
        except Exception as e:
            logger.error(f"Gemini API health check failed: {e}")
            return False

# Global gemini client instance (singleton pattern)
gemini_client = None

def get_gemini_client() -> GeminiClient:
    """
    Get or create the Gemini client instance

    Returns:
        GeminiClient: Singleton instance of the Gemini client
    """
    global gemini_client
    if gemini_client is None:
        gemini_client = GeminiClient(model_name=settings.GEMINI_MODEL_NAME)
    return gemini_client