import pytest
from src.utils.response_parser import ResponseParser

@pytest.mark.asyncio
async def test_parse_and_enforce_structure():
    """Test that the response parser adds missing sections to recipe responses."""
    parser = ResponseParser()

    # Test response that looks like a recipe (has ingredients and instructions)
    recipe_response = "Ingredients:\n- 2 cups flour\n- 1 cup sugar\n\nInstructions:\n1. Mix ingredients\n2. Bake for 30 minutes"
    processed_response = await parser.parse_and_enforce_structure(recipe_response)

    # Check that required sections are added for a recipe response
    assert "Reasoning:" in processed_response
    assert "Substitutions:" in processed_response
    assert "Nutrition notes:" in processed_response
    assert "Variations:" in processed_response

    # Test response that is just general text (should not get sections added)
    general_response = "This is a response without required sections."
    processed_general_response = await parser.parse_and_enforce_structure(general_response)

    # Check that required sections are NOT added for general response
    assert "Reasoning:" not in processed_general_response
    assert "Substitutions:" not in processed_general_response
    assert "Nutrition notes:" not in processed_general_response
    assert "Variations:" not in processed_general_response


@pytest.mark.asyncio
async def test_parse_and_enforce_structure_preserves_existing():
    """Test that the response parser preserves existing sections."""
    parser = ResponseParser()

    # Test response with some sections but that looks like a recipe (has ingredients/instructions)
    response_with_sections = "Ingredients:\n- 2 cups flour\n- 1 cup sugar\n\nInstructions:\n1. Mix ingredients\n2. Bake for 30 minutes\n\nReasoning: This is the reasoning.\n\nSome other content."
    processed_response = await parser.parse_and_enforce_structure(response_with_sections)

    # Check that existing sections are preserved
    assert "Reasoning: This is the reasoning." in processed_response
    # And that missing sections are added
    assert "Substitutions:" in processed_response
    assert "Nutrition notes:" in processed_response
    assert "Variations:" in processed_response


@pytest.mark.asyncio
async def test_extract_reasoning_sections():
    """Test that the response parser can extract reasoning sections."""
    parser = ResponseParser()

    response_with_sections = "Recipe content.\n\nReasoning: This is the reasoning.\n\nSubstitutions: These are substitutions.\n\nNutrition notes: These are nutrition notes.\n\nVariations: These are variations."

    sections = await parser.extract_reasoning_sections(response_with_sections)

    assert "Reasoning:" in sections
    assert "Substitutions:" in sections
    assert "Nutrition notes:" in sections
    assert "Variations:" in sections

    assert sections["Reasoning:"].strip() == "This is the reasoning."
    assert sections["Substitutions:"].strip() == "These are substitutions."


@pytest.mark.asyncio
async def test_validate_reasoning_presence():
    """Test that the response parser can validate reasoning presence."""
    parser = ResponseParser()

    response_with_all_sections = "Recipe.\n\nReasoning: Some reasoning.\n\nSubstitutions: Some substitutions.\n\nNutrition notes: Some notes.\n\nVariations: Some variations."
    response_with_missing_sections = "Recipe.\n\nReasoning: Some reasoning."

    assert await parser.validate_reasoning_presence(response_with_all_sections) == True
    assert await parser.validate_reasoning_presence(response_with_missing_sections) == False