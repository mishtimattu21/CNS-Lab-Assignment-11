import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const UsernameSetupPage = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const { session, profile, loading, refreshProfile } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate('/', { replace: true });
      return;
    }
    // Only redirect when server already has a username (e.g. user opened /setup-username by mistake).
    if (profile?.username) navigate('/dashboard', { replace: true });
  }, [session, profile?.username, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const u = username.trim().replace(/^@/, '');
    if (u.length < 2) {
      toast.error('Username must be at least 2 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(u)) {
      toast.error('Use letters, numbers, and underscores only');
      return;
    }
    if (!session?.user) return;

    const { error } = await supabase.from('profiles').update({ username: u }).eq('id', session.user.id);
    if (error) {
      if (error.code === '23505') toast.error('That username is taken');
      else toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success('Username saved');
    navigate('/dashboard', { replace: true });
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <UserRound className="h-8 w-8 text-accent-strong" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Choose a username</h1>
            <p className="text-sm text-muted-foreground text-center">
              This is your display name in chats. You can’t change it later in this demo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="display-name-setup"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="bg-secondary border-0 h-12 text-center text-base"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
            <Button
              type="submit"
              className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 text-base font-medium rounded-xl"
            >
              Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UsernameSetupPage;
