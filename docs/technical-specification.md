# RecipeRAG - Technical Specification

## Project Overview
RecipeRAG is a multimodal AI recipe creator and personal chef agent that leverages Google's Gemini 3 model to transform ingredient photos into personalized recipes. The application combines computer vision, natural language processing, and retrieval-augmented generation to create an intuitive cooking companion.

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Next.js App   │  │   UI Library    │  │   Client Libs   │ │
│  │                 │  │   (Shadcn/UI)   │  │ (React, Framer  │ │
│  │ • Image Upload  │  │ • Animations    │  │  Motion, etc.)  │ │
│  │ • Chat Interface│  │ • Responsive    │  │                 │ │
│  │ • Voice Input   │  │ • Accessibility │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   FastAPI App   │  │   AI Services   │  │   Utilities     │ │
│  │                 │  │                 │  │                 │ │
│  │ • API Routes    │  │ • Gemini Client │  │ • Session Mgmt  │ │
│  │ • Auth Handler  │  │ • RAG Service   │  │ • Image Proc.   │ │
│  │ • Validation    │  │ • Embedding Gen │  │ • Error Handle  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PostgreSQL    │  │   Vector Store  │  │   Recipe DB     │ │
│  │   (Neon)        │  │   (pgvector)    │  │                 │ │
│  │ • User Data     │  │ • Embeddings    │  │ • Pre-embedded  │ │
│  │ • Sessions      │  │ • Similarity    │  │ • Recipes       │ │
│  │ • Preferences   │  │ • Search        │  │ • Metadata      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling framework |
| Shadcn/UI | Latest | Accessible UI components |
| Framer Motion | 11.x | Animations |
| React Hook Form | Latest | Form handling |
| React Markdown | Latest | Content rendering |
| Web Speech API | Native | Voice input |
| jsPDF | Latest | PDF generation |
| React Dropzone | Latest | File upload |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime environment |
| FastAPI | Latest | Web framework |
| SQLAlchemy | Latest | ORM |
| Neon PostgreSQL | Latest | Database |
| Google Generative AI SDK | Latest | Gemini integration |
| Sentence Transformers | Latest | Embedding generation |
| FAISS | Latest | Vector similarity search |
| Pillow | Latest | Image processing |
| Pydantic | Latest | Data validation |
| Cryptography | Latest | Security utilities |
| Python Multipart | Latest | File handling |

### AI & Machine Learning
| Technology | Purpose |
|------------|---------|
| Google Gemini 3 | Multimodal AI processing |
| Sentence Transformers | Text embedding |
| Computer Vision | Ingredient recognition |
| RAG Pipeline | Retrieval-augmented generation |

### Infrastructure & Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Railway/Render | Backend hosting |
| Neon | PostgreSQL database |
| Google Cloud | AI services |
| GitHub | Version control |

## API Specification

### Authentication
All authenticated endpoints require:
- Header: `X-User-ID` (for registered users)
- Header: `Authorization` (when applicable)

### Endpoints

#### Photo Analysis
**POST /api/v1/analyze-photo**
- Description: Analyze ingredient photos and detect contents
- Request Type: multipart/form-data
- Parameters:
  - `file`: Image file (JPEG/PNG)
  - `session_id`: Optional session identifier (string)
- Response:
```json
{
  "session_id": "string",
  "ingredients": ["string"],
  "observations": "string",
  "recipe": null
}
```

#### Recipe Generation
**POST /api/v1/generate-recipe**
- Description: Generate personalized recipes from ingredients
- Request Type: application/json
- Body:
```json
{
  "ingredients": ["string"],
  "preferences": {
    "dietary_restrictions": ["string"],
    "allergies": ["string"],
    "taste_preferences": {},
    "cooking_constraints": ["string"],
    "ingredient_exclusions": ["string"]
  },
  "servings": 4
}
```
- Response:
```json
{
  "title": "string",
  "ingredients": ["string"],
  "instructions": ["string"],
  "cooking_time": "string",
  "servings": "string",
  "reasoning": "string",
  "retrieved_recipes_used": [],
  "processing_time_ms": 1234,
  "created_at": "timestamp"
}
```

#### Chat Interface
**POST /api/v1/chat**
- Description: Engage in conversational recipe refinement
- Request Type: multipart/form-data
- Parameters:
  - `session_id`: Session identifier (string)
  - `message`: User message (string)
  - `include_preferences`: Include user preferences (boolean)
  - `new_photo`: Optional image file
