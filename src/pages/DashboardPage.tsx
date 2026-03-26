import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Link2, Hash, Users, Trash2, UserMinus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ExperimentAppHeader } from '@/components/experiment/ExperimentAppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { generateGroupCode } from '@/lib/groupCode';
import { toast } from 'sonner';

type GroupRow = {
  id: string;
  code: string;
  name: string;
  created_at: string;
  joined_at: string;
  created_by: string;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'leave'; group: GroupRow } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  /** Prevents an older in-flight loadGroups() from overwriting state after delete/refetch. */
  const loadGroupsGenRef = useRef(0);

  const loadGroups = useCallback(async () => {
    if (!session?.user) return;
    const gen = ++loadGroupsGenRef.current;
    const uid = session.user.id;

    type JoinRow = {
      joined_at: string;
      groups: { id: string; code: string; name: string; created_at: string; created_by: string } | null;
    };

    const nested = await supabase
      .from('group_members')
      .select(
        `
        joined_at,
        groups!inner (
          id,
          code,
          name,
          created_at,
          created_by
        )
      `
      )
      .eq('user_id', uid);

    if (!nested.error && nested.data) {
      const rows = (nested.data || []) as JoinRow[];
      const merged: GroupRow[] = rows
        .filter((r) => r.groups)
        .map((r) => ({
          id: r.groups!.id,
          code: r.groups!.code,
          name: r.groups!.name,
          created_at: r.groups!.created_at,
          created_by: r.groups!.created_by,
          joined_at: r.joined_at,
        }));
      merged.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
      if (gen !== loadGroupsGenRef.current) return;
      setGroups(merged);
      return;
    }

    const { data: memberships, error: mErr } = await supabase
      .from('group_members')
      .select('group_id, joined_at')
      .eq('user_id', uid);

    if (mErr) {
      console.error('loadGroups:', nested.error || mErr);
      toast.error((nested.error || mErr).message || 'Could not load your groups');
      if (gen !== loadGroupsGenRef.current) return;
      setGroups([]);
      return;
    }
    if (!memberships?.length) {
      if (gen !== loadGroupsGenRef.current) return;
      setGroups([]);
      return;
    }
    const joinedByGroupId = new Map(memberships.map((m) => [m.group_id, m.joined_at as string]));
    const ids = memberships.map((m) => m.group_id);
    const { data: groupRows, error: gErr } = await supabase
      .from('groups')
      .select('id, code, name, created_at, created_by')
      .in('id', ids);
    if (gErr) {
      toast.error(gErr.message);
      if (gen !== loadGroupsGenRef.current) return;
      setGroups([]);
      return;
    }
    const merged: GroupRow[] = (groupRows || []).map((g) => ({
      ...(g as Omit<GroupRow, 'joined_at'>),
      joined_at: joinedByGroupId.get(g.id) || '',
    }));
    merged.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
    if (gen !== loadGroupsGenRef.current) return;
    setGroups(merged);
  }, [session?.user?.id]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups, location.key]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadGroups();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadGroups]);

  const createGroup = async () => {
    if (!session?.user) return;
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = generateGroupCode();
      const name = newName.trim() || 'Group chat';
      const { data: group, error } = await supabase
        .from('groups')
        .insert({ code, name, created_by: session.user.id })
        .select('id, code, name, created_at')
        .maybeSingle();
      if (error?.code === '23505') continue;
      if (error || !group) {
        toast.error(error?.message || 'Could not create group');
        return;
      }
      const { error: memErr } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: session.user.id,
      });
      if (memErr) {
        toast.error(memErr.message);
        return;
      }
      toast.success('Group created');
      setNewName('');
      await loadGroups();
      navigate(`/g/${group.code}`);
      return;
    }
    toast.error('Could not generate a unique code. Try again.');
  };

  const joinWithCode = () => {
    const c = joinCode.trim().toUpperCase();
    if (c.length < 4) {
      toast.error('Enter a group code');
      return;
    }
    navigate(`/g/${c}`);
  };

  const shareUrl = (code: string) => `${window.location.origin}/g/${code}`;

  const copyLink = (code: string) => {
    void navigator.clipboard.writeText(shareUrl(code));
    toast.success('Invite link copied');
  };

  const runConfirm = async () => {
    if (!confirm || !session?.user) return;
    setConfirmBusy(true);
    try {
      loadGroupsGenRef.current += 1;
      const gid = confirm.group.id;
      if (confirm.type === 'delete') {
        const { data: deleted, error } = await supabase.from('groups').delete().eq('id', gid).select('id');
        if (error) {
          toast.error(error.message);
          return;
        }
        if (!deleted?.length) {
          toast.error('Could not delete the group. Ensure delete policies are applied in Supabase.');
          return;
        }
        toast.success('Group deleted');
      } else {
        const { data: left, error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', gid)
          .eq('user_id', session.user.id)
          .select('group_id');
        if (error) {
          toast.error(error.message);
          return;
        }
        if (!left?.length) {
          toast.error('Could not leave the group.');
          return;
        }
        toast.success('Left group');
      }
      setConfirm(null);
      setGroups((prev) => prev.filter((g) => g.id !== gid));
      await loadGroups();
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ExperimentAppHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Create a group</h2>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Group name (optional)"
                  className="bg-secondary border-0"
                />
                <Button type="button" onClick={() => void createGroup()} className="shrink-0 bg-accent">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Join with code</h2>
              <div className="flex gap-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD34"
                  className="bg-secondary border-0 font-mono"
                />
                <Button type="button" onClick={joinWithCode} variant="secondary">
                  <Hash className="h-4 w-4 mr-1" />
                  Join
                </Button>
              </div>
            </section>
          </div>

          <aside className="rounded-2xl border border-border bg-card shadow-sm p-5 min-h-[200px] lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-accent-strong shrink-0" />
              <h2 className="text-base font-semibold text-foreground">Joined groups</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Groups you are a member of — open or share the invite link.</p>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-xl">
                No groups yet. Create one on the left or join with a code.
              </p>
            ) : (
              <ul className="space-y-2">
                {groups.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-stretch justify-between gap-2 rounded-xl border border-border bg-background/60 p-3"
                  >
                    <Link to={`/g/${g.code}`} className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="font-medium text-foreground truncate">{g.name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{g.code}</span>
                      {g.joined_at && (
                        <span className="text-[11px] text-muted-foreground/80">
                          Joined {format(new Date(g.joined_at), 'MMM d, yyyy · HH:mm')}
                        </span>
                      )}
                    </Link>
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyLink(g.code)}
                        title="Copy invite link"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      {session?.user && g.created_by === session.user.id ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirm({ type: 'delete', group: g })}
                          title="Delete group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setConfirm({ type: 'leave', group: g })}
                          title="Leave group"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === 'delete' ? 'Delete this group?' : 'Leave this group?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === 'delete'
                ? 'This removes the group and all messages for everyone. This cannot be undone.'
                : 'You will stop receiving messages from this group. You can rejoin later with the invite link or code.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmBusy}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant={confirm?.type === 'delete' ? 'destructive' : 'default'}
              disabled={confirmBusy}
              onClick={() => void runConfirm()}
            >
              {confirmBusy ? '…' : confirm?.type === 'delete' ? 'Delete group' : 'Leave group'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardPage;
