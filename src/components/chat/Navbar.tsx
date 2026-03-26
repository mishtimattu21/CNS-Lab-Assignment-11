import { Shield, Users, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExperimentNav } from '@/components/experiment/ExperimentNav';

interface NavbarProps {
  username: string;
  onlineCount: number;
  onLogout: () => void;
  title?: string;
  subtitle?: string;
}

const Navbar = ({ username, onlineCount, onLogout, title, subtitle }: NavbarProps) => (
  <nav className="hidden md:flex flex-wrap items-center gap-x-3 gap-y-2 px-4 lg:px-6 py-3 bg-secondary border-b border-border shadow-sm">
    <div className="flex items-center gap-3 min-w-0 shrink max-w-[min(40%,20rem)]">
      <Button variant="ghost" size="icon" className="shrink-0" asChild>
        <Link to="/dashboard" aria-label="Back to groups">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <Shield className="h-6 w-6 text-accent shrink-0" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-semibold text-foreground truncate">{title ?? 'SecureChat'}</span>
          <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium shrink-0">
            SSL WSS
          </span>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
    </div>

    <div className="flex flex-1 min-w-0 items-center justify-end gap-2 lg:gap-3">
      <ExperimentNav className="justify-end" />
      <div className="flex items-center gap-2 lg:gap-3 shrink-0 border-l border-border pl-2 lg:pl-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
          <Users className="h-4 w-4 shrink-0" />
          <span>{onlineCount} online</span>
        </div>
        <span className="text-sm font-medium text-foreground max-w-[6rem] lg:max-w-[8rem] truncate">{username}</span>
        <Button variant="ghost" size="icon" onClick={onLogout} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </nav>
);

export default Navbar;
