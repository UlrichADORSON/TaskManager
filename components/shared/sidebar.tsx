'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Users, CheckSquare,
  FileText, Settings, LogOut, ChevronLeft, Layers, Bell, ChevronRight, UserCog,
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
  { label: 'Dashboard',    href: '/dashboard',     icon: LayoutDashboard, roles: ['admin', 'chef_de_projet', 'membre', 'client'] },
  { label: 'Projets',      href: '/projects',      icon: FolderKanban,    roles: ['admin', 'chef_de_projet', 'membre', 'client'] },
  { label: 'Mes tâches',   href: '/tasks',         icon: CheckSquare,     roles: ['membre'] },
  { label: 'Équipe',       href: '/employees',     icon: Users,           roles: ['admin', 'chef_de_projet', 'membre', 'client'] },
  { label: 'Soumettre',    href: '/submit',        icon: FileText,        roles: ['client'] },
  { label: 'Notifications',href: '/notifications', icon: Bell,            roles: ['admin', 'chef_de_projet', 'membre', 'client'] },
];

const adminNavItems: NavItem[] = [
  { label: 'Utilisateurs', href: '/admin/users', icon: UserCog, roles: ['admin'] },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { currentUser, logout, notifications } = useApp();

  if (!currentUser) return null;

  const items = navItems.filter((item) => item.roles.includes(currentUser.role));
  const unreadCount = notifications.filter((n) => n.userId === currentUser.id && !n.read).length;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 264 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground flex flex-col [background-image:linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0)_35%)] overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0">
        <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white/10 text-white border border-white/10 flex-shrink-0 shadow-inner">
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
              <h1 className="font-display text-lg font-bold tracking-tight text-white">ProFlow</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Gestion de projets</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} unreadCount={item.href === '/notifications' ? unreadCount : 0} />
        ))}

        {currentUser.role === 'admin' && (
          <>
            <div className="flex items-center gap-2 pt-3 pb-1 px-2">
              {collapsed ? (
                <span className="h-px flex-1 bg-white/10" />
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Administration</span>
              )}
            </div>
            {adminNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </>
        )}

        <Link href="/settings" className={cn(
          'group flex items-center gap-3 rounded-2xl px-2 py-2 transition-all',
          pathname === '/settings' ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'text-white/70 hover:text-white hover:bg-white/10',
        )}>
          <span className={cn(
            'flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0 transition-colors',
            pathname === '/settings' ? 'bg-white/15 text-white' : 'bg-white/10 text-white/80 group-hover:bg-white/15 group-hover:text-white',
          )}>
            <Settings className="h-[18px] w-[18px]" />
          </span>
          {!collapsed && <span className="flex-1 truncate">Paramètres</span>}
          {!collapsed && (
            <ChevronRight className={cn('h-4 w-4 flex-shrink-0 transition-all', pathname === '/settings' ? 'text-white rotate-90' : 'text-white/35 group-hover:text-white/70')} />
          )}
        </Link>
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3 space-y-1 flex-shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 rounded-2xl px-2 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 text-white/80 flex-shrink-0">
            <ChevronLeft className={cn('h-[18px] w-[18px] transition-transform', collapsed && 'rotate-180')} />
          </span>
          {!collapsed && <span>Réduire</span>}
        </button>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 rounded-2xl px-2 py-2 text-sm text-white/70 hover:text-destructive hover:bg-destructive/20 transition-colors"
        >
          <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 text-white/80 flex-shrink-0">
            <LogOut className="h-[18px] w-[18px]" />
          </span>
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </motion.aside>
  );
}

function NavLink({ item, pathname, collapsed, unreadCount = 0 }: {
  item: NavItem;
  pathname: string | null;
  collapsed: boolean;
  unreadCount?: number;
}) {
  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
  const showBadge = unreadCount > 0;
  return (
    <Link href={item.href} className={cn(
      'group flex items-center gap-3 rounded-2xl px-2 py-2 transition-all',
      isActive
        ? 'bg-primary text-white shadow-lg shadow-primary/40'
        : 'text-white/70 hover:text-white hover:bg-white/10',
    )}>
      <span className={cn(
        'flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0 transition-colors',
        isActive ? 'bg-white/15 text-white' : 'bg-white/10 text-white/80 group-hover:bg-white/15 group-hover:text-white',
      )}>
        <item.icon className="h-[18px] w-[18px]" />
      </span>
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
      {!collapsed && !showBadge && (
        <ChevronRight className={cn('h-4 w-4 flex-shrink-0 transition-all', isActive ? 'text-white rotate-90' : 'text-white/35 group-hover:text-white/70')} />
      )}
      {showBadge && !collapsed && (
        <span className="bg-destructive text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
      {showBadge && collapsed && (
        <span className="absolute top-1.5 right-1.5 bg-destructive text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
