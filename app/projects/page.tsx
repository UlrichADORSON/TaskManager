'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { ProjectCard } from '@/components/shared/project-card';
import { FilterBar } from '@/components/shared/filter-bar';
import { projectStatusMeta } from '@/lib/status';
import { motion } from 'framer-motion';
import { FolderKanban } from 'lucide-react';

export default function ProjectsPage() {
  const user = useAuthGuard();
  const { projects } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  const visibleProjects = useMemo(() => {
    if (!user) return [];
    let list = projects;
    if (user.role === 'client') list = list.filter((p) => p.clientId === user.id);
    else if (user.role === 'manager') list = list.filter((p) => p.managerId === user.id);
    else if (user.role === 'employee') list = list.filter((p) => p.subtasks.some((st) => st.assignedToId === user.id));
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter((p) => p.priority === priorityFilter);
    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [user, projects, statusFilter, priorityFilter, search]);

  if (!user) return null;

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-2xl font-bold tracking-tight mb-6">Projets</h2>
      </motion.div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un projet..."
        filters={[
          {
            key: 'status', value: statusFilter, onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'Tous les statuts' },
              ...Object.entries(projectStatusMeta).map(([v, m]) => ({ value: v, label: m.label })),
            ],
          },
          {
            key: 'priority', value: priorityFilter, onChange: setPriorityFilter,
            options: [
              { value: 'all', label: 'Toutes priorités' },
              { value: 'low', label: 'Basse' },
              { value: 'medium', label: 'Moyenne' },
              { value: 'high', label: 'Haute' },
              { value: 'urgent', label: 'Urgente' },
            ],
          },
        ]}
      />

      {visibleProjects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucun projet trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {visibleProjects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
