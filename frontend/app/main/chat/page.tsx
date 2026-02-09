'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ChatBubble from '@/components/ChatBubble';
import RecipeRenderer from '@/components/RecipeRenderer';
import { Spinner } from '@/components/ui/spinner';
import { ErrorDisplay } from '@/components/ui/error-display';
import { sendMessage } from '@/lib/api';
import { getCurrentSession, updateSessionRecipe, addMessageToSession } from '@/lib/session';
import { Message, Recipe } from '@/types';

const ChatPage = () => {
  const router = useRouter();
  const params = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get session ID from params or localStorage
  const sessionId = params.id as string || getCurrentSession()?.id;

  useEffect(() => {
    // Check if session exists
    const session = getCurrentSession();
    if (!session) {
      setSessionExpired(true);
      return;
    }

    // Initialize with existing messages if any
    if (session.messages && session.messages.length > 0) {
      setMessages([...session.messages]);
    }

    // Set initial recipe if exists
    if (session.currentRecipe) {
      setCurrentRecipe(session.currentRecipe);
    }
  }, []);

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

      // Send message to API
      const response = await sendMessage(sessionId, inputMessage);

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-hidden flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-center">Recipe Chat Assistant</h1>

        {/* Recipe Display */}
        {currentRecipe && (
          <div className="mb-6">
            <RecipeRenderer recipe={currentRecipe} />
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