import type { ChatMessage } from '@/types/chat';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2 animate-fade-in">
        <span className="chat-system text-xs text-muted-foreground px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in`}>
      <div className={`max-w-[70%] ${isOwn ? 'chat-bubble-sender' : 'chat-bubble-receiver'} px-4 py-2.5 shadow-sm`}>
        {!isOwn && (
          <p className="text-xs font-semibold text-accent-strong mb-1">{message.username}</p>
        )}
        <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
        <p className="text-[10px] text-muted-foreground mt-1 text-right">
          {format(new Date(message.timestamp), 'HH:mm')}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
