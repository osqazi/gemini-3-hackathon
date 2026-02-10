'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ChatBubble from '@/components/ChatBubble';
import RecipeCard from '@/components/recipe-card/recipe-card';
import RecipeSaveDialog from '@/components/recipe-save-dialog/recipe-save-dialog';
import { Spinner } from '@/components/ui/spinner';
import { ErrorDisplay } from '@/components/ui/error-display';
import { sendMessage } from '@/lib/api';
import { getCurrentSession, updateSessionRecipe, addMessageToSession, createNewSession, saveSession } from '@/lib/session';
import { Message, Recipe } from '@/types';
import VoiceInput from '@/components/voice-input';
import PreferencesToggle from '@/components/preferences-toggle/preferences-toggle';
import ChatHistoryModal from '@/components/chat-history-modal/chat-history-modal';
import { useSession } from 'next-auth/react';
import { ChefHatIcon, XIcon } from 'lucide-react';

const ChatPage = () => {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [showRecipeCard, setShowRecipeCard] = useState(false);
  const [recipeMessageId, setRecipeMessageId] = useState<string | null>(null);
  const [showRecipeSaveDialog, setShowRecipeSaveDialog] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false); // Start as false to avoid flash of expired message
  const [preferencesEnabled, setPreferencesEnabled] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if running on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show recipe save dialog when a new recipe is generated and user is authenticated
  useEffect(() => {
    if (currentRecipe && status === 'authenticated') {
      // Show the save dialog for signed-in users only when a new recipe is set
      const timer = setTimeout(() => {
        setShowRecipeSaveDialog(true);
      }, 100); // Small delay to ensure UI has updated

      return () => clearTimeout(timer);
    }
  }, [currentRecipe, status]);

  // Effect to monitor messages for recipe content when no recipe is currently set
  useEffect(() => {
    if (!currentRecipe && messages.length > 0) {
      // Look for the most recent AI message that might contain recipe data
      const aiMessages = messages.filter(m => m.sender === 'ai');
      if (aiMessages.length > 0) {
        const latestAiMessage = aiMessages[aiMessages.length - 1];
        
        // Check if this message contains recipe-like content
        const containsRecipeStructure = 
          latestAiMessage.content.toLowerCase().includes('ingredients') &&
          latestAiMessage.content.toLowerCase().includes('instructions') ||
          /(?:^|\n)\s*\d+\.\s/.test(latestAiMessage.content); // Numbered list
        
        if (containsRecipeStructure) {
          // Even if we don't have a structured recipe object yet, 
          // we know this message likely contains recipe content
          console.log("Detected potential recipe content in AI message");
        }
      }
    }
  }, [messages, currentRecipe]);

  // Get session ID from params or localStorage
  const sessionId = params.id as string || (isClient ? getCurrentSession()?.id : null);

  useEffect(() => {
    // Only run this effect on client side
    if (!isClient) return;

    // Check if we have a session ID in the URL
    if (params.id) {
      // If there's a session ID in the URL, try to load that session
      const currentSession = getCurrentSession();

      if (currentSession && currentSession.id === params.id) {
        // We have a matching session for the URL parameter
        setSessionExpired(false);

        // Initialize with existing messages if any
        if (currentSession.messages && currentSession.messages.length > 0) {
          setMessages([...currentSession.messages]);
        }

        // Set initial recipe if exists
        if (currentSession.currentRecipe) {
          setCurrentRecipe(currentSession.currentRecipe);
        }

        // Check if there's image analysis data and no messages yet (first visit after upload)
        if (currentSession.image_analysis && currentSession.messages && currentSession.messages.length === 0) {
          // Create a welcome message with image analysis data
          const imageAnalysisMsg: Message = {
            id: `analysis-${Date.now()}`,
            sender: 'ai',
            content: `I've analyzed your uploaded image and detected the following ingredients: ${currentSession.image_analysis.ingredients?.join(', ') || 'no specific ingredients'}. ${currentSession.image_analysis.observations || ''}\n\n\n✨ **Let's get cooking!** 🍳 What kind of dish are you in the mood for? 🤔 Are you looking for something quick and easy ⚡, or perhaps a more elaborate meal 🎭? I can suggest recipes, help with cooking techniques, or answer any questions about meal planning! 📝`,
            timestamp: new Date(),
            status: 'delivered'
          };

          // Add the analysis message to the UI
          setMessages(prev => [...prev, imageAnalysisMsg]);

          // Add to session storage
          addMessageToSession(imageAnalysisMsg);
        }
      } else {
        // Session not in localStorage, try to load from backend (for existing sessions from history)
        const loadSessionFromBackend = async () => {
          try {
            // Use the API to get the specific session
            const { getChatSession } = await import('@/lib/api');

            // Get user ID if authenticated
            const nextAuth = await import('next-auth/react');
            const sessionFromAuth = await nextAuth.getSession();
            const userId = sessionFromAuth?.user?.dbId;

            // Only try to load from backend if user is authenticated
            if (userId) {
              const response = await getChatSession(params.id as string, userId);

              if (response.success && response.session) {
                // Create a new session object with the loaded data
                const loadedSession: any = {
                  id: params.id as string,
                  createdAt: new Date(),
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                  ingredients: [],
                  messages: [], // We'll populate this from the history
                  currentRecipe: null,
                };

                // Convert the session history to our message format
                const sessionHistory = response.session.messages_history || [];
                const formattedMessages: Message[] = [];

                for (const msg of sessionHistory) {
                  if (msg.role === 'user') {
                    // Handle user message
                    const contentParts = msg.parts || [];
                    let content = '';

                    for (const part of contentParts) {
                      if (typeof part === 'string') {
                        content += part;
                      } else if (typeof part === 'object' && part.mime_type && part.data) {
                        // This is an image part - just note that an image was sent
                        content += '[Image uploaded]';
                      } else if (typeof part === 'object') {
                        // This might be the image object from the original upload
                        if (part.hasOwnProperty('mime_type') && part.hasOwnProperty('data')) {
                          content += '[Image uploaded]';
                        } else {
                          content += JSON.stringify(part);
                        }
                      }
                    }

                    formattedMessages.push({
                      id: `user-${Date.now()}-${Math.random()}`,
                      sender: 'user',
                      content: content,
                      timestamp: new Date(msg.timestamp),
                      status: 'delivered'
                    });
                  } else if (msg.role === 'model') {
                    // Handle AI response message
                    const contentParts = msg.parts || [];
                    let content = contentParts.join(' '); // Join all parts of the AI response

                    formattedMessages.push({
                      id: `ai-${Date.now()}-${Math.random()}`,
                      sender: 'ai',
                      content: content,
                      timestamp: new Date(msg.timestamp),
                      status: 'delivered'
                    });
                  }
                }

                // Set the messages in the UI
                setMessages(formattedMessages);

                // Save the session to localStorage
                loadedSession.messages = formattedMessages;
                saveSession(loadedSession);

                setSessionExpired(false);

                // Set initial recipe if exists in session
                if (response.session.recipe_context) {
                  // Convert recipe context to our recipe format
                  const recipeFromContext = {
                    id: `recipe-${Date.now()}`,
                    title: response.session.recipe_context.title || 'Loaded Recipe',
                    ingredients: response.session.recipe_context.ingredients || [],
                    instructions: response.session.recipe_context.instructions || [],
                    cookingTime: response.session.recipe_context.cooking_time || 0,
                    servings: response.session.recipe_context.servings || 1,
                    difficulty: response.session.recipe_context.difficulty || 'medium',
                    nutritionInfo: response.session.recipe_context.nutritionInfo || {},
                    variations: response.session.recipe_context.variations || [],
                    tags: response.session.recipe_context.tags || [],
                    reasoning: response.session.recipe_context.reasoning || '',
                    substitutions: response.session.recipe_context.substitutions || [],
                    createdAt: new Date()
                  };

                  // Transform the recipe to match the Recipe interface (especially ingredients format)
                  const transformedRecipe: Recipe = {
                    ...recipeFromContext,
                    ingredients: recipeFromContext.ingredients?.map((ing: any) => {
                      if (typeof ing === 'string') {
                        return {
                          name: ing,
                          quantity: ''
                        };
                      } else if (typeof ing === 'object' && ing.name) {
                        return {
                          name: ing.name,
                          quantity: ing.quantity || '',
                          preparation: ing.preparation || ''
                        };
                      } else {
                        return {
                          name: String(ing),
                          quantity: ''
                        };
                      }
                    }) || [],
                    tipsVariations: (recipeFromContext as any).tipsVariations || recipeFromContext.variations || [],
                    nutritionInfo: recipeFromContext.nutritionInfo || {},
                    generatedAt: undefined
                  };
                  
                  setCurrentRecipe(transformedRecipe);
                }
              } else {
                // If session not found in backend (e.g., new session), create a new one with that ID
                const newSession = createNewSession();
                newSession.id = params.id as string;
                saveSession(newSession);

                setSessionExpired(false);
                setMessages([]);
                setCurrentRecipe(null);
              }
            } else {
              // If not authenticated, create a new session with that ID
              const newSession = createNewSession();
              newSession.id = params.id as string;
              saveSession(newSession);

              setSessionExpired(false);
              setMessages([]);
              setCurrentRecipe(null);
            }
          } catch (error: any) {
            console.error('Error loading session from backend:', error);

            // If there's an error, create a new session with that ID
            const newSession = createNewSession();
            newSession.id = params.id as string;
            saveSession(newSession);

            setSessionExpired(false);
            setMessages([]);
            setCurrentRecipe(null);
          }
        };

        loadSessionFromBackend();
      }
    } else {
      // No specific session ID in URL - this shouldn't happen since the route is /chat/[id]
      // but just in case, redirect to the root chat page to create a new session
      if (typeof window !== 'undefined') {
        window.location.href = '/chat';
      }
    }
  }, [isClient, params.id]); // Adding params.id to dependency array to ensure re-run when URL changes

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !sessionId) return;

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

      // Send message to API with preferences flag and user ID (use dbId which matches backend)
      const response = await sendMessage(sessionId, inputMessage, preferencesEnabled, session?.user?.dbId);
      
      // Check if response is valid
      if (!response || !response.session_id) {
        console.error('Invalid response from server - session ID missing:', response);
        throw new Error('Invalid response from server - session ID missing');
      }

      // Add AI response to UI
      const aiMessage: Message = {
        id: response.message_id || Date.now().toString(),
        sender: 'ai',
        content: response.response,
        timestamp: new Date(),
        status: 'delivered'
      };

      // Add the AI message first
      setMessages(prev => [...prev, aiMessage]);
      addMessageToSession(aiMessage);

      // Update recipe if provided in response
      if (response.recipe) {
        // Transform the recipe to match the Recipe interface (especially ingredients format)
        const transformedRecipe: Recipe = {
          ...response.recipe,
          ingredients: response.recipe.ingredients?.map((ing: any) => {
            if (typeof ing === 'string') {
              return {
                name: ing,
                quantity: ''
              };
            } else if (typeof ing === 'object' && ing.name) {
              return {
                name: ing.name,
                quantity: ing.quantity || '',
                preparation: ing.preparation || ''
              };
            } else {
              return {
                name: String(ing),
                quantity: ''
              };
            }
          }) || [],
          tipsVariations: response.recipe.tipsVariations || (response.recipe as any).variations || [],
          nutritionInfo: response.recipe.nutritionInfo || {},
          generatedAt: response.recipe.generatedAt
        };
        
        // Set the recipe state first
        setCurrentRecipe(transformedRecipe);
        setRecipeMessageId(aiMessage.id); // Track which message is associated with the recipe
        updateSessionRecipe(transformedRecipe);

        // The dialog will be shown via useEffect when recipe is updated and user is authenticated
      }

      // If user is logged in, the session should be saved to the database by the backend
      // The backend will handle this automatically based on the user ID
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
            <p>Your session has expired. Let's start a new session.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')}>Go to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
  };

  const handleSelectSession = (sessionId: string) => {
    // Navigate to the selected session
    router.push(`/chat/${sessionId}`);
    setShowHistoryModal(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    // Handle session deletion
    console.log('Session deleted:', sessionId);
  };

  const handleDeleteAll = () => {
    // Handle deletion of all sessions
    console.log('All sessions deleted');
  };

  // Initialize guest session cleanup when component mounts
  useEffect(() => {
    // Import the session management functions
    import('@/lib/session').then((module) => {
      module.initGuestSessionCleanup();
    });
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between w-full mb-6">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Recipe Chat Assistant</h1>
            <p className="text-sm text-muted-foreground mt-1">Get personalized recipes with AI assistance</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Chat History Button - Only for signed-in users */}
            {status === 'authenticated' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowHistory}
                className="transition-all duration-300 hover:scale-105"
              >
                Chat History
              </Button>
            )}

            {/* Preferences Toggle - Only for signed-in users */}
            <div className="transition-all duration-300 hover:scale-105">
              <PreferencesToggle
                onToggle={setPreferencesEnabled}
                initialEnabled={true}
              />
            </div>
          </div>
        </div>


        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 relative bg-muted/20 rounded-xl p-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="animate-pulse flex flex-col items-center">
                <ChefHatIcon className="h-12 w-12 text-orange-400 mb-4" />
                <p className="text-lg font-medium">Start a conversation with our AI Chef</p>
                <p className="text-sm text-muted-foreground mt-2">Describe your ingredients or ask for recipe ideas</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              // Check if this is an AI message that might contain recipe content
              const hasRecipeContent = message.sender === 'ai' && (
                message.content.toLowerCase().includes('recipe') ||
                message.content.toLowerCase().includes('ingredients') ||
                message.content.toLowerCase().includes('instructions') ||
                message.content.toLowerCase().includes('cooking') ||
                message.content.toLowerCase().includes('cook time') ||
                message.content.toLowerCase().includes('servings') ||
                message.content.toLowerCase().includes('preparation') ||
                message.content.toLowerCase().includes('steps') ||
                message.content.toLowerCase().includes('directions') ||
                message.content.toLowerCase().includes('meal') ||
                message.content.toLowerCase().includes('dish') ||
                message.content.toLowerCase().includes('kitchen') ||
                message.content.toLowerCase().includes('flavor') ||
                message.content.toLowerCase().includes('taste') ||
                // Check for common recipe structure indicators
                /(?:^|\n)\s*\d+\.\s/.test(message.content) || // Numbered list (common in instructions)
                message.content.toLowerCase().includes('for serving') ||
                message.content.toLowerCase().includes('for serves') ||
                ((message.content.match(/\n/g) || []).length > 3 && // Multiple lines
                (message.content.toLowerCase().match(/(tablespoons?|tbsp|teaspoons?|tsp|cups?|grams?|kg|ounces?|oz)/g) || []).length > 0) // Cooking measurements
              );

              return (
                <div
                  key={message.id}
                  className={`transition-all duration-300 ease-out ${index === messages.length - 1 ? 'animate-fade-in-up' : ''}`}
                >
                  <ChatBubble message={message} />

                  {/* Show recipe card toggle button if this is an AI message with potential recipe content or if this message generated the current recipe */}
                  {(hasRecipeContent || message.id === recipeMessageId) && !showRecipeCard && (
                    <div className="ml-4 mt-2">
                      <Button
                        onClick={async () => {
                          // Call the backend API to extract structured recipe data using AI
                          try {
                            console.log("Calling backend to extract recipe from message:", message.content);
                            
                            const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
                            const response = await fetch(`${BACKEND_URL}/api/v1/extract-recipe-from-text`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                text: message.content
                              })
                            });

                            if (!response.ok) {
                              throw new Error(`Failed to extract recipe: ${response.status} ${response.statusText}`);
                            }

                            const extractedRecipe = await response.json();
                            
                            console.log("Received extracted recipe from backend:", extractedRecipe);
                            
                            // Update the current recipe with the extracted data
                            setCurrentRecipe(extractedRecipe);
                            setRecipeMessageId(message.id); // Update the message ID associated with this recipe
                            setShowRecipeCard(true);
                          } catch (error) {
                            console.error("Error extracting recipe from backend:", error);
                            
                            // Fallback to local extraction if backend fails
                            console.log("Falling back to local extraction");
                            
                            // Create a temporary recipe object with all the required fields
                            const fallbackRecipe: Recipe = {
                              id: `extracted-${message.id}`,
                              title: "New Recipe",
                              description: "",
                              ingredients: [],
                              instructions: [],
                              prepTime: 0,
                              cookingTime: 0,
                              totalTime: 0,
                              servings: 1,
                              difficulty: "medium" as const,
                              nutritionInfo: {},
                              reasoning: "",
                              tipsVariations: [],
                              author: "AI Generated",
                              createdAt: new Date(),
                              tags: [],
                              customizationNotes: [],
                              images: [],
                              sourceRecipeId: undefined,
                              ragContext: undefined,
                              generatedAt: new Date().toISOString()
                            };
                            
                            // Update the current recipe with the fallback data
                            setCurrentRecipe(fallbackRecipe);
                            setRecipeMessageId(message.id);
                            setShowRecipeCard(true);
                          }
                        }}
                        className="flex items-center gap-2 text-sm"
                        variant="outline"
                        size="sm"
                      >
                        <ChefHatIcon className="h-4 w-4" />
                        View Recipe Card
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
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

        {/* Chat History Modal */}
        <ChatHistoryModal
          isOpen={showHistoryModal}
          onClose={handleCloseHistory}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onDeleteAll={handleDeleteAll}
        />

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
              className="resize-none rounded-lg border-0 bg-background focus-visible:ring-2 focus-visible:ring-orange-500 transition-all duration-300 shadow-sm hover:shadow-md"
              rows={2}
            />
            <VoiceInput
              onTranscript={(transcript) => {
                setInputMessage(transcript);
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="h-auto px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md hover:shadow-lg"
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

      {/* Recipe Card Overlay - appears outside and over the chatbot */}
      {showRecipeCard && currentRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRecipeCard(false)}
              className="absolute -top-2 -right-2 z-50 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-200"
              aria-label="Close recipe card"
            >
              <XIcon className="h-5 w-5 text-gray-600 hover:text-gray-900" />
            </button>
            <RecipeCard
              id={currentRecipe.id || 'current-recipe'}
              title={currentRecipe.title}
              description={currentRecipe.description || ''}
              ingredients={currentRecipe.ingredients || []}
              instructions={currentRecipe.instructions || []}
              prepTime={currentRecipe.prepTime}
              cookTime={currentRecipe.cookingTime}
              totalTime={currentRecipe.totalTime}
              servings={currentRecipe.servings}
              difficulty={currentRecipe.difficulty || 'medium'}
              nutritionInfo={{
                caloriesPerServing: currentRecipe.nutritionInfo?.caloriesPerServing,
                proteinG: currentRecipe.nutritionInfo?.proteinG,
                carbsG: currentRecipe.nutritionInfo?.carbsG,
                fatG: currentRecipe.nutritionInfo?.fatG,
                fiberG: currentRecipe.nutritionInfo?.fiberG
              }}
              tipsVariations={currentRecipe.tipsVariations || []}
              author={currentRecipe.author || "AI Generated"}
              generatedAt={currentRecipe.generatedAt}
              tags={[]} // Not provided in the Recipe type
              customizationNotes={[]} // Not provided in the Recipe type
              images={[]} // Not provided in the Recipe type
              onClose={() => setShowRecipeCard(false)}
            />
          </div>
        </div>
      )}

      {/* Recipe Save Dialog - Appears after recipe generation for signed-in users */}
      <RecipeSaveDialog
        recipe={currentRecipe}
        isOpen={showRecipeSaveDialog}
        onClose={() => setShowRecipeSaveDialog(false)}
      />
    </div>
  );
};

export default ChatPage;