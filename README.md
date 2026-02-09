# RecipeRAG – Multimodal AI Recipe Creator & Personal Chef Agent

RecipeRAG is a sophisticated multimodal AI recipe generator that takes images of ingredients and generates personalized recipes using Google's Gemini Pro Vision model. This project features advanced capabilities including voice input, user authentication, personalized profiles, and polished UI/UX for an exceptional user experience.

## Features

- Upload images of ingredients to generate recipes
- Voice input for recipe refinements using Web Speech API
- Multimodal AI processing with Gemini Pro Vision
- Recipe refinement through chat interface with persistent context
- RAG (Retrieval Augmented Generation) for improved recipe quality
- User authentication with NextAuth.js (Google OAuth and email/password)
- User profile management with dietary preferences and health conditions
- Styled UI with shadcn/ui components and framer-motion animations
- PDF export of recipe cards with jsPDF
- Responsive design for mobile and desktop
- Offline support for viewing previously generated recipes
- Next.js frontend with FastAPI backend
- PostgreSQL database with pgvector for RAG

## Tech Stack

- Frontend: Next.js 15+, TypeScript, Tailwind CSS, shadcn/ui, framer-motion
- Backend: FastAPI, Python 3.11
- Database: Neon PostgreSQL with pgvector extension
- AI: Google Gemini Pro Vision API
- RAG: Sentence transformers for embeddings
- Authentication: NextAuth.js v5+
- Voice Input: Web Speech API
- PDF Export: jsPDF

## Setup Instructions

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- Google Gemini API Key
- Neon PostgreSQL account

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create a `.env.local` file in the frontend directory with the following:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Create a `.env` file in the backend directory with the following:
```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_neon_postgres_connection_string
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

3. Run the backend server:
```bash
cd backend
uvicorn src.main:app --reload
```

### Running the Application

1. Start the backend:
```bash
cd backend
uvicorn src.main:app --reload
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

## Gemini Usage

RecipeRAG leverages Google's Gemini Pro Vision model for multimodal understanding:

- **Vision Capabilities**: Analyzes uploaded ingredient images to identify contents
- **Multimodal Understanding**: Combines visual and text inputs for context-aware recipe generation
- **1M Token Window**: Enables long-context conversations and detailed recipe instructions
- **Safety Filters**: Applies appropriate safety settings to prevent harmful suggestions
- **Personalization**: Integrates user profile preferences into Gemini prompts for tailored results

The system uses Retrieval Augmented Generation (RAG) to ground recipe suggestions in reliable data, preventing hallucinations while maintaining creative flexibility.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT

## Phase 3 - Gemini Agent Logic & Long-Context Chat

This phase transforms the single-turn recipe generation into a true agentic "personal chef" conversation using Gemini 3's native chat/session with full 1M-token context persistence. The implementation enables seamless multi-turn recipe refinements while remembering ingredients, preferences, feedback, and constraints across turns, with visible reasoning in every response.

### Objectives

- Implement persistent conversation history using Gemini's chat/session mechanism
- Enable iterative recipe refinement while preserving prior preferences and constraints
- Ensure visible reasoning in outputs (substitutions, nutrition notes, variations)
- Maintain fast response times (<4s) even after 5-10+ conversation turns
- Support multimodal inputs (text + image) within ongoing conversations

### New Endpoint

#### POST /api/v1/chat

Endpoint for engaging in conversational recipe refinement with the personal chef agent.

**Request Body (Form Data)**:
- `session_id`: Client-provided UUID string to identify the conversation session (managed via localStorage)
- `message`: Text message containing the user's refinement request (e.g., "make it vegan", "lower calories")
- `new_photo`: Optional image file to be included in the conversation context

**Response**:
```json
{
  "response": "string (markdown with updated recipe + reasoning)",
  "ingredients": "array[string] (updated ingredients list if changed)"
}
```

### Example Multi-Turn Conversation Sequence

