import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBubbleProps {
  message: Message;
  className?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, className }) => {
  const isUser = message.sender === 'user';

  return (
    <div
      className={cn(
        "flex w-full max-w-3xl mx-auto",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      <Card
        className={cn(
          "max-w-[85%] sm:max-w-[75%] shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground border-primary ml-8"
            : "bg-secondary text-secondary-foreground border-secondary mr-8"
        )}
      >
        <CardContent className="p-4">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
          <div
            className={cn(
              "text-xs mt-2",
              isUser
                ? "text-primary-foreground/80"
                : "text-secondary-foreground/80"
            )}
          >
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatBubble;