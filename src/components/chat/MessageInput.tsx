import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput = ({ onSend, onTyping, disabled, placeholder = 'Type a message...' }: MessageInputProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled || !value.trim()) return;
    onSend(value);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 bg-white border-t border-border">
      <Input
        value={value}
        onChange={(e) => { setValue(e.target.value); onTyping(); }}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-white border border-border shadow-sm focus-visible:ring-accent"
      />
      <Button type="submit" size="icon" disabled={disabled || !value.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shrink-0">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default MessageInput;