```bash
# Start a new conversation
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: multipart/form-data" \
  -F "session_id=abc123-uuid-string" \
  -F "message=Suggest a pasta recipe with tomatoes and basil"

# Continue the conversation with a refinement
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: multipart/form-data" \
  -F "session_id=abc123-uuid-string" \
  -F "message=Make it vegan"

# Another refinement that remembers the vegan constraint
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: multipart/form-data" \
  -F "session_id=abc123-uuid-string" \
  -F "message=Add more protein"

# Optional image upload mid-conversation
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: multipart/form-data" \
  -F "session_id=abc123-uuid-string" \
  -F "message=What can I add from this pantry?" \
  -F "new_photo=@path/to/pantry_items.jpg"
```

### Latency Observations

- Average response time: ~2-3 seconds per refinement request
- Performance remains consistent even after 5+ conversation turns
- Token utilization efficiently managed within 1M context window

## Phase 2 - Backend Foundation + Neon DB + RAG Setup

This phase focuses on establishing a solid FastAPI backend foundation with Neon PostgreSQL integration and RAG pipeline. The implementation includes creating core API endpoints for image analysis and recipe generation, implementing the RAG system over a database of 300-500 recipes, and setting up the complete backend infrastructure.

### Objectives

- Establish FastAPI backend with proper configuration and routing
- Connect to Neon PostgreSQL database with pgvector extension for vector similarity search
- Implement multimodal image analysis for ingredient detection using Gemini 3
- Create RAG system that retrieves similar recipes and generates personalized suggestions
- Set up clean repository structure for future development phases

### Setup

1. Create a `.env` file based on `.env.example` and add your Gemini API key
2. Install dependencies: `pip install -r requirements.txt`
3. Run the test script: `python backend/gemini_test.py path/to/your/food/image.jpg`

### Tech Stack

- Python 3.11
- Google Generative AI SDK
- FastAPI
- Neon PostgreSQL with pgvector extension
- Sentence Transformers
- FAISS for vector similarity search

### MVP Scope (Hackathon)

**In Scope:**
- Multimodal ingredient detection via Gemini 3
- Basic recipe suggestions with RAG integration
- Simple RAG implementation for similar recipe retrieval
- Clean project structure

**Out of Scope:**
- Full UI implementation
- Advanced RAG features
- User accounts or authentication
- Production-level error handling

## Repository Structure

```
backend/
├── gemini_test.py       # Main script for Gemini 3 API testing
├── rag_basic.py         # Basic RAG implementation for recipe retrieval
├── recipes_sample.json  # Sample recipe data for basic RAG system
├── prompts/             # Directory for prompt templates
│   └── ingredient-detection-v1.txt  # Documented prompt template
├── requirements.txt     # Python dependencies
└── .env.example         # Example environment variables file

frontend/               # Placeholder for future frontend implementation

docs/                   # Documentation directory
└── phase-2-notes.md    # Notes from Phase 2 implementation

tests/                  # Test directory
└── test_gemini_integration.py  # Basic integration tests
```

## Phase 2 Results

- ✅ FastAPI application successfully connects to Neon PostgreSQL database
- ✅ Reliable ingredient detection from food images using Gemini 3
- ✅ Basic recipe suggestions generated with RAG context
- ✅ Clean repository structure with proper directory organization
- ✅ Documented prompt templates for consistent results

## Usage Examples

### Analyze Photo Endpoint
```bash
curl -X POST "http://localhost:8000/analyze-photo" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample_food_image.jpg"
```

### Generate Recipe Endpoint
```bash
curl -X POST "http://localhost:8000/generate-recipe" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": ["chicken", "rice", "onions", "garlic"],
    "preferences": "healthy, low-fat"
  }'
```

## Development Notes

This project was built as part of the Gemini 3 Hackathon to demonstrate multimodal AI capabilities for recipe generation. The implementation focuses on the core backend functionality with advanced UI/UX, authentication, and personalization features added in later phases.