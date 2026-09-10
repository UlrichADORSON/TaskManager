'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Users as UsersIcon, Building2, UserCog, ShieldHalf } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { ViewToggle, type ViewMode } from '@/components/shared/view-toggle';
import { UserListView, StatusLegend } from '@/components/shared/user-list-view';
import { UserKanbanBoard } from '@/components/shared/user-kanban-board';
import { MemberProfileDialog } from '@/components/shared/member-profile-dialog';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

type GroupFilter = 'all' | 'clients' | 'team';

const GROUPS: { id: GroupFilter; label: string; icon: any }[] = [
  { id: 'all', label: 'Tous', icon: UserCog },
  { id: 'clients', label: 'Clients', icon: Building2 },
  { id: 'team', label: 'Équipe', icon: ShieldHalf },
];

export default function AdminUsersPage() {
  const user = useAuthGuard();
  const router = useRouter();
  const { users, projects, activeUserIds } = useApp();
  const [group, setGroup] = useState<GroupFilter>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/dashboard');
  }, [user, router]);

  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.clientId] = (counts[p.clientId] ?? 0) + 1;
    });
    return counts;
  }, [projects]);

  const visibleUsers = useMemo(() => {
    if (!user) return [];
    let list = users;
    if (group === 'clients') list = list.filter((u) => u.role === 'client');
    else if (group === 'team') list = list.filter((u) => u.role === 'membre' || u.role === 'chef_de_projet');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.company ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [user, users, group, search]);

  if (!user || user.role !== 'admin') return null;

  const openProfile = (u: User) => {
    setSelected(u);
    setProfileOpen(true);
  };

  const counts: Record<GroupFilter, number> = {
    all: users.length,
    clients: users.filter((u) => u.role === 'client').length,
    team: users.filter((u) => u.role === 'membre' || u.role === 'chef_de_projet').length,
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Utilisateurs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Clients et membres de l'équipe — {visibleUsers.length} affiché{visibleUsers.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusLegend />
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {GROUPS.map((g) => {
          const active = group === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(g.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 active:scale-[0.98]',
                active
                  ? 'border-primary bg-primary text-white shadow-sm shadow-primary/25'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              <g.icon className="h-3.5 w-3.5" />
              {g.label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                active ? 'bg-white/15 text-white' : 'bg-muted text-muted-foreground'
              )}>
                {counts[g.id]}
              </span>
            </button>
          );
        })}

        <div className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-3 py-2 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {visibleUsers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucun utilisateur trouvé.</p>
        </div>
      ) : view === 'list' ? (
        <UserListView users={visibleUsers} activeUserIds={activeUserIds} projectCounts={projectCounts} onSelect={openProfile} />
      ) : (
        <UserKanbanBoard users={visibleUsers} activeUserIds={activeUserIds} projectCounts={projectCounts} onSelect={openProfile} />
      )}

      <MemberProfileDialog
        user={selected}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        canEdit
      />
    </AppShell>
  );
}