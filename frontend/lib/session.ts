import { Session } from '@/types';
import { generateUUID } from '@/lib/utils';

const SESSION_STORAGE_KEY = 'recipeRagSession';
const SESSION_EXPIRY_HOURS = 24;

/**
 * Retrieve the current session from localStorage
 * @returns Session object if valid, null otherwise
 */
export function getCurrentSession(): Session | null {
  if (typeof window === 'undefined') {
    // Running on the server, localStorage is not available
    return null;
  }

  try {
    // For guest users, we might want to use sessionStorage instead of localStorage
    // so that the session is cleared when the tab/browser is closed
    const isGuest = !isUserLoggedIn(); // Check if user is logged in

    const storage = isGuest ? sessionStorage : localStorage;
    const sessionData = storage.getItem(SESSION_STORAGE_KEY);

    if (!sessionData) {
      return null;
    }

    const parsedData = JSON.parse(sessionData);

    // Convert string dates back to Date objects and handle image_analysis
    const session: Session = {
      id: parsedData.id,
      createdAt: new Date(parsedData.createdAt),
      expiresAt: new Date(parsedData.expiresAt),
      ingredients: parsedData.ingredients || [],
      messages: (parsedData.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      currentRecipe: parsedData.currentRecipe ? {
        ...parsedData.currentRecipe,
        createdAt: new Date(parsedData.currentRecipe.createdAt)
      } : null,
      image_analysis: parsedData.image_analysis || undefined
    };

    // Check if session is expired
    const now = new Date();
    const expiryTime = new Date(session.expiresAt);

    if (now > expiryTime) {
      // Session is expired, remove it
      storage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error retrieving session from storage:', error);
    // If there's an error parsing the session, remove it
    // Only try to remove from storage if we're on the client side
    if (typeof window !== 'undefined') {
      try {
        // Determine which storage to use based on login status
        const isGuest = !isUserLoggedIn();
        const storage = isGuest ? sessionStorage : localStorage;
        storage.removeItem(SESSION_STORAGE_KEY);
      } catch (removeError) {
        console.error('Error removing session from storage:', removeError);
      }
    }
    return null;
  }
}

/**
 * Helper function to check if user is logged in
 * @returns Boolean indicating if user is logged in
 */
function isUserLoggedIn(): boolean {
  // This function is used to determine if we should use localStorage or sessionStorage
  // For now, we'll implement a basic check based on presence of auth-related cookies
  if (typeof window !== 'undefined') {
    try {
      // Check for NextAuth session cookie
      const hasNextAuthCookie = document.cookie.includes('next-auth.session-token');

      // Check for other common auth indicators
      const hasAuthCookie = document.cookie.includes('authjs.') || document.cookie.includes('next-auth.pkce.code_verifier');

      return hasNextAuthCookie || hasAuthCookie;
    } catch {
      // If there's an error checking cookies, assume guest
      return false;
    }
  }
  // On the server side, assume guest
  return false;
}

/**
 * Save a session to storage
 * @param session - The session to save
 */
export function saveSession(session: Session): void {
  try {
    // For guest users, use sessionStorage so it's cleared when the tab is closed
    // For logged-in users, use localStorage to persist across sessions
    const isGuest = !isUserLoggedIn();
    const storage = isGuest ? sessionStorage : localStorage;

    // Serialize dates properly
    const serializedSession = {
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      ingredients: session.ingredients || [],
      messages: (session.messages || []).map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })),
      currentRecipe: session.currentRecipe ? {
        ...session.currentRecipe,
        createdAt: session.currentRecipe.createdAt.toISOString()
      } : null,
      image_analysis: session.image_analysis || undefined
    };

    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(serializedSession));
  } catch (error) {
    console.error('Error saving session to storage:', error);
    // Attempt to clear some space by removing expired sessions
    cleanupExpiredSessions();
    try {
      const isGuest = !isUserLoggedIn();
      const storage = isGuest ? sessionStorage : localStorage;

      // Serialize dates properly
      const serializedSession = {
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        ingredients: session.ingredients || [],
        messages: (session.messages || []).map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        currentRecipe: session.currentRecipe ? {
          ...session.currentRecipe,
          createdAt: session.currentRecipe.createdAt.toISOString()
        } : null,
        image_analysis: session.image_analysis || undefined
      };

      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(serializedSession));
    } catch (retryError) {
      console.error('Failed to save session after cleanup:', retryError);
      throw new Error('Unable to save session to storage');
    }
  }
}

