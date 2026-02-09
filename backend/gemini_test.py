"""
RecipeRAG Phase 1: Gemini 3 API Integration with Basic RAG

This script connects to the Gemini 3 API to perform multimodal image analysis for ingredient detection.
It also integrates with a basic RAG system to retrieve similar recipes.
"""
import os
import sys
import time
from pathlib import Path

# Add the current directory to the path so we can import rag_basic
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import google.generativeai as genai
    from dotenv import load_dotenv
    from PIL import Image
    from rag_basic import BasicRecipeRAG
except ImportError as e:
    print(f"Import error: {e}")
    print("Please install required packages: pip install -r requirements.txt")
    sys.exit(1)


def setup_api():
    """
    Load environment variables and configure the Gemini API.
    """
    # Load environment variables from .env file
    load_dotenv()

    # Get the API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not found. "
                         "Please set it in your .env file based on .env.example")

    # Configure the API
    genai.configure(api_key=api_key)

    # Select the model
    # Note: Update this to the correct Gemini 3 model name when available
    model_name = os.environ.get("GEMINI_MODEL_NAME", "gemini-pro-vision")  # Using vision-capable model
    model = genai.GenerativeModel(model_name)

    return model


def load_prompt_template(prompt_path="prompts/ingredient-detection-v1.txt"):
    """
    Load the prompt template from the specified file.

    Args:
        prompt_path: Path to the prompt template file

    Returns:
        str: The content of the prompt template
    """
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"Prompt template not found at {prompt_path}")
        print("Creating a default prompt template...")

        # Create the prompts directory if it doesn't exist
        os.makedirs(os.path.dirname(prompt_path), exist_ok=True)

        # Create a default prompt template
        default_prompt = """Analyze this food image and provide:

1. A list of ingredients detected in the image
2. Approximate quantities for each ingredient (e.g., "1 cup", "2-3 pieces", "small amount")
3. Any observations about the freshness or condition of ingredients
4. A simple recipe suggestion using the detected ingredients

Keep your response structured and concise."""

        with open(prompt_path, 'w', encoding='utf-8') as f:
            f.write(default_prompt)

        print(f"Default prompt template created at {prompt_path}")
        return default_prompt


def analyze_image_with_gemini(model, image_path, prompt_template):
    """
    Analyze a food image using the Gemini API.

    Args:
        model: The configured Gemini model
        image_path: Path to the image file
        prompt_template: The prompt template to use

    Returns:
        str: The API response
    """
    # Load the image
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")

    image = Image.open(image_path)

    # Prepare the prompt with the image
    content = [prompt_template, image]

    # Generate content
    print("Sending request to Gemini API...")
    start_time = time.time()
    response = model.generate_content(content)
    end_time = time.time()

    print(f"Gemini API response received in {end_time - start_time:.2f} seconds")

    return response.text


