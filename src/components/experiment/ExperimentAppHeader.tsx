import { Link } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ExperimentNav } from './ExperimentNav';

export function ExperimentAppHeader() {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0 min-w-0">
          <Shield className="h-6 w-6 text-accent-strong shrink-0" />
          <span className="font-semibold text-foreground truncate">SecureChat</span>
        </Link>

        <div className="flex flex-1 min-w-0 items-center justify-end gap-2 sm:gap-3">
          <ExperimentNav className="justify-end" />
          <div className="flex items-center gap-2 shrink-0 border-l border-border pl-2 sm:pl-3">
            <span className="text-sm text-muted-foreground max-w-[120px] truncate hidden sm:inline">
              {profile?.username}
            </span>
            <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
