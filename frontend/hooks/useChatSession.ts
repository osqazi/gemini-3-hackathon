import { useState, useEffect } from 'react';
import {
  getCurrentSession,
  saveSession,
  updateSession,
  clearSession,
  isStorageQuotaExceeded,
  getSessionId,
  updateSessionIngredients,
  updateSessionRecipe,
  addMessageToSession
} from '@/lib/session';
import { Session, Message } from '@/types';

interface UseChatSessionReturn {
  session: Session | null;
  loading: boolean;
  error: string | null;
  createSession: (ingredients?: string[]) => Session;
  updateSessionState: (updateFn: (session: Session) => Session) => void;
  addMessage: (message: Message) => void;
  clearCurrentSession: () => void;
  isSessionValid: () => boolean;
  refreshSession: () => void;
}

export const useChatSession = (): UseChatSessionReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load session on hook initialization
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = () => {
    try {
      setLoading(true);
      setError(null);

      const currentSession = getCurrentSession();
      setSession(currentSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
      setError(errorMessage);
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSession = (ingredients: string[] = []): Session => {
    try {
      const newSession = {
        id: getSessionId() || crypto.randomUUID(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        ingredients,
        messages: [],
        currentRecipe: null,
      };

      saveSession(newSession);
      setSession(newSession);
      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    }
  };

  const updateSessionState = (updateFn: (session: Session) => Session) => {
    try {
      setError(null);

      const updatedSession = updateSession(updateFn);
      setSession(updatedSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session';
      setError(errorMessage);
      console.error('Error updating session:', err);
    }
  };

  const addMessage = (message: Message) => {
    try {
      setError(null);

      addMessageToSession(message);

      // Reload session to reflect the new message
      loadSession();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message';
      setError(errorMessage);
      console.error('Error adding message:', err);
    }
  };

  const clearCurrentSession = () => {
    try {
      clearSession();
      setSession(null);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear session';
      setError(errorMessage);
      console.error('Error clearing session:', err);
    }
  };

  const isSessionValid = (): boolean => {
    if (!session) return false;

    const now = new Date();
    return now < new Date(session.expiresAt);
  };

  const refreshSession = () => {
    loadSession();
  };

  return {
    session,
    loading,
    error,
    createSession,
    updateSessionState,
    addMessage,
    clearCurrentSession,
    isSessionValid,
    refreshSession,
  };
};