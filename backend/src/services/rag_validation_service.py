from typing import Dict, Any, List
import logging
from ..models.recipe_card import RecipeCard  # Assuming this is the recipe model

logger = logging.getLogger(__name__)

class RAGValidationService:
    """
    Service for validating generated recipes against RAG data to prevent hallucinations
    and ensure that recipes are grounded in reliable information.
    """

    def __init__(self):
        # In a real implementation, this would connect to the RAG system
        # For now, we'll simulate validation
        pass

    def validate_recipe_against_rag(self, recipe_data: Dict[str, Any], rag_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate the generated recipe against the RAG context to prevent hallucinations.

        Args:
            recipe_data: The generated recipe data
            rag_context: The RAG context used for generation

        Returns:
            Validation results including any detected hallucinations
        """
        validation_results = {
            'is_valid': True,
            'warnings': [],
            'suggestions': [],
            'hallucinations_detected': []
        }

        # Validate ingredients
        if 'ingredients' in recipe_data:
            for ingredient in recipe_data['ingredients']:
                if isinstance(ingredient, dict):
                    ingredient_name = ingredient.get('name', '').lower()
                else:
                    ingredient_name = str(ingredient).lower()

                # Check if ingredient appears in RAG context
                if not self._ingredient_in_rag_context(ingredient_name, rag_context):
                    validation_results['hallucinations_detected'].append({
                        'type': 'ingredient',
                        'value': ingredient_name,
                        'issue': 'Ingredient not found in RAG context'
                    })
                    validation_results['is_valid'] = False

        # Validate cooking methods
        if 'instructions' in recipe_data:
            for instruction in recipe_data['instructions']:
                # Look for cooking methods that might be hallucinated
                if not self._instruction_in_rag_context(str(instruction), rag_context):
                    validation_results['warnings'].append({
                        'type': 'instruction',
                        'value': str(instruction)[:50] + '...',
                        'issue': 'Instruction not clearly supported by RAG context'
                    })

        # Validate nutritional claims
        if 'nutrition_info' in recipe_data:
            for nutrient, value in recipe_data['nutrition_info'].items():
                if not self._nutrition_in_rag_context(nutrient, rag_context):
                    validation_results['warnings'].append({
                        'type': 'nutrition',
                        'value': f'{nutrient}: {value}',
                        'issue': f'Nutritional claim for {nutrient} not clearly supported by RAG context'
                    })

        # Validate recipe title
        if 'title' in recipe_data:
            if not self._title_in_rag_context(recipe_data['title'], rag_context):
                validation_results['warnings'].append({
                    'type': 'title',
                    'value': recipe_data['title'],
                    'issue': 'Recipe title not clearly supported by RAG context'
                })

        return validation_results

    def _ingredient_in_rag_context(self, ingredient: str, rag_context: List[Dict[str, Any]]) -> bool:
        """
        Check if an ingredient appears in the RAG context.

        Args:
            ingredient: The ingredient to check
            rag_context: The RAG context

        Returns:
            True if ingredient is found in context, False otherwise
        """
        for context_item in rag_context:
            if 'content' in context_item:
                content = context_item['content'].lower()
                if ingredient in content:
                    return True
            elif 'ingredients' in context_item:
                context_ingredients = [i.lower() for i in context_item['ingredients']]
                if ingredient in context_ingredients:
                    return True
        return False

    def _instruction_in_rag_context(self, instruction: str, rag_context: List[Dict[str, Any]]) -> bool:
        """
        Check if an instruction is supported by the RAG context.

        Args:
            instruction: The instruction to check
            rag_context: The RAG context

        Returns:
            True if instruction is supported by context, False otherwise
        """
        instruction_lower = instruction.lower()
        for context_item in rag_context:
            if 'content' in context_item:
                content = context_item['content'].lower()
                # Check for common cooking verbs/actions
                if any(word in content for word in ['cook', 'boil', 'fry', 'bake', 'stir', 'mix', 'add']):
                    if any(word in instruction_lower for word in ['cook', 'boil', 'fry', 'bake', 'stir', 'mix', 'add']):
                        return True
        return False

    def _nutrition_in_rag_context(self, nutrient: str, rag_context: List[Dict[str, Any]]) -> bool:
        """
        Check if nutritional information is supported by the RAG context.

        Args:
            nutrient: The nutrient to check
            rag_context: The RAG context

        Returns:
            True if nutrition info is supported by context, False otherwise
        """
        nutrient_lower = nutrient.lower()
        for context_item in rag_context:
            if 'content' in context_item:
                content = context_item['content'].lower()
                if nutrient_lower in content:
                    return True
        return False

    def _title_in_rag_context(self, title: str, rag_context: List[Dict[str, Any]]) -> bool:
        """
        Check if recipe title is supported by the RAG context.

        Args:
            title: The recipe title to check
            rag_context: The RAG context

        Returns:
            True if title is supported by context, False otherwise
        """
        title_lower = title.lower()
        for context_item in rag_context:
            if 'content' in context_item:
                content = context_item['content'].lower()
                if any(word in content for word in title_lower.split()):
                    return True
            if 'title' in context_item:
                context_title = context_item['title'].lower()
                if any(word in context_title for word in title_lower.split()):
                    return True
        return False

    def filter_hallucinated_ingredients(self, recipe_data: Dict[str, Any], rag_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Filter out hallucinated ingredients from a recipe, keeping only those
        that are supported by the RAG context.

        Args:
            recipe_data: The recipe data to filter
            rag_context: The RAG context for validation

        Returns:
            Filtered recipe data with hallucinated ingredients removed
        """
        filtered_recipe = recipe_data.copy()

        if 'ingredients' in filtered_recipe:
            valid_ingredients = []
            for ingredient in filtered_recipe['ingredients']:
                if isinstance(ingredient, dict):
                    ingredient_name = ingredient.get('name', '').lower()
                else:
                    ingredient_name = str(ingredient).lower()

                if self._ingredient_in_rag_context(ingredient_name, rag_context):
                    valid_ingredients.append(ingredient)
                else:
                    logger.warning(f"Removing hallucinated ingredient: {ingredient}")

            filtered_recipe['ingredients'] = valid_ingredients

        return filtered_recipe


# Global instance
rag_validation_service = RAGValidationService()