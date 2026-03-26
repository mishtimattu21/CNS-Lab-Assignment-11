import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useSocketChat } from '@/hooks/useSocketChat';
import Navbar from '@/components/chat/Navbar';
import ChatWindow from '@/components/chat/ChatWindow';
import MessageInput from '@/components/chat/MessageInput';
import UsersList from '@/components/chat/UsersList';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExperimentNav } from '@/components/experiment/ExperimentNav';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GroupChatPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const normalized = (code || '').trim().toUpperCase();
  const { session, profile, loading: authLoading } = useAuth();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('Group');
  const [ready, setReady] = useState(false);

  const username = profile?.username ?? '';

  const { messages, onlineUsers, typingUsers, sendMessage, sendTyping, wsStatus } = useSocketChat({
    groupCode: ready && groupId ? normalized : null,
    groupId,
    session,
    username,
  });

  useEffect(() => {
    if (authLoading || !session?.user || !profile?.username || !normalized) return;

    let cancelled = false;
    void (async () => {
      const { data: group, error } = await supabase.from('groups').select('id, name').eq('code', normalized).maybeSingle();
      if (cancelled) return;
      if (error || !group) {
        toast.error('Group not found');
        navigate('/dashboard', { replace: true });
        return;
      }
      setGroupName((group as { name?: string }).name || 'Group');
      const { error: memErr } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: session.user.id,
      });
      if (memErr && memErr.code !== '23505') {
        toast.error(memErr.message);
        navigate('/dashboard', { replace: true });
        return;
      }
      setGroupId(group.id as string);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, session, profile?.username, normalized, navigate, session?.user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (authLoading || !session || !profile?.username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!import.meta.env.VITE_WS_URL) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <p className="text-destructive font-medium mb-2">Missing VITE_WS_URL</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Set <code className="bg-muted px-1 rounded">VITE_WS_URL=wss://localhost:3001</code> in <code className="bg-muted px-1 rounded">.env</code> and run the Node SSL WebSocket server.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-border bg-secondary md:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm font-medium truncate flex-1 min-w-0">{groupName}</span>
          <span className="text-xs font-mono text-muted-foreground shrink-0">{normalized}</span>
          <Button variant="ghost" size="icon" onClick={() => void handleLogout()} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 px-3 pb-2 overflow-x-auto">
          <ExperimentNav className="min-w-0" />
        </div>
      </div>
      <Navbar
        title={groupName}
        subtitle={`Code: ${normalized}`}
        username={username}
        onlineCount={onlineUsers.length}
        onLogout={() => void handleLogout()}
      />
      <div className="flex flex-1 overflow-hidden flex-col min-h-0">
        {wsStatus !== 'open' && wsStatus !== 'idle' && (
          <Alert variant={wsStatus === 'error' ? 'destructive' : 'default'} className="rounded-none border-x-0 border-t-0 shrink-0">
            <AlertDescription className="flex items-center gap-2 text-sm">
              {wsStatus === 'connecting' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  Connecting to secure chat server (WSS)…
                </>
              )}
              {wsStatus === 'error' &&
                'Could not connect. Run npm run dev:server, open https://localhost:3001 once to trust the cert, then refresh.'}
              {wsStatus === 'closed' && 'Connection closed. Refresh the page to reconnect.'}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-secondary min-h-0">
          <ChatWindow messages={messages} username={username} typingUsers={typingUsers} />
          <MessageInput
            onSend={sendMessage}
            onTyping={sendTyping}
            disabled={wsStatus !== 'open'}
            placeholder={
              wsStatus === 'connecting'
                ? 'Connecting…'
                : wsStatus === 'error'
                  ? 'Not connected'
                  : 'Type a message...'
            }
          />
        </div>
        <UsersList users={onlineUsers} currentUser={username} />
        </div>
      </div>
    </div>
  );
};

export default GroupChatPage;
