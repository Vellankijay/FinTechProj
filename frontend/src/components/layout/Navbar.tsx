import { Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const location = useLocation();

  const links = [
    { path: '/', label: 'Home' },
    { path: '/summary', label: 'Summary' },
    { path: '/tech', label: 'Tech' },
    { path: '/healthtech', label: 'Healthtech' },
    { path: '/risk-chat', label: 'AI Chat' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <Activity className="h-6 w-6 text-accent" />
          <span>RiskPulse</span>
        </Link>

        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'text-sm font-medium transition-colors hover:text-foreground/80',
                location.pathname === link.path ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
