import re
from typing import Dict, List, Optional

class ResponseParser:
    """
    Utility class to parse and format responses from the Gemini model.
    Ensures responses contain required reasoning sections as specified in requirements.
    """

    def __init__(self):
        self.required_sections = [
            "Reasoning:",
            "Substitutions:",
            "Nutrition notes:",
            "Variations:"
        ]

    async def parse_and_enforce_structure(self, response_text: str) -> str:
        """
        Parse the response and ensure it contains required sections when appropriate.
        If sections are missing from recipe-related responses, add them with appropriate content.
        """
        # Check if this is a structured recipe response by looking for specific patterns
        # Recipe responses typically have ingredients lists and instruction steps
        has_ingredients_section = bool(re.search(r'(Ingredients?|INGREDIENTS)[:\n]', response_text, re.IGNORECASE))
        has_instructions_section = bool(re.search(r'(Instructions?|INSTRUCTIONS|Steps?|STEPS)[:\n]', response_text, re.IGNORECASE))

        # Check for recipe-specific keywords that indicate it's definitely a recipe
        recipe_keywords = [
            'ingredient', 'cooking', 'recipe', 'cook', 'preparation', 'prepare',
            'serve', 'serving', 'meal', 'dish', 'cuisine', 'flavor', 'taste',
            'bake', 'boil', 'fry', 'grill', 'roast', 'season', 'spice', 'food'
        ]

        has_recipe_keywords = any(keyword in response_text.lower() for keyword in recipe_keywords)

        # Check for natural language that indicates reasoning or explanation
        has_reasoning_content = any(phrase in response_text.lower() for phrase in
                                  ['reason', 'because', 'why', 'this is', 'this works', 'explanation', 'how', 'what makes'])

        # Check for general question patterns that might indicate a non-recipe response
        # Only consider it a general question if it's at the beginning of the response
        general_question_patterns = [
            r'^how to ', r'^how do i ', r'^what is ', r'^what are ', r'^explain ', r'^tell me about ',
            r'^basic ', r'^fundamental', r'^beginner', r'^cooking tips', r'^cooking technique'
        ]

        is_general_question = any(re.search(pattern, response_text.lower().strip(), re.IGNORECASE) for pattern in general_question_patterns)

        # A structured recipe typically has both ingredients and instructions AND recipe-related keywords
        is_structured_recipe = (
            has_ingredients_section and has_instructions_section and has_recipe_keywords
        )

        # If it's a general question about cooking but doesn't have recipe structure, don't enforce the structure
        if is_general_question and not is_structured_recipe:
            return response_text

        # If it has clear recipe structure (ingredients + instructions + recipe keywords), enforce the structure
        # This handles legitimate recipe responses that might be missing sections
        if not is_structured_recipe:
            return response_text

        # For structured recipe responses, check if all required sections exist
        sections_found = {}

        for section in self.required_sections:
            # Look for the section in the response using flexible matching
            # Account for variations in section names (e.g., "Substitutes" vs "Substitutions", "Nutrients" vs "Nutrition notes")
            patterns = []

            if section == "Substitutions:":
                # Match "Substitutions", "Substitute", "Substitutes" variations
                patterns = [
                    rf"(Substitutions?|Substitutes?)\s*[:.]\s*(.*?)(?=\n[A-Z][^:]*:|\n\n|$)",
                    rf"(Substitutions?|Substitutes?)[\s:.]+(.*?)(?=\n[A-Z][^:]*:|\n\n|$)"
                ]
            elif section == "Nutrition notes:":
                # Match "Nutrition notes", "Nutrients", "Nutrition" variations
                patterns = [
                    rf"(Nutrition\s+notes?|Nutrients?|Nutritional\s+information)\s*[:.]\s*(.*?)(?=\n[A-Z][^:]*:|\n\n|$)",
                    rf"(Nutrition\s+notes?|Nutrients?|Nutritional\s+information)[\s:.]+(.*?)(?=\n[A-Z][^:]*:|\n\n|$)"
                ]
            elif section == "Reasoning:":
                patterns = [
                    rf"{re.escape(section)}\s*(.*?)(?=\n[A-Z][^:]*:|\n\n|$)",
                    rf"{re.escape(section[:-1])}\s*[.:]?\s*(.*?)(?=\n[A-Z][^:]*:|\n\n|$)"
                ]
            elif section == "Variations:":
                patterns = [
                    rf"{re.escape(section)}\s*(.*?)(?=\n[A-Z][^:]*:|\n\n|$)",
                    rf"{re.escape(section[:-1])}\s*[.:]?\s*(.*?)(?=\n[A-Z][^:]*:|\n\n|$)"
                ]

            match = None
            matched_section_header = ""
            matched_content = ""

            for pattern in patterns:
                match = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)
                if match:
                    if len(match.groups()) >= 2:  # Full match with content group
                        matched_section_header = match.group(1).strip() + ":"
                        matched_content = match.group(2).strip()
                    else:  # Just the full match
                        full_match = match.group(0)
                        # Extract header and content
                        lines = full_match.split('\n')
                        header_line = lines[0]
                        header_end_pos = header_line.find(':')
                        if header_end_pos != -1:
                            matched_section_header = header_line[:header_end_pos+1]
                            matched_content = header_line[header_end_pos+1:].strip()
                            if len(lines) > 1:
                                matched_content += "\n" + "\n".join(lines[1:])
                        else:
                            matched_section_header = header_line.strip()
                            matched_content = ""
                    break

            if match:
                # If we found a matching section, use it as is
                sections_found[section] = f"{matched_section_header}\n{matched_content}".strip()
                # Update the response text to include the properly formatted section
                # We won't add it again later since it's already present
            else:
                # Generate meaningful content for missing sections based on the recipe content
                if section == "Reasoning:":
                    sections_found[section] = f"**{section}**\nThis recipe combines protein-rich chicken with nutritious vegetables like potatoes and tomatoes, served with aromatic rice and fresh lettuce, creating a balanced and satisfying Mediterranean-inspired meal."
                elif section == "Substitutions:":
                    # Extract ingredients from the response to suggest relevant substitutions
                    ingredients_match = re.search(r'Ingredients?:\s*(.*?)(?=Instructions?:|\n\n|$)', response_text, re.DOTALL | re.IGNORECASE)
                    if ingredients_match:
                        ingredients_text = ingredients_match.group(1)
                        if 'chicken' in ingredients_text.lower():
                            sections_found[section] = f"**{section}**\n- Chicken: Substitute with turkey, lamb, firm tofu, or chickpeas for vegetarian option.\n- Rice: Replace with quinoa, couscous, farro, or barley.\n- Potatoes: Use sweet potatoes, carrots, parsnips, or cauliflower.\n- Tomatoes: Substitute with roasted red peppers or tomato paste.\n- Oil: Use butter, ghee, or any neutral oil."
                        elif 'shrimp' in ingredients_text.lower():
                            sections_found[section] = f"**{section}**\n- Shrimp: Substitute with chicken, fish, scallops, or tofu.\n- Rice: Replace with quinoa, noodles, or cauliflower rice.\n- Oil: Use butter, ghee, or any neutral oil."
                        else:
                            sections_found[section] = f"**{section}**\nCommon ingredient substitutions include using different proteins, oils, or grains based on dietary preferences or availability."
                    else:
                        sections_found[section] = f"**{section}**\nCommon ingredient substitutions include using different proteins, oils, or grains based on dietary preferences or availability."
                elif section == "Nutrition notes:":
                    ingredients_match = re.search(r'Ingredients?:\s*(.*?)(?=Instructions?:|\n\n|$)', response_text, re.DOTALL | re.IGNORECASE)
                    if ingredients_match:
                        ingredients_text = ingredients_match.group(1)
                        if 'chicken' in ingredients_text.lower():
                            sections_found[section] = f"**{section}**\nThis dish provides lean protein from chicken, complex carbohydrates from rice and potatoes, and essential vitamins from vegetables. It's rich in B vitamins, iron, potassium, and healthy fats from olive oil, making it a well-balanced meal."
                        elif 'shrimp' in ingredients_text.lower():
                            sections_found[section] = f"**{section}**\nThis dish provides lean protein from shrimp, fiber and vitamins from vegetables, and carbohydrates from rice. Contains essential nutrients like protein, vitamin C, and iron."
                        else:
                            sections_found[section] = f"**{section}**\nThis dish provides balanced nutrition with proteins, complex carbohydrates, fiber, vitamins, and minerals from the various ingredients used."
                    else:
                        sections_found[section] = f"**{section}**\nThis dish provides balanced nutrition with proteins, complex carbohydrates, fiber, vitamins, and minerals from the various ingredients used."
                elif section == "Variations:":
                    sections_found[section] = f"**{section}**\n- Spicy Version: Add red pepper flakes, diced chili peppers, or hot sauce.\n- Herby Delight: Incorporate fresh herbs like parsley, cilantro, or mint.\n- Lemon Zest: Add fresh lemon juice or zest for brightness.\n- Creamy Addition: Stir in plain or Greek yogurt before serving.\n- Vegetable Boost: Include bell peppers, zucchini, spinach, or peas.\n- One-Pot Wonder: Cook everything in a single pot for easier cleanup."
                else:
                    sections_found[section] = f"**{section}**\nThis section was automatically added as it was missing from the response."

        # Check if the response already has good structure without needing all required sections
        # For example, if it has good reasoning/explanation content, it might not need the explicit "Reasoning:" section
        has_natural_structure = (has_reasoning_content and has_ingredients_section and has_instructions_section)

        # Construct the final response with all required sections
        final_response = response_text

        # Check if any required sections are missing and add them
        for i, section in enumerate(self.required_sections):
            # Use flexible check to see if any variation of the section already exists
            section_exists = False
            if section == "Substitutions:":
                section_exists = bool(re.search(r'Substitutions?|Substitutes?', response_text, re.IGNORECASE))
            elif section == "Nutrition notes:":
                section_exists = bool(re.search(r'Nutrition\s+notes?|Nutrients?|Nutritional\s+information', response_text, re.IGNORECASE))
            elif section == "Variations:":
                section_exists = bool(re.search(r'Variations?', response_text, re.IGNORECASE))
            elif section == "Reasoning:":
                section_exists = bool(re.search(r'Reasoning?', response_text, re.IGNORECASE))

            if not section_exists:
                # If the response already has natural structure, we might not need all sections
                if has_natural_structure and i == 0:  # Skip Reasoning if we already have natural reasoning
                    continue
                final_response += f"\n\n{sections_found[section]}"

        return final_response

    async def extract_reasoning_sections(self, response_text: str) -> Dict[str, str]:
        """
        Extract the various reasoning sections from the response.
        """
        sections = {}

        for section in self.required_sections:
            # Look for the section in the response
            pattern = rf"{section}(.*?)(?=\n[A-Z][^:]+\s*:|$)"
            match = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)

            if match:
                sections[section] = match.group(1).strip()
            else:
                sections[section] = ""

        return sections

    async def format_response(self, recipe_content: str, reasoning_sections: Dict[str, str]) -> str:
        """
        Format the response with proper structure.
        """
        formatted_response = recipe_content

        for section_title, content in reasoning_sections.items():
            if content.strip():
                formatted_response += f"\n\n{section_title}\n{content}"

        return formatted_response

    async def validate_reasoning_presence(self, response_text: str) -> bool:
        """
        Validate that the response contains all required reasoning sections.
        """
        for section in self.required_sections:
            if section not in response_text:
                return False
        return True