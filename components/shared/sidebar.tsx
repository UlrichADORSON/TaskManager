'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Users, MessageSquare, CheckSquare,
  FileText, Settings, LogOut, ChevronLeft, Layers, Bell,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',     icon: LayoutDashboard, roles: ['admin', 'manager', 'employee', 'client'] },
  { label: 'Projets',      href: '/projects',      icon: FolderKanban,    roles: ['admin', 'manager', 'employee', 'client'] },
  { label: 'Mes tâches',   href: '/tasks',         icon: CheckSquare,     roles: ['employee'] },
  { label: 'Employés',     href: '/employees',     icon: Users,           roles: ['admin', 'manager'] },
  { label: 'Messages',     href: '/messages',      icon: MessageSquare,   roles: ['admin', 'manager', 'employee', 'client'] },
  { label: 'Soumettre',    href: '/submit',        icon: FileText,        roles: ['client'] },
  { label: 'Notifications',href: '/notifications', icon: Bell,            roles: ['admin', 'manager', 'employee', 'client'] },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, notifications } = useApp();

  if (!currentUser) return null;

  const items = navItems.filter((item) => item.roles.includes(currentUser.role));
  const unreadCount = notifications.filter((n) => n.userId === currentUser.id && !n.read).length;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 264 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-border"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground flex-shrink-0">
          <Layers className="h-5 w-5" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 overflow-hidden"
            >
              <h1 className="font-display text-lg font-bold tracking-tight">ProFlow</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gestion de projets</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const showBadge = item.href === '/notifications' && unreadCount > 0;
          return (
            <Link key={item.href} href={item.href} className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {showBadge && !collapsed && (
                <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
              {showBadge && collapsed && (
                <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
        <Link href="/settings" className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
          pathname === '/settings' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        )}>
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="flex-1 truncate">Paramètres</span>}
        </Link>
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-1 flex-shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className={cn('h-5 w-5 flex-shrink-0 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Réduire</span>}
        </button>
        <button
          onClick={() => { logout(); router.push('/login'); }}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </motion.aside>
  );
}
