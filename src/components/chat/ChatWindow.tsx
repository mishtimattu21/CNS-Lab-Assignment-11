import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/chat';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  messages: ChatMessage[];
  username: string;
  typingUsers: string[];
}

const ChatWindow = ({ messages, username, typingUsers }: ChatWindowProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-secondary min-h-0">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">No messages yet. Say hello! 👋</p>
        </div>
      )}
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} isOwn={msg.username === username} />
      ))}
      {typingUsers.length > 0 && (
        <div className="text-xs text-muted-foreground italic pl-2 animate-pulse">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
