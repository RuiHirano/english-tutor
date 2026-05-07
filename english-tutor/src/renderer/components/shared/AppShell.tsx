import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home as HomeIcon,
  BookOpen,
  GraduationCap,
  Gauge,
  ListChecks,
  UserCog,
} from 'lucide-react';

const links = [
  { to: '/', label: 'ホーム', icon: HomeIcon },
  { to: '/study', label: '学習', icon: GraduationCap },
  { to: '/materials', label: '教材', icon: BookOpen },
  { to: '/vocab', label: '学んだ単語', icon: ListChecks },
  { to: '/level-test', label: 'レベル測定', icon: Gauge },
  { to: '/profile', label: 'プロフィール', icon: UserCog },
];

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-56 shrink-0 border-r bg-muted/40 p-4">
        <div className="mb-6 px-2">
          <h1 className="text-lg font-semibold">English Tutor</h1>
          <p className="text-xs text-muted-foreground">SLA-based learning</p>
        </div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