/**
 * Create a new session
 * @param ingredients - Initial ingredients for the session
 * @returns New session object
 */
export function createNewSession(ingredients: string[] = []): Session {
  const sessionId = generateUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

  const newSession: Session = {
    id: sessionId,
    createdAt: now,
    expiresAt: expiresAt,
    ingredients: ingredients || [],
    messages: [],
    currentRecipe: null,
  };

  return newSession;
}

/**
 * Update the current session
 * @param updateFn - Function that receives current session and returns updated session
 * @returns Updated session
 */
export function updateSession(updateFn: (session: Session) => Session): Session {
  let currentSession = getCurrentSession();

  if (!currentSession) {
    // If no current session, create a new one
    currentSession = createNewSession();
  }

  const updatedSession = updateFn(currentSession);
  saveSession(updatedSession);

  return updatedSession;
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  // For guest users, clear sessionStorage; for logged-in users, clear localStorage
  const isGuest = !isUserLoggedIn();
  const storage = isGuest ? sessionStorage : localStorage;
  storage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Initialize guest session cleanup when the page is unloaded
 * This ensures that guest sessions are cleared when the tab is closed
 */
export function initGuestSessionCleanup(): void {
  if (typeof window !== 'undefined') {
    // Check if user is a guest (not logged in)
    if (!isUserLoggedIn()) {
      // Use the beforeunload event to clear sessionStorage when the tab is closed
      window.addEventListener('beforeunload', () => {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      });

      // Also clear sessionStorage when the page is unloaded in other ways
      window.addEventListener('unload', () => {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      });
    }
  }
}

/**
 * Check if the localStorage quota is exceeded
 * @returns Boolean indicating if quota is exceeded
 */
export function isStorageQuotaExceeded(): boolean {
  try {
    // Try to store a small value to test if storage is available
    const testKey = '__storage_test__';
    const testValue = 'test';

    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);

    return false;
  } catch (error) {
    if (error instanceof DOMException) {
      // Check if it's a quota exceeded error
      return error.name === 'QuotaExceededError' ||
             error.name === 'NS_ERROR_DOM_QUOTA_REACHED';
    }
    return false;
  }
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  // Currently we only have one session key, but this function can be extended
  // if we add more session-related storage in the future
  const session = getCurrentSession();
  if (!session) {
    // If session is expired, it's already been removed by getCurrentSession
    return;
  }

  // Session is still valid, nothing to clean up
}

/**
 * Get session ID from localStorage
 * @returns Session ID string if exists, undefined otherwise
 */
export function getSessionId(): string | undefined {
  const session = getCurrentSession();
  return session?.id;
}


/**
 * Update session ingredients
 * @param ingredients - New ingredients to set
 */
export function updateSessionIngredients(ingredients: string[]): void {
  updateSession(session => ({
    ...session,
    ingredients
  }));
}

/**
 * Update session recipe
 * @param recipe - New recipe to set
 */
export function updateSessionRecipe(recipe: Session['currentRecipe']): void {
  updateSession(session => ({
    ...session,
    currentRecipe: recipe
  }));
}

/**
 * Add a message to the session
 * @param message - Message to add
 */
export function addMessageToSession(message: Session['messages'][0]): void {
  updateSession(session => ({
    ...session,
    messages: [...session.messages, message]
  }));
}