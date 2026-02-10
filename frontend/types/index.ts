// Global window extension for loading bar
declare global {
  interface Window {
    loadingBar?: {
      start: () => void;
      update: (value: number) => void;
      finish: () => void;
    };
  }
}

// Session type representing a user's interaction session
export interface Session {
  id: string; // UUID format - Unique identifier for the user session
  createdAt: Date; // Timestamp when session was created
  expiresAt: Date; // Timestamp when session expires (24 hours from creation)
  ingredients: string[]; // List of detected ingredients from uploaded image
  messages: Message[]; // Array of chat messages in the session
  currentRecipe: Recipe | null; // Currently displayed recipe (null if not generated yet)
  image_analysis?: { // Image analysis data from photo upload
    ingredients: string[];
    observations: string;
  };
  refinements?: Array<{ // Recipe refinement requests
    text: string;
    timestamp: string;
    recipe: Recipe;
  }>;
}

// Message type for chat interactions
export interface Message {
  id: string; // Unique identifier for the message
  sender: 'user' | 'ai'; // Indicates whether message is from user or AI assistant
  content: string; // The text content of the message
  timestamp: Date; // When the message was sent/received
  status: 'sent' | 'delivered' | 'error'; // Status of message delivery (for UI)
  recipeData?: Recipe; // Optional recipe data for AI messages with recipes
}

// Recipe type for recipe data
export interface Recipe {
  id: string; // Unique identifier for the recipe
  title: string; // Title of the recipe
  ingredients: Array<{name: string, quantity: string, preparation?: string}>; // List of ingredients required
  instructions: string[]; // Step-by-step cooking instructions
  cookingTime?: number; // Estimated cooking time in minutes
  servings?: number; // Number of servings
  difficulty?: 'easy' | 'medium' | 'hard'; // Difficulty level
  nutritionInfo?: { // Nutritional information if available
    caloriesPerServing?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fiberG?: number;
  };
  reasoning?: string; // AI's reasoning behind the recipe choices
  tipsVariations?: string[]; // Tips and variations (renamed from variations)
  createdAt: Date; // When the recipe was generated
  prepTime?: number; // Preparation time
  totalTime?: number; // Total time
  tags?: string[]; // Recipe tags
  customizationNotes?: string[]; // Customization notes
  images?: string[]; // Recipe images
  sourceRecipeId?: string; // Source recipe ID if derived from another
  ragContext?: any; // RAG context information
  author?: string; // Author of the recipe
  description?: string; // Description of the recipe
  generatedAt?: string; // When the recipe was generated (for display)
  public?: boolean; // Whether the recipe is public/shared to Chef's Board
}

// Nutrition information type
export interface NutritionInfo {
  calories?: number; // Total calories
  protein?: number; // Protein content in grams
  carbs?: number; // Carbohydrate content in grams
  fat?: number; // Fat content in grams
}

// Image upload type
export interface ImageUpload {
  id: string; // Unique identifier for the upload
  file: File; // The actual file object
  fileName: string; // Name of the uploaded file
  fileSize: number; // Size of the file in bytes
  mimeType: string; // MIME type of the file
  previewUrl: string; // URL for previewing the image
  status: 'pending' | 'processing' | 'completed' | 'error'; // Upload status
  uploadedAt: Date; // When the file was uploaded
}

// API Response types
export interface AnalyzePhotoResponse {
  session_id: string;
  ingredients: string[];
  observations: string;
  recipe?: Recipe;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  recipe?: Recipe;
  message_id: string;
}

export interface SessionResponse {
  session_id: string;
  created_at: string;
  expires_at: string;
  ingredients: string[];
  messages: Message[];
  current_recipe?: Recipe;
}