- Response:
```json
{
  "response": "string",
  "ingredients": ["string"],
  "recipe": {
    "title": "string",
    "ingredients": ["string"],
    "instructions": ["string"],
    "servings": number,
    "difficulty": "string",
    "createdAt": "timestamp"
  },
  "session_id": "string"
}
```

#### Profile Management
**GET /api/v1/profile**
- Description: Retrieve user profile and preferences
- Response:
```json
{
  "success": true,
  "data": {
    "user_id": "string",
    "preferences": {
      "diet": "string",
      "allergies": ["string"],
      "skill_level": "string",
      "likes": ["string"],
      "dislikes": ["string"],
      "cuisine_preferences": ["string"],
      "cooking_time_preference": "string",
      "health_focus": ["string"],
      "daily_calorie_target": number
    }
  }
}
```

**POST /api/v1/profile**
- Description: Update user profile and preferences
- Headers: X-User-ID
- Body: User preferences object
- Response:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* profile data */ }
}
```

#### User Management
**POST /api/v1/user/lookup-or-create**
- Description: Create or retrieve user account
- Body:
```json
{
  "email": "string",
  "provider": "string",
  "provider_id": "string",
  "password": "string",
  "username": "string"
}
```
- Response:
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "username": "string",
    "provider": "string",
    "is_active": boolean,
    "is_verified": boolean
  }
}
```

#### Recipe Sharing
**GET /api/v1/public-recipes**
- Description: Retrieve public recipes from Chef's Board
- Query Parameters:
  - `sort_by`: Field to sort by
  - `sort_order`: asc/desc
  - `search`: Search term
  - `difficulty`: Filter by difficulty
  - `min_time`: Minimum cooking time
  - `max_time`: Maximum cooking time
  - `servings`: Number of servings
  - `username`: Filter by username
  - `limit`: Number of recipes to return
  - `offset`: Pagination offset
- Response:
```json
{
  "recipes": [/* array of recipe objects */],
  "total_count": number
}
```

**POST /api/v1/save-recipe**
- Description: Save a recipe to the database
- Headers: X-User-ID
- Body:
```json
{
  "recipe": { /* recipe object */ },
  "isPublic": boolean
}
```
- Response:
```json
{
  "success": true,
  "recipe_id": "string",
  "message": "Recipe saved successfully"
}
```

## Database Schema

### User Table
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    provider VARCHAR(50),
    provider_id VARCHAR(255),
    password VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Profile Table
```sql
CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Recipe Card Table
```sql
CREATE TABLE recipe_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients JSONB,
    instructions JSONB,
    prep_time INTEGER,
    cook_time INTEGER,
    total_time INTEGER,
    servings INTEGER,
    difficulty VARCHAR(50),
    nutrition_info JSONB,
    tips_variations JSONB,
    author VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    public BOOLEAN DEFAULT FALSE,
    images JSONB,
    tags JSONB,
    customization_notes JSONB,
    source_recipe_id UUID,
    rag_context JSONB
);
```

### Session Table
```sql
CREATE TABLE chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    messages JSONB,
    recipe_context JSONB
);
```

### Vector Storage for RAG
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Recipe embeddings table
CREATE TABLE recipe_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipe_cards(id),
    title VARCHAR(255),
    ingredients TEXT,
    instructions TEXT,
    embedding vector(384), -- 384 dimensions for all-MiniLM-L6-v2
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for similarity search
CREATE INDEX ON recipe_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## AI Integration Details

### Gemini 3 Model Configuration
- **Model**: gemini-1.5-pro (primary), gemini-1.5-flash (fallback)
- **Capabilities**: Multimodal (image + text), 1M token context window
- **Safety Settings**: Configured for culinary context
- **Response Types**: Text generation, content classification

### Prompt Engineering
#### Ingredient Detection Prompt
```
Analyze this food image and provide:

1. A list of ingredients detected in the image
2. Approximate quantities for each ingredient (e.g., "1 cup", "2-3 pieces", "small amount")
3. Any observations about the freshness or condition of ingredients
4. A simple recipe suggestion using the detected ingredients

Keep your response structured and concise.
```

#### Recipe Generation Prompt
```
Based on these ingredients: {ingredients}

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

