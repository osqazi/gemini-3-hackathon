# Phase 3: Multi-Turn Conversation Examples

## Example 1: Vegan Conversion
**Turn 1:** "Create a pasta dish with tomatoes and basil"
**Turn 2:** "Make it vegan"
**Turn 3:** "Add more protein"
**Turn 4:** "Make it lower sodium"

## Example 2: Dietary Restriction Refinement
**Turn 1:** "Suggest a chicken curry recipe"
**Turn 2:** "Make it gluten-free"
**Turn 3:** "Less spicy, please"
**Turn 4:** "Add coconut milk for creaminess"

## Example 3: Ingredient-Based Refinement
**Turn 1:** "What can I make with these vegetables?" [image of vegetables]
**Turn 2:** "Make it suitable for dinner guests"
**Turn 3:** "Can you make it ahead of time?"
**Turn 4:** "Add wine pairing suggestions"

## Expected Behavior
- Each refinement respects all previous constraints
- Reasoning is clearly explained
- Substitutions are appropriate and safe
- Nutritional considerations are addressed
- Response time remains under 4 seconds

## Limitations and Edge Cases

### Server Restart Behavior
- Sessions are stored in-memory only for hackathon constraints
- All active sessions will be lost when the server restarts
- For persistent sessions across restarts, Neon PostgreSQL JSONB storage would need to be implemented
- Client applications should handle session restoration gracefully

### Token Limit Considerations
- Conversations can approach the 1M token window limit with extended use
- System logs warnings when approaching 80% of token limit
- For production use, conversation history summarization would be needed