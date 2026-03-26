import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatMessage, OnlineUser } from '@/types/chat';
import type { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

const WS_URL = import.meta.env.VITE_WS_URL as string;

export type WsConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

export function useSocketChat(opts: {
  groupCode: string | null;
  groupId: string | null;
  session: Session | null;
  username: string;
}) {
  const { groupCode, groupId, session, username } = opts;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [wsStatus, setWsStatus] = useState<WsConnectionStatus>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMessages([]);
  }, [groupId]);

  useEffect(() => {
    if (!groupId || !session) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, username, content, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      if (error || cancelled) return;
      const rows: ChatMessage[] = (data || []).map((r) => ({
        id: r.id,
        username: r.username,
        content: r.content,
        timestamp: r.created_at,
        type: 'message',
      }));
      setMessages(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, session]);

  useEffect(() => {
    if (!groupCode || !session?.access_token || !username || !WS_URL) return;

    setWsStatus('connecting');
    const url = `${WS_URL}?token=${encodeURIComponent(session.access_token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    let sawOpen = false;

    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data as string) as Record<string, unknown>;
        if (parsed.type === 'message' && parsed.message) {
          const m = parsed.message as ChatMessage;
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            return [...prev, m];
          });
        } else if (parsed.type === 'system' && parsed.message) {
          const m = parsed.message as ChatMessage;
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            return [...prev, m];
          });
        } else if (parsed.type === 'presence' && Array.isArray(parsed.users)) {
          setOnlineUsers(
            (parsed.users as { username: string; online_at: string }[]).map((u) => ({
              username: u.username,
              online_at: u.online_at,
            }))
          );
        } else if (parsed.type === 'joined' && Array.isArray(parsed.users)) {
          setOnlineUsers(
            (parsed.users as { username: string; online_at: string }[]).map((u) => ({
              username: u.username,
              online_at: u.online_at,
            }))
          );
        } else if (parsed.type === 'typing' && typeof parsed.username === 'string') {
          const typer = parsed.username;
          if (typer === username) return;
          setTypingUsers((prev) => (prev.includes(typer) ? prev : [...prev, typer]));
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== typer));
          }, 2000);
        } else if (parsed.type === 'error') {
          const msg = typeof parsed.message === 'string' ? parsed.message : 'WebSocket error';
          toast.error(msg);
        }
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => {
      setWsStatus('error');
      toast.error(
        'Chat connection failed. Run the WSS server (npm run dev:server), trust https://localhost:3001 in the browser, and check VITE_WS_URL.'
      );
    };

    ws.onclose = () => {
      wsRef.current = null;
      setWsStatus(sawOpen ? 'closed' : 'error');
    };

    ws.onopen = () => {
      sawOpen = true;
      setWsStatus('open');
      ws.send(JSON.stringify({ type: 'join', groupCode }));
    };

    return () => {
      setWsStatus('idle');
      ws.close();
      wsRef.current = null;
    };
  }, [groupCode, session?.access_token, username]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'message', content }));
  }, []);

  const sendTyping = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    wsRef.current.send(JSON.stringify({ type: 'typing' }));
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  }, []);

  return { messages, onlineUsers, typingUsers, sendMessage, sendTyping, wsStatus };
}