Keep the recipe practical and achievable with the provided ingredients and strictly adhere to any dietary restrictions, allergies, or ingredient exclusions.
```

### RAG Implementation
#### Embedding Process
1. **Text Preprocessing**: Normalize and clean recipe text
2. **Vector Generation**: Convert text to 384-dimensional vectors using all-MiniLM-L6-v2
3. **Storage**: Store embeddings in pgvector-enabled PostgreSQL
4. **Indexing**: Create IVFFLAT index for efficient similarity search

#### Retrieval Process
1. **Query Embedding**: Convert user request to vector representation
2. **Similarity Search**: Find top-k most similar recipes using cosine similarity
3. **Context Assembly**: Combine retrieved recipes with user request
4. **Augmented Generation**: Send enhanced prompt to Gemini for generation

## Security Implementation

### Authentication Flow
1. **NextAuth.js v5**: Handles OAuth and credential-based authentication
2. **JWT Tokens**: Secure session management
3. **Header Transmission**: X-User-ID header for backend communication
4. **Session Validation**: Backend validates user identity for protected endpoints

### Data Protection
- **Encryption at Rest**: AES-256 for stored data
- **Transport Security**: TLS 1.3 for all communications
- **Input Validation**: Comprehensive validation using Pydantic
- **Rate Limiting**: Prevents abuse and brute force attacks

### Privacy Measures
- **Minimal Data Collection**: Only essential information stored
- **User Consent**: Clear consent for data usage
- **Right to Deletion**: Users can delete accounts and data
- **Compliance**: GDPR and CCPA compliance measures

## Performance Optimization

### Caching Strategies
- **Redis**: Session and preference caching
- **CDN**: Asset delivery optimization
- **Browser Cache**: Client-side caching for static resources
- **Database Cache**: Query result caching

### Database Optimization
- **Connection Pooling**: SQLAlchemy connection pooling
- **Indexing**: Strategic indexing for query performance
- **Query Optimization**: Efficient query patterns
- **Partitioning**: Large table partitioning when needed

### API Optimization
- **Async Processing**: Non-blocking operations
- **Batch Requests**: Efficient handling of multiple requests
- **Compression**: Response compression
- **Pagination**: Efficient data retrieval

## Deployment Configuration

### Frontend Deployment (Vercel)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment Variables**: NEXT_PUBLIC_API_BASE_URL, NEXTAUTH_URL, etc.
- **Domains**: gemini-3-ht.vercel.app

### Backend Deployment (Railway/Render)
- **Runtime**: Python 3.11
- **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**: GEMINI_API_KEY, DATABASE_URL, etc.
- **Scaling**: Auto-scaling based on demand

### Database Configuration (Neon)
- **Connection Pooling**: Serverless connection pooling
- **Branching**: Development and production branches
- **Autoscaling**: Compute auto-scaling
- **Geographic Replicas**: Global read replicas

## Testing Strategy

### Unit Tests
- **Backend**: pytest with FastAPI test client
- **Frontend**: Jest with React Testing Library
- **AI Integration**: Mock Gemini responses for testing

### Integration Tests
- **API Endpoints**: End-to-end API testing
- **Database Operations**: ORM integration tests
- **Authentication**: OAuth flow testing

### Performance Tests
- **Load Testing**: Simulated concurrent users
- **Response Time**: API response time monitoring
- **Memory Usage**: Memory leak detection

## Monitoring & Analytics

### Application Monitoring
- **Error Tracking**: Real-time error monitoring
- **Performance Metrics**: Response time and throughput
- **User Analytics**: Usage patterns and engagement
- **System Health**: Resource utilization monitoring

### AI Service Monitoring
- **Response Time**: Gemini API response times
- **Token Usage**: API token consumption tracking
- **Quality Metrics**: Recipe generation quality assessment
- **Failure Rates**: Error rate monitoring

## Future Enhancements

### Short-term Goals
- **Advanced Personalization**: ML-based preference prediction
- **Social Features**: Friends and collaborative cooking
- **Mobile App**: Native mobile application
- **IoT Integration**: Smart kitchen appliance connectivity

### Long-term Vision
- **AR Cooking Guide**: Augmented reality cooking instructions
- **Supply Chain Integration**: Grocery ordering and delivery
- **Advanced RAG**: Multi-modal retrieval with images and text
- **Real-time Collaboration**: Shared cooking sessions