def extract_ingredients_from_response(response_text):
    """
    Simple function to extract ingredient-like terms from the Gemini response.
    This is a basic implementation that could be improved with more sophisticated NLP.

    Args:
        response_text: The text response from Gemini

    Returns:
        list: A list of identified ingredients
    """
    # This is a simplified extraction - in a real implementation, you'd want more
    # sophisticated NLP to properly identify ingredients from the response
    import re

    # Look for ingredients mentioned in the response
    # This is a basic approach - real implementation would use better NLP
    response_lower = response_text.lower()

    # Common ingredient indicators
    ingredient_indicators = ['ingredient:', 'contains:', 'includes:', 'has:', 'with:']

    # Try to find ingredients based on common phrases
    ingredients = []

    # Split response into lines to look for ingredient lists
    lines = response_text.split('\n')
    for line in lines:
        line_lower = line.lower().strip()
        if any(indicator in line_lower for indicator in ingredient_indicators):
            # Extract potential ingredients from this line
            # This is a simplified approach
            words = line.split()
            for word in words:
                # Remove punctuation and convert to lowercase
                clean_word = re.sub(r'[^\w\s]', '', word.lower())
                # Add if it seems like a food-related term
                if len(clean_word) > 2 and not any(stopword in clean_word for stopword in ['the', 'and', 'with', 'or', 'is', 'are', 'a', 'an', 'of', 'in']):
                    if clean_word not in ingredients:
                        ingredients.append(clean_word)

    # Also extract from numbered lists (like "1. onions")
    pattern = r'\d+\.\s*([a-zA-Z\s]+)'
    matches = re.findall(pattern, response_text)
    for match in matches:
        words = match.strip().split()
        for word in words:
            clean_word = re.sub(r'[^\w\s]', '', word.lower())
            if len(clean_word) > 2 and clean_word not in ingredients:
                ingredients.append(clean_word)

    # Filter to more likely food ingredients
    food_words = [
        'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry',
        'lettuce', 'spinach', 'kale', 'cabbage', 'broccoli', 'cauliflower', 'carrot', 'onion', 'garlic',
        'potato', 'sweet potato', 'tomato', 'cucumber', 'pepper', 'mushroom', 'corn', 'pea', 'bean',
        'rice', 'pasta', 'bread', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'butter', 'cheese',
        'milk', 'egg', 'chicken', 'beef', 'pork', 'fish', 'shrimp', 'tofu', 'yogurt',
        'herb', 'spice', 'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro',
        'sauce', 'dressing', 'vinegar', 'wine', 'beer', 'coffee', 'tea'
    ]

    # Filter ingredients to include those that are known food words or appear to be ingredients
    filtered_ingredients = []
    for ingr in ingredients:
        if any(food_word in ingr or ingr in food_word for food_word in food_words) or len([w for w in ingr.split() if any(fw in w for fw in food_words)]) > 0:
            filtered_ingredients.append(ingr)

    return filtered_ingredients[:10]  # Return first 10 potential ingredients


def main():
    """
    Main function to run the RecipeRAG Phase 1 test.
    """
    if len(sys.argv) != 2:
        print("Usage: python gemini_test.py <image_path>")
        print("Example: python gemini_test.py samples/food_photo.jpg")
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        # Setup the Gemini API
        model = setup_api()
        print("✓ Gemini API configured successfully")

        # Load the prompt template
        prompt_template = load_prompt_template()
        print("✓ Prompt template loaded successfully")

        # Initialize the RAG system
        print("Initializing RAG system...")
        rag_system = BasicRecipeRAG()
        print("✓ RAG system initialized successfully")

        # Analyze the image
        result = analyze_image_with_gemini(model, image_path, prompt_template)
        print("\n" + "="*60)
        print("GEMINI 3 ANALYSIS RESULT:")
        print("="*60)
        print(result)
        print("="*60)

        # Extract ingredients from the response
        detected_ingredients = extract_ingredients_from_response(result)
        print(f"\nDetected ingredients: {detected_ingredients}")

        # Use the detected ingredients to find similar recipes via RAG
        if detected_ingredients:
            print(f"\nFinding recipes similar to ingredients: {', '.join(detected_ingredients[:5])}...")
            similar_recipes = rag_system.retrieve_similar_recipes(detected_ingredients, top_k=3)

            print("\n" + "="*60)
            print("TOP SIMILAR RECIPES FROM RAG SYSTEM:")
            print("="*60)
            for i, recipe in enumerate(similar_recipes, 1):
                print(f"{i}. {recipe['title']}")
                print(f"   Category: {recipe.get('category', 'N/A')}")
                print(f"   Prep Time: {recipe.get('prep_time', 'N/A')}")
                print(f"   Ingredients: {', '.join(recipe['ingredients'][:5])}{'...' if len(recipe['ingredients']) > 5 else ''}")
                print()
        else:
            print("\nNo ingredients detected from Gemini response. Cannot retrieve similar recipes.")

        print("RecipeRAG Phase 1 test completed successfully!")

    except FileNotFoundError as e:
        print(f"File error: {e}")
        sys.exit(1)
    except ValueError as e:
        print(f"Configuration error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()