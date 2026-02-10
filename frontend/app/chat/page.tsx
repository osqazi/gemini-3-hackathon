'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ChatBubble from '@/components/ChatBubble';
import RecipeRenderer from '@/components/RecipeRenderer';
import { Spinner } from '@/components/ui/spinner';
import { ErrorDisplay } from '@/components/ui/error-display';
import { sendMessage, saveRecipe } from '@/lib/api';
import { getCurrentSession, updateSessionRecipe, addMessageToSession, createNewSession, saveSession } from '@/lib/session';
import { Message, Recipe } from '@/types';
import { useSession } from 'next-auth/react';
import { Save, CheckCircle } from 'lucide-react';

const ChatPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [recipeSaved, setRecipeSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get session ID from localStorage
  const sessionId = getCurrentSession()?.id;

  useEffect(() => {
    // Check if session exists
    const session = getCurrentSession();
    if (!session) {
      // If no session exists, create a new one and redirect to the chat page with the new session ID
      const newSession = createNewSession();
      saveSession(newSession);

      // Redirect to the chat page with the new session ID
      router.push(`/chat/${newSession.id}`);
    } else {
      // Session exists, don't set as expired
      setSessionExpired(false);

      // Redirect to the chat page with the existing session ID to use the full-featured chat page
      router.push(`/chat/${session.id}`);
    }
  }, [router]);

  if (sessionExpired) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold">Session Expired</h1>
          </CardHeader>
          <CardContent>
            <p>Your session has expired. Please go back to the home page to start a new session.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')}>Back to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    // Ensure we have a session ID
    const currentSession = getCurrentSession();
    if (!inputMessage.trim() || isLoading || !currentSession?.id) return;

    try {
      setError(null);
      setIsLoading(true);

      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        content: inputMessage,
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, userMessage]);
      addMessageToSession(userMessage);

      // Clear input
      setInputMessage('');

      // Send message to API using the session ID
      const response = await sendMessage(currentSession.id, inputMessage);

      // Add AI response to UI
      const aiMessage: Message = {
        id: response.message_id || Date.now().toString(),
        sender: 'ai',
        content: response.response,
        timestamp: new Date(),
        status: 'delivered'
      };

      setMessages(prev => [...prev, aiMessage]);
      addMessageToSession(aiMessage);

      // Update recipe if provided in response
      if (response.recipe) {
        setCurrentRecipe(response.recipe);
        updateSessionRecipe(response.recipe);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Add error message to UI
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'ai',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (sessionExpired) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold">Session Expired</h1>
          </CardHeader>
          <CardContent>
            <p>Your session has expired. Please go back to the home page to start a new session.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')}>Back to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If no session exists, we're redirecting, so don't render the chat interface
  if (!getCurrentSession()) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-2" />
          <p>Setting up your chat session...</p>
        </div>
      </div>
    );
  }

  // Function to automatically save the current recipe to the database when it's displayed
  useEffect(() => {
    if (currentRecipe && status === 'authenticated' && session?.user?.email && !currentRecipe.id.includes('recipe-')) {
      handleAutoSaveRecipe();
    }
  }, [currentRecipe, status, session]);

  const handleAutoSaveRecipe = async () => {
    if (!currentRecipe) {
      return;
    }

    if (status !== 'authenticated' || !session?.user?.email) {
      setError('You must be logged in to save a recipe');
      return;
    }

    try {
      setSavingRecipe(true);
      
      // Prepare recipe data in the format expected by the backend
      const recipeData = {
        ...currentRecipe,
        ingredients: currentRecipe.ingredients || [],
        instructions: currentRecipe.instructions || [],
        prep_time: currentRecipe.prepTime,
        cook_time: currentRecipe.cookingTime,
        total_time: currentRecipe.totalTime,
        nutrition_info: currentRecipe.nutritionInfo,
        tips_variations: currentRecipe.tipsVariations || [],
        customization_notes: currentRecipe.customizationNotes || [],
        images: currentRecipe.images || [],
        tags: currentRecipe.tags || [],
        rag_context: currentRecipe.ragContext || {},
        source_recipe_id: currentRecipe.sourceRecipeId,
        user_id: session.user.email, // Using email as user ID for now
        author: session.user.name || 'AI Generated'
      };

      // Call the save recipe API with isPublic = false
      const result = await saveRecipe(recipeData, false, session.user.email);
      
      if (result.success && result.recipe_id) {
        // Update the recipe ID to the one returned from the database
        setCurrentRecipe({...currentRecipe, id: result.recipe_id});
        setRecipeSaved(true);
        setTimeout(() => setRecipeSaved(false), 3000); // Reset after 3 seconds
      } else {
        setError(result.message || 'Failed to save recipe');
      }
    } catch (err) {
      console.error('Error auto-saving recipe:', err);
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setSavingRecipe(false);
    }
  };

  // Function to share the recipe to the Chef's Board
  const handleShareToChefsBoard = async (recipeId: string) => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setError('You must be logged in to share a recipe');
      return;
    }

    try {
      // Update the recipe's public status to true
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/recipes/${recipeId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': session.user.email
        },
        body: JSON.stringify({ public: true })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the current recipe's public status
        if (currentRecipe && currentRecipe.id === recipeId) {
          setCurrentRecipe({...currentRecipe, public: true});
        }
        
        alert("Sharing is Caring. Thank you for Sharing!.");
      } else {
        setError(result.message || 'Failed to share recipe');
      }
    } catch (err) {
      console.error('Error sharing recipe:', err);
      setError(err instanceof Error ? err.message : 'Failed to share recipe');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-hidden flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-center">Recipe Chat Assistant</h1>

        {/* Recipe Display */}
        {currentRecipe && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Your Generated Recipe</h2>
            </div>
            <RecipeRenderer
              recipe={currentRecipe}
              userId={session?.user?.email || undefined}
              onShareToChefsBoard={handleShareToChefsBoard}
            />
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Send your first message to start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))
          )}
          {isLoading && (
            <div className="flex justify-start w-full max-w-3xl mx-auto">
              <div className="max-w-[75%] bg-secondary p-4 rounded-lg">
                <div className="flex items-center">
                  <Spinner size="sm" className="mr-2" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="mt-auto">
          {error && (
            <ErrorDisplay message={error} className="mb-4" />
          )}
          <div className="flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the recipe, request changes, or ask for variations..."
              className="resize-none"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="h-auto px-4 py-2"
            >
              {isLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : null}
              Send
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;