'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Trash2, Trash } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ChatHistoryItem {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  summary: string;
  recipe_context: any;
}

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteAll: () => void;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  onDeleteSession,
  onDeleteAll
}) => {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && status === 'authenticated') {
      fetchChatHistory();
    }
  }, [isOpen, status]);

  const fetchChatHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the user ID from the NextAuth session (use dbId which matches backend)
      const userId = session?.user?.dbId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Use the API library function which handles headers properly
      const { getChatHistory } = await import('@/lib/api');
      const response = await getChatHistory(userId);

      setHistory(response.history || []);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chat history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session?')) {
      try {
        // Get the user ID from the NextAuth session (use dbId which matches backend)
        const userId = session?.user?.dbId;

        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Use the API library function which handles headers properly
        const { deleteChatSession } = await import('@/lib/api');
        await deleteChatSession(sessionId, userId);

        // Remove the session from the local state
        setHistory(prev => prev.filter(item => item.session_id !== sessionId));
        onDeleteSession(sessionId);
      } catch (err) {
        console.error('Error deleting session:', err);
        alert('Failed to delete session');
      }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
      try {
        // Get the user ID from the NextAuth session (use dbId which matches backend)
        const userId = session?.user?.dbId;

        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Use the API library function which handles headers properly
        const { deleteAllChatHistory } = await import('@/lib/api');
        await deleteAllChatHistory(userId);

        setHistory([]);
        onDeleteAll();
      } catch (err) {
        console.error('Error deleting all sessions:', err);
        alert('Failed to delete all sessions');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] w-full">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Chat History</span>
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAll}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-transparent">Loading chat history...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-32 text-destructive">
            <p>{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p>No chat history found.</p>
            <p className="text-sm mt-1">Your conversations will appear here.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.session_id}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => onSelectSession(item.session_id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.summary}</h3>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.message_count} messages
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(item.session_id);
                        }}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistoryModal;