'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FolderKanban, Clock, CheckCircle2, Users, AlertTriangle,
  TrendingUp, FileText, CheckSquare, Edit3, Check, ListTodo,
  Briefcase, Layers,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { StatCard } from '@/components/shared/stat-card';
import { ProjectCard } from '@/components/shared/project-card';
import { FilterBar } from '@/components/shared/filter-bar';
import { PriorityBadge, SubtaskStatusBadge } from '@/components/shared/badges';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { projectStatusMeta, formatDate, getUser } from '@/lib/status';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function DashboardPage() {
  const user = useAuthGuard();
  const { projects, users, approveSubtask } = useApp();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

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

  // ---- Global activity & tasks charts data
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

  const globalTasksData = useMemo(() => {
    const allTasks = projects.flatMap((p) => p.subtasks);
    const cnt = { todo: 0, in_progress: 0, review: 0, done: 0 };
    allTasks.forEach((t) => { cnt[t.status] += 1; });
    return [
      { name: 'À faire', value: cnt.todo, color: 'hsl(var(--muted-foreground))' },
      { name: 'En cours', value: cnt.in_progress, color: 'hsl(var(--primary))' },
      { name: 'En révision', value: cnt.review, color: 'hsl(var(--accent))' },
      { name: 'Terminées', value: cnt.done, color: 'hsl(var(--success))' },
    ];
  }, [projects]);

  const statusDistribution = useMemo(() => {
    return (Object.keys(projectStatusMeta) as (keyof typeof projectStatusMeta)[])
      .map((k) => ({
        name: projectStatusMeta[k].label,
        value: projects.filter((p) => p.status === k).length,
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
  const allPendingMods = projects.flatMap((p) => p.modifications.filter((m) => m.status === 'pending').map((m) => ({ ...m, projectTitle: p.title })));
  const reviewTasks = (role === 'admin' || role === 'chef_de_projet')
    ? projects.flatMap((p) => p.subtasks.filter((st) => st.status === 'review').map((st) => ({ ...st, projectTitle: p.title })))
    : [];
  const myTasks = role === 'membre'
    ? projects.flatMap((p) => p.subtasks.filter((st) => st.assignedToId === user.id).map((st) => ({ ...st, projectTitle: p.title })))
    : [];

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
    // client
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
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">{greeting}</h2>
        <p className="text-muted-foreground mt-1">
          {role === 'admin' && 'Vue d\'ensemble de tous les projets et de l\'équipe'}
          {role === 'chef_de_projet' && 'Suivez et gérez vos projets assignés'}
          {role === 'membre' && 'Vos tâches et votre travail à accomplir'}
          {role === 'client' && 'Suivez l\'avancement de vos projets'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.06} />
        ))}
      </div>

      {/* Admin: pending validation section */}
      {role === 'admin' && pendingProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mb-6"
        >
          <Card className="p-5 border-warning/30 bg-warning/5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Projets en attente de validation</h3>
              <span className="ml-auto text-sm text-muted-foreground">{pendingProjects.length} à traiter</span>
            </div>
            <div className="space-y-3">
              {pendingProjects.map((p) => {
                const client = getUser(users, p.clientId);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                    <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center flex-shrink-0">
                      <span className="font-bold">{p.title[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{client?.name} · {formatDate(p.createdAt)}</p>
                    </div>
                    <PriorityBadge priority={p.priority} />
                    <Button size="sm" onClick={() => router.push(`/projects/${p.id}`)}>Examiner</Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Admin: pending modifications section */}
      {role === 'admin' && allPendingMods.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="mb-6"
        >
          <Card className="p-5 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <Edit3 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Demandes de modification en attente</h3>
              <span className="ml-auto text-sm text-muted-foreground">{allPendingMods.length} à examiner</span>
            </div>
            <div className="space-y-3">
              {allPendingMods.slice(0, 4).map((mod) => (
                <div key={mod.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{mod.requestedByName} — {mod.field}</p>
                    <p className="text-xs text-muted-foreground truncate">{mod.projectTitle}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/projects/${mod.projectId}`)}>Examiner</Button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Admin/Chef de projet: subtasks pending validation */}
      {(role === 'admin' || role === 'chef_de_projet') && reviewTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="mb-6"
        >
          <Card className="p-5 border-success/30 bg-success/5">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo className="h-5 w-5 text-success" />
              <h3 className="font-semibold">Sous-tâches à valider</h3>
              <span className="ml-auto text-sm text-muted-foreground">{reviewTasks.length} en attente</span>
            </div>
            <div className="space-y-3">
              {reviewTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.projectTitle} · {getUser(users, t.assignedToId)?.name ?? 'Non assigné'}</p>
                  </div>
                  <SubtaskStatusBadge status={t.status} />
                  <Button size="sm" className="gap-1.5 bg-success hover:bg-success/90" onClick={() => approveSubtask(t.projectId, t.id)}>
                    <Check className="h-3.5 w-3.5" /> Valider
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/projects/${t.projectId}`)}>Voir</Button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Employee: quick task overview */}
      {role === 'membre' && myTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
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

      {/* Charts: activité mensuelle + répartition tâches globales (admin & chef de projet) */}
      {(role === 'admin' || role === 'chef_de_projet') && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
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
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="created" name="Projets créés" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorCreated)" />
                  <Area type="monotone" dataKey="delivered" name="Projets livrés" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 3" fill="url(#colorDelivered)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Répartition des tâches globales */}
          <Card className="p-5">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" /> Tâches globales
              </h3>
              <span className="text-xs text-muted-foreground">{projects.reduce((s, p) => s + p.subtasks.length, 0)} tâches</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={globalTasksData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {globalTasksData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Client: chart of their projects by status */}
      {role === 'client' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
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
                  <Bar dataKey="value" name="Projets" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filters + Projects grid */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">
          {role === 'admin' ? 'Tous les projets' : role === 'membre' ? 'Mes projets' : 'Projets'}
        </h3>
        {role === 'client' && (
          <Button size="sm" onClick={() => router.push('/submit')}>
            <FileText className="h-4 w-4 mr-2" /> Soumettre un projet
          </Button>
        )}
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
