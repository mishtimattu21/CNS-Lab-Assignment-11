import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const items: { to: string; label: string; end?: boolean }[] = [
  { to: '/dashboard', label: 'Groups', end: true },
  { to: '/details', label: 'Details' },
  { to: '/proof', label: 'Proof' },
  { to: '/about', label: 'About' },
  { to: '/profile', label: 'Profile' },
];

type Props = {
  className?: string;
};

export function ExperimentNav({ className }: Props) {
  return (
    <nav
      className={cn(
        'flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-full py-0.5',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        className
      )}
      aria-label="Main navigation"
    >
      {items.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end ?? false}
          className={({ isActive }) =>
            cn(
              'shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md transition-colors',
              isActive
                ? 'bg-accent/15 text-accent-strong font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
