import { AnalyzePhotoResponse, ChatResponse, SessionResponse } from '@/types';

// Base API configuration
// In development, this points to the backend service
// In production, this should be set to the actual backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Analyze an uploaded image to detect ingredients
 * @param imageFile - The image file to analyze
 * @param sessionId - Optional existing session ID
 * @returns Promise resolving to analysis results
 */
export async function analyzePhoto(imageFile: File, sessionId?: string): Promise<AnalyzePhotoResponse> {
  const formData = new FormData();
  formData.append('file', imageFile);

  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/analyze-photo`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Send a chat message to the AI assistant
 * @param sessionId - The session ID for the conversation
 * @param message - The message to send
 * @param includePreferences - Whether to include user preferences in the context (default: true)
 * @param userId - Optional user ID for authenticated requests (use dbId for backend)
 * @returns Promise resolving to chat response
 */
export async function sendMessage(sessionId: string, message: string, includePreferences: boolean = true, userId?: string): Promise<ChatResponse> {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('message', message);
  formData.append('include_preferences', includePreferences.toString());

  const headers: HeadersInit = {};
  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    body: formData,
    headers,
    // Don't set Content-Type header when using FormData - the browser sets it automatically
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Export recipe in specified format
 * @param recipeId - The recipe ID to export
 * @param format - The export format ('pdf' or 'markdown')
 * @returns Promise resolving to export response
 */
export async function exportRecipe(recipeId: string, format: 'pdf' | 'markdown'): Promise<{ url: string; success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipe_id: recipeId,
      format: format
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get chat history for the current user
 * @param userId - User ID for authenticated requests (use dbId for backend)
 * @returns Promise resolving to chat history
 */
export async function getChatHistory(userId?: string): Promise<{ success: boolean; history: Array<{session_id: string; created_at: string; updated_at: string; message_count: number; summary: string; recipe_context: any}> }> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/chat/history`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a specific chat session
 * @param sessionId - The session ID to retrieve
 * @param userId - User ID for authenticated requests (use dbId for backend)
 * @returns Promise resolving to chat session data
 */
export async function getChatSession(sessionId: string, userId?: string): Promise<{ success: boolean; session?: any; message?: string }> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['X-User-ID'] = userId;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/session/${sessionId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Return a specific response for 404 errors
        return { success: false, message: 'Session not found' };
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, session: data.session };
  } catch (error) {
    console.error('Error fetching chat session:', error);
    // Return failure if there's a network error
    return { success: false, message: 'Network error occurred' };
  }
}

/**
 * Delete a specific chat session
 * @param sessionId - The session ID to delete
 * @param userId - User ID for authenticated requests (use dbId for backend)
 * @returns Promise resolving to deletion result
 */
export async function deleteChatSession(sessionId: string, userId?: string): Promise<{ success: boolean; message: string }> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/chat/session/${sessionId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete all chat history for the current user
 * @param userId - User ID for authenticated requests (use dbId for backend)
 * @returns Promise resolving to deletion result
 */
export async function deleteAllChatHistory(userId?: string): Promise<{ success: boolean; message: string }> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/chat/history`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new chat session for the user
 * @returns Promise resolving to creation result
 */
export async function createNewChatSession(): Promise<{ success: boolean; message: string; session_id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/profile/new-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Retrieve session information
 * @param sessionId - The session ID to retrieve
 * @returns Promise resolving to session data
 */
export async function getSession(sessionId: string): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/session/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Save a recipe to the database
 * @param recipe - The recipe data to save
 * @param isPublic - Whether the recipe should be shared on Chef's Board
 * @param userId - User ID for authenticated requests (use dbId for backend)
 * @returns Promise resolving to save result
 */
export async function saveRecipe(recipe: any, isPublic: boolean, userId?: string): Promise<{ success: boolean; recipe_id?: string; message: string }> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/save-recipe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      recipe,
      isPublic
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Check API health
 * @returns Promise resolving to health status
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string; version: string }> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed! status: ${response.status}`);
  }

  return response.json();
}