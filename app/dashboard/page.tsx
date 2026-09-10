'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FolderKanban, Clock, CheckCircle2, Users, ShieldCheck, ListChecks,
  TrendingUp, FileText, CheckSquare, Briefcase, Layers,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { StatCard } from '@/components/shared/stat-card';
import { FilterBar } from '@/components/shared/filter-bar';
import { ViewToggle, type ViewMode } from '@/components/shared/view-toggle';
import { ProjectListView } from '@/components/shared/project-list-view';
import { ProjectKanbanBoard } from '@/components/shared/project-kanban-board';
import { PriorityBadge, SubtaskStatusBadge } from '@/components/shared/badges';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { projectStatusMeta } from '@/lib/status';
import type { ProjectStatus } from '@/types';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_CHART_COLORS: Record<ProjectStatus, string> = {
  pending: 'hsl(var(--warning))',
  validated: 'hsl(var(--info))',
  rejected: 'hsl(var(--destructive))',
  assigned: 'hsl(var(--chart-5))',
  in_progress: 'hsl(var(--primary))',
  completed: 'hsl(var(--success))',
};

export default function DashboardPage() {
  const user = useAuthGuard();
  const { projects, users, updateProjectStatus } = useApp();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('kanban');

  const visibleProjects = useMemo(() => {
    if (!user) return [];
    let list = projects;
    if (user.role === 'client') {
      list = list.filter((p) => p.clientId === user.id);
    } else if (user.role === 'chef_de_projet') {
      list = list.filter((p) => p.managerId === user.id);
    } else if (user.role === 'membre') {
      list = list.filter((p) => p.subtasks.some((st) => st.assignedToId === user.id) || p.members.some((m) => m.userId === user.id));
    }
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter((p) => p.priority === priorityFilter);
    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [user, projects, statusFilter, priorityFilter, search]);

  // Projets soumis en attente de validation (les sous-tâches en révision se gèrent dans le projet)
  const toValidateList = useMemo(
    () => visibleProjects.filter((p) => p.status === 'pending'),
    [visibleProjects],
  );

  // ---- Charts data (adapted from suivi-Projet: activit. mensuelle + répartition par statut)
  const activityData = useMemo(() => {
    const created = MONTHS.map((_, mi) => ({ month: MONTHS[mi], created: 0, delivered: 0 }));
    projects.forEach((p) => {
      const c = new Date(p.createdAt).getMonth();
      created[c].created += 1;
      if (p.status === 'completed') {
        const e = new Date(p.endDate).getMonth();
        created[e].delivered += 1;
      }
    });
    return created;
  }, [projects]);

  const statusDistribution = useMemo(() => {
    return (Object.keys(projectStatusMeta) as ProjectStatus[])
      .map((k) => ({
        name: projectStatusMeta[k].label,
        value: projects.filter((p) => p.status === k).length,
        color: STATUS_CHART_COLORS[k],
      }))
      .filter((d) => d.value > 0);
  }, [projects]);

  if (!user) return null;

  // ---- Role-specific stats
  const role = user.role;
  const pendingProjects = projects.filter((p) => p.status === 'pending');
  const inProgressProjects = projects.filter((p) => p.status === 'in_progress');
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const allEmployees = users.filter((u) => u.role === 'membre' || u.role === 'chef_de_projet');
  const myTasks = role === 'membre'
    ? projects.flatMap((p) => p.subtasks.filter((st) => st.assignedToId === user.id).map((st) => ({ ...st, projectTitle: p.title })))
    : [];

  const canManage = role === 'admin' || role === 'chef_de_projet';

  // ---- Stats per role
  let stats: { label: string; value: string | number; icon: any; color?: string; trend?: { value: string; positive: boolean }; onClick?: () => void }[] = [];
  let greeting = `Bonjour, ${user.name.split(' ')[0]}`;

  if (role === 'admin') {
    stats = [
      { label: 'Projets en attente', value: pendingProjects.length, icon: Clock, color: 'text-warning', trend: pendingProjects.length > 3 ? { value: 'Action requise', positive: false } : undefined, onClick: () => router.push('/projects') },
      { label: 'Projets en cours', value: inProgressProjects.length, icon: TrendingUp, color: 'text-primary', onClick: () => router.push('/projects') },
      { label: 'Équipe', value: allEmployees.length, icon: Users, color: 'text-accent', onClick: () => router.push('/employees') },
      { label: 'Projets terminés', value: completedProjects.length, icon: CheckCircle2, color: 'text-success', onClick: () => router.push('/projects') },
    ];
  } else if (role === 'chef_de_projet') {
    const myProjects = projects.filter((p) => p.managerId === user.id);
    stats = [
      { label: 'Mes projets', value: myProjects.length, icon: FolderKanban, color: 'text-primary', onClick: () => router.push('/projects') },
      { label: 'En cours', value: myProjects.filter((p) => p.status === 'in_progress').length, icon: TrendingUp, color: 'text-accent', onClick: () => router.push('/projects') },
      { label: 'Tâches totales', value: myProjects.flatMap((p) => p.subtasks).length, icon: CheckSquare, color: 'text-warning', onClick: () => router.push('/projects') },
      { label: 'Terminés', value: myProjects.filter((p) => p.status === 'completed').length, icon: CheckCircle2, color: 'text-success', onClick: () => router.push('/projects') },
    ];
  } else if (role === 'membre') {
    stats = [
      { label: 'Mes tâches', value: myTasks.length, icon: CheckSquare, color: 'text-primary', onClick: () => router.push('/tasks') },
      { label: 'À faire', value: myTasks.filter((t) => t.status === 'todo').length, icon: Clock, color: 'text-warning', onClick: () => router.push('/tasks') },
      { label: 'En cours', value: myTasks.filter((t) => t.status === 'in_progress').length, icon: TrendingUp, color: 'text-accent', onClick: () => router.push('/tasks') },
      { label: 'Terminées', value: myTasks.filter((t) => t.status === 'done').length, icon: CheckCircle2, color: 'text-success', onClick: () => router.push('/tasks') },
    ];
  } else {
    const myProjects = projects.filter((p) => p.clientId === user.id);
    stats = [
      { label: 'Mes projets', value: myProjects.length, icon: FolderKanban, color: 'text-primary', onClick: () => router.push('/projects') },
      { label: 'En cours', value: myProjects.filter((p) => p.status === 'in_progress').length, icon: TrendingUp, color: 'text-accent', onClick: () => router.push('/projects') },
      { label: 'En attente', value: myProjects.filter((p) => p.status === 'pending').length, icon: Clock, color: 'text-warning', onClick: () => router.push('/projects') },
      { label: 'Terminés', value: myProjects.filter((p) => p.status === 'completed').length, icon: CheckCircle2, color: 'text-success', onClick: () => router.push('/projects') },
    ];
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">{greeting}</h2>
          <p className="text-muted-foreground mt-1">
            {role === 'admin' && 'Vue d\'ensemble de tous les projets et de l\'équipe'}
            {role === 'chef_de_projet' && 'Suivez et gérez vos projets assignés'}
            {role === 'membre' && 'Vos tâches et votre travail à accomplir'}
            {role === 'client' && 'Suivez l\'avancement de vos projets'}
          </p>
        </div>
        {role === 'client' && (
          <Button size="sm" onClick={() => router.push('/submit')}>
            <FileText className="h-4 w-4 mr-2" /> Soumettre un projet
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.06} />
        ))}
      </div>

      {/* Charts row — adapted from suivi-Projet: line (activité mensuelle) + doughnut (répartition par statut) */}
      {(role === 'admin' || role === 'chef_de_projet') && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
        >
          {/* Activité mensuelle */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Activité mensuelle
              </h3>
              <span className="text-xs text-muted-foreground">12 derniers mois</span>
            </div>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="created" name="Projets créés" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorCreated)" fillOpacity={0.15} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="delivered" name="Projets livrés" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Répartition par statut */}
          <Card className="p-5">
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" /> Répartition par statut
              </h3>
              <span className="text-xs text-muted-foreground">{projects.length} projets</span>
            </div>
            <div className="relative h-64 sm:h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="88%" paddingAngle={2} strokeWidth={2}>
                    {statusDistribution.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-7">
                <span className="text-2xl font-bold tabular-nums text-foreground">{projects.length}</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Projets</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Client: chart of their projects by status */}
      {role === 'client' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" /> Répartition de mes projets par statut
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Projets" radius={[6, 6, 0, 0]}>
                    {statusDistribution.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Employee: quick task overview */}
      {role === 'membre' && myTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="mb-6"
        >
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Mes tâches en cours</h3>
              <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>Voir tout</Button>
            </div>
            <div className="space-y-3">
              {myTasks.filter((t) => t.status !== 'done').slice(0, 4).map((t) => (
                <button
                  key={t.id}
                  onClick={() => router.push(`/projects/${t.projectId}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.projectTitle}</p>
                  </div>
                  <SubtaskStatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Main content: projects with integrated "À valider" section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold">
            {role === 'admin' ? 'Tous les projets' : role === 'membre' ? 'Mes projets' : 'Projets'}
          </h3>
          <ViewToggle value={view} onChange={setView} />
        </div>

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
        ) : view === 'list' ? (
          <>
            {toValidateList.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
                <ShieldCheck className="h-4 w-4 text-warning" />
                <p className="text-sm text-muted-foreground flex-1 min-w-0">
                  <span className="font-semibold text-foreground">À valider :</span>{' '}
                  {toValidateList.length} projet{toValidateList.length > 1 ? 's' : ''} en attente
                </p>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setView('kanban')}>
                  <ListChecks className="h-3.5 w-3.5 mr-1.5" /> Afficher
                </Button>
              </div>
            )}
            <ProjectListView projects={visibleProjects} />
          </>
        ) : (
          <ProjectKanbanBoard
            projects={visibleProjects}
            users={users}
            canManage={canManage}
            onMove={updateProjectStatus}
            validationColumn
          />
        )}
      </motion.div>
    </AppShell>
  );
}