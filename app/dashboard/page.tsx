'use client';

import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FolderKanban, Clock, CheckCircle2, Users, ShieldCheck, ListChecks,
  TrendingUp, FileText, CheckSquare, Briefcase, Layers, CalendarDays, Upload, Send,
  Edit3, ArrowUpRight, MessageSquareQuote, BarChart3,
} from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { isProjectArchived } from '@/lib/status';
import { AppShell } from '@/components/shared/app-shell';
import { StatCard } from '@/components/shared/stat-card';
import { FilterBar } from '@/components/shared/filter-bar';
import { ViewToggle, type ViewMode } from '@/components/shared/view-toggle';
import { ProjectListView } from '@/components/shared/project-list-view';
import { ProjectKanbanBoard } from '@/components/shared/project-kanban-board';
import { PriorityBadge, SubtaskStatusBadge } from '@/components/shared/badges';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { projectStatusMeta, getUser, formatDate } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ProjectStatus, Priority, SubtaskStatus } from '@/types';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_CHART_COLORS: Record<ProjectStatus, string> = {
  pending: 'hsl(var(--warning))',
  validated: 'hsl(var(--info))',
  rejected: 'hsl(var(--destructive))',
  assigned: 'hsl(var(--chart-5))',
  in_progress: 'hsl(var(--primary))',
  completed: 'hsl(var(--success))',
};

function subtaskBarColor(status: SubtaskStatus): string {
  switch (status) {
    case 'done':
      return 'hsl(var(--success))';
    case 'in_progress':
      return 'hsl(var(--primary))';
    case 'review':
      return 'hsl(var(--chart-5))';
    case 'cancelled':
      return 'hsl(var(--destructive))';
    default:
      return 'hsl(var(--muted-foreground))';
  }
}

export default function DashboardPage() {
  const user = useAuthGuard();
  const { projects, users, updateProjectStatus, requestTask } = useApp();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('kanban');
  const [reqForm, setReqForm] = useState<{ projectId: string; title: string; description: string; priority: Priority; besoinDate: string }>({
    projectId: '', title: '', description: '', priority: 'medium', besoinDate: '',
  });
  const [reqPhoto, setReqPhoto] = useState<{ url: string; name: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [selectedProgressProjectId, setSelectedProgressProjectId] = useState('');

  const clientProjects = useMemo(
    () => user ? projects.filter((p) => p.clientId === user.id && !isProjectArchived(p)) : [],
    [user, projects],
  );

  const clientProgressData = useMemo(() => {
    const byDate = new Map<string, { planned: number; actual: number; count: number }>();
    clientProjects.forEach((p) => {
      const pts = p.progressTimeline && p.progressTimeline.length > 0
        ? p.progressTimeline
        : [{ date: p.startDate, planned: 0, actual: 0 }, { date: p.endDate, planned: p.progress, actual: p.progress }];
      pts.forEach((pt) => {
        const key = String(pt.date).slice(0, 7);
        const cur = byDate.get(key) ?? { planned: 0, actual: 0, count: 0 };
        cur.planned += pt.planned;
        cur.actual += pt.actual;
        cur.count += 1;
        byDate.set(key, cur);
      });
    });
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({ month, planned: Math.round(v.planned / v.count), actual: Math.round(v.actual / v.count) }));
  }, [clientProjects]);

  const selectedProgressProject = useMemo(
    () => user ? clientProjects.find((p) => p.id === selectedProgressProjectId) ?? clientProjects[0] ?? null : null,
    [clientProjects, selectedProgressProjectId, user],
  );

  const selectedSubtaskLines = useMemo(() => {
    if (!selectedProgressProject) return null;
    const subtasks = (selectedProgressProject.subtasks ?? []).filter((s) => s.status !== 'cancelled');
    if (subtasks.length === 0) return null;
    const day = (iso: string) => String(iso).slice(0, 10);
    const keys = Array.from(
      new Set(subtasks.flatMap((s) => [day(s.startDate), day(s.dueDate)])),
    ).sort();
    const rows: Array<Record<string, string | number>> = keys.map((key) => ({ key }));
    subtasks.forEach((s) => {
      const si = keys.indexOf(day(s.startDate));
      const ei = keys.indexOf(day(s.dueDate));
      for (let i = Math.min(si, ei); i <= Math.max(si, ei); i++) {
        const row = rows[i];
        if (!row) continue;
        const t = si === ei ? 1 : (i - si) / (ei - si);
        row[s.id] = Math.round(s.progress * t);
      }
    });
    return {
      rows,
      series: subtasks.map((s) => ({ id: s.id, title: s.title, status: s.status })),
    };
  }, [selectedProgressProject]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReqPhoto({ url: String(reader.result), name: file.name });
    reader.readAsDataURL(file);
  };

  const handleRequestTask = () => {
    const pid = reqForm.projectId || clientProjects[0]?.id || '';
    if (!pid || !reqForm.title.trim()) return;
    requestTask(pid, {
      title: reqForm.title,
      description: reqForm.description,
      priority: reqForm.priority,
      besoinDate: reqForm.besoinDate || null,
      photoUrl: reqPhoto?.url ?? null,
      photoName: reqPhoto?.name ?? null,
    });
    setReqForm((f) => ({ ...f, projectId: pid, title: '', description: '', priority: 'medium', besoinDate: '' }));
    setReqPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
    toast({ title: 'Demande envoyée', description: 'Votre demande de tâche sera examinée par l\'équipe.' });
  };

  const visibleProjects = useMemo(() => {
    if (!user) return [];
    let list = projects;
    if (user.role === 'client') {
      list = list.filter((p) => p.clientId === user.id);
    } else if (user.role === 'chef_de_projet') {
      list = list.filter((p) => p.managerId === user.id);
    } else     if (user.role === 'membre') {
      list = list.filter((p) => p.subtasks.some((st) => st.assignedToId === user.id) || p.members.some((m) => m.userId === user.id));
    }
    // Exclude archived projects (terminal status older than 24h)
    list = list.filter((p) => !isProjectArchived(p));
    if (dateFilter !== 'all') {
      const now = new Date();
      let refStart: Date;
      let refEnd: Date;
      if (dateFilter === 'today') { refStart = startOfDay(now); refEnd = endOfDay(now); }
      else if (dateFilter === 'this_week') { refStart = startOfWeek(now, { weekStartsOn: 1 }); refEnd = endOfWeek(now, { weekStartsOn: 1 }); }
      else { refStart = startOfMonth(now); refEnd = endOfMonth(now); }
      list = list.filter((p) => {
        const s = parseISO(p.startDate);
        const e = parseISO(p.endDate);
        return s <= refEnd && e >= refStart;
      });
    }
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter((p) => p.priority === priorityFilter);
    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [user, projects, statusFilter, priorityFilter, dateFilter, search]);

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

  // ---- Demandes de modification (admin / chef de projet)
  const incomingClientMods = useMemo(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'chef_de_projet')) return [];
    const targets = user.role === 'admin' ? projects : projects.filter((p) => p.managerId === user.id);
    return targets
      .flatMap((p) =>
        p.modifications
          .filter((m) => (m.status === 'pending' || m.status === 'pending_client') && getUser(users, m.requestedById)?.role === 'client')
          .map((m) => ({ ...m, projectId: p.id, projectTitle: p.title }))
      )
      .slice(0, 4);
  }, [user, projects, users]);

  const myMods = useMemo(() => {
    if (!user) return [];
    return projects.flatMap((p) =>
      p.modifications.filter((m) => m.requestedById === user.id).map((m) => ({ ...m, projectId: p.id, projectTitle: p.title }))
    );
  }, [user, projects]);

  // ---- Requêtes envoyées par l'équipe (admin / chef / membre)
  const myRequetes = useMemo(() => {
    if (!user || user.role === 'client') return [];
    return projects.flatMap((p) =>
      p.requetes.filter((r) => r.createdById === user.id).map((r) => ({ ...r, projectId: p.id, projectTitle: p.title }))
    );
  }, [user, projects]);
  const myRequetesPending = myRequetes.filter((r) => r.status === 'pending');

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

  // ---- Requêtes demandées au client par l'équipe
  const clientRequetes = role === 'client'
    ? projects.flatMap((p) =>
        p.clientId === user.id
          ? p.requetes.map((r) => ({ ...r, projectId: p.id, projectTitle: p.title }))
          : []
      )
    : [];
  const clientRequetesPending = clientRequetes.filter((r) => r.status === 'pending');

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
      { label: 'Requêtes demandées', value: clientRequetesPending.length, icon: MessageSquareQuote, color: 'text-info', onClick: () => router.push('/requetes') },
    ];
  }

  return (
    <AppShell>
      {/* Header Banner */}
      <div className="relative mb-8 rounded-2xl overflow-hidden bg-slate-900 shadow-md">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=2070&auto=format&fit=crop"
            alt="Mountain landscape"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
        </div>
        
        <div className="relative z-10 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="text-white">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-2">
              {greeting}
            </h2>
            <p className="text-white/80 max-w-lg">
              {role === 'admin' && 'Vue d\'ensemble de tous les projets et de l\'équipe.'}
              {role === 'chef_de_projet' && 'Suivez et gérez vos projets assignés.'}
              {role === 'membre' && 'Voici un aperçu de votre activité aujourd\'hui.'}
              {role === 'client' && 'Suivez l\'avancement de vos projets.'}
            </p>
          </div>
          {role === 'client' && (
            <Button size="lg" onClick={() => router.push('/submit')} className="shadow-soft-lg hover:scale-105 transition-transform">
              <FileText className="h-4 w-4 mr-2" /> Soumettre un projet
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={cn('grid grid-cols-2 gap-3 mb-6', role === 'client' ? 'sm:grid-cols-3 lg:grid-cols-5' : 'lg:grid-cols-4')}>
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

      {/* Demandes de modification — par le client / par moi */}
      {(role === 'admin' || role === 'chef_de_projet') && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
        >
          {/* Par le client */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-warning" /> Demandes de modification — client
              </h3>
              <Button variant="ghost" size="sm" onClick={() => router.push('/modifications')}>Voir tout</Button>
            </div>
            {incomingClientMods.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Edit3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune demande de modification client en attente.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {incomingClientMods.map((m) => {
                  const requester = getUser(users, m.requestedById);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => router.push(`/projects/${m.projectId}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {requester?.name ?? m.requestedByName} — {m.projectTitle}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {m.field} : « {m.newValue} »
                        </p>
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-warning">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                          {m.status === 'pending_client' ? 'Validation client attendue' : 'En attente de votre avis'}
                        </span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Par moi */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Mes demandes de modification
              </h3>
              <Button variant="ghost" size="sm" onClick={() => router.push('/modifications')}>Voir tout</Button>
            </div>
            {myMods.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Send className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Vous n&apos;avez pas encore envoyé de demande.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myMods.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => router.push(`/projects/${m.projectId}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.projectTitle}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{m.field} : « {m.newValue} »</p>
                      <span className="text-[10px] text-muted-foreground">{formatDate(m.createdAt)}</span>
                    </div>
                    <ModStatusBadge status={m.status} />
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Requêtes envoyées (admin / chef / membre) */}
      {(role === 'admin' || role === 'chef_de_projet' || role === 'membre') && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mb-6"
        >
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquareQuote className="h-4 w-4 text-primary" /> Mes requêtes envoyées
                {myRequetesPending.length > 0 && (
                  <span className="rounded-full bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                    {myRequetesPending.length} en attente de réponse
                  </span>
                )}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => router.push('/requetes')}>Voir tout</Button>
            </div>
            {myRequetes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Send className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Vous n&apos;avez pas encore envoyé de requête au client.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myRequetes.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => router.push('/requetes')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.projectTitle}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{r.content}</p>
                      <span className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.status === 'pending' ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 flex-shrink-0">
                        En attente
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 flex-shrink-0">
                        Répondu
                      </span>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Client: progression globale (courbe) + demande de tâche */}
      {role === 'client' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
        >
          {/* Progression globale — courbe prévu vs réel */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Progression globale de mes projets
              </h3>
              <span className="text-xs text-muted-foreground">Moyenne prévu vs réel</span>
            </div>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clientProgressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="actual" name="Avancement réel (%)" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorActual)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="planned" name="Prévu (%)" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 4" fill="url(#colorPlanned)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Demande de tâche */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-4 w-4 text-accent" />
              <h3 className="font-semibold">Demander une tâche</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium">Projet concerné *</Label>
                <Select
                  value={reqForm.projectId || clientProjects[0]?.id || ''}
                  onValueChange={(v) => setReqForm((f) => ({ ...f, projectId: v }))}
                >
                  <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {clientProjects.length === 0 && <SelectItem value="_none" disabled>Aucun projet</SelectItem>}
                    {clientProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Titre de la tâche *</Label>
                <Input
                  className="mt-1"
                  value={reqForm.title}
                  onChange={(e) => setReqForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="ex. Ajouter un module de paiement"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  className="mt-1 resize-none"
                  rows={3}
                  value={reqForm.description}
                  onChange={(e) => setReqForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez votre besoin..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Date de nécessité</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={reqForm.besoinDate}
                    onChange={(e) => setReqForm((f) => ({ ...f, besoinDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Priorité</Label>
                  <Select value={reqForm.priority} onValueChange={(v) => setReqForm((f) => ({ ...f, priority: v as Priority }))}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                {reqPhoto ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                    <img src={reqPhoto.url} alt="aperçu" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{reqPhoto.name}</p>
                      <button type="button" className="text-[11px] text-destructive hover:underline" onClick={() => { setReqPhoto(null); if (photoInputRef.current) photoInputRef.current.value = ''; }}>
                        Retirer la photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full rounded-xl border-2 border-dashed border-border py-3 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-xs font-medium">Ajouter une photo (optionnel)</span>
                  </button>
                )}
              </div>
              <Button className="w-full" onClick={handleRequestTask} disabled={!reqForm.title.trim() || clientProjects.length === 0}>
                <Send className="h-4 w-4 mr-2" /> Envoyer la demande
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Client: progression d'un projet sélectionné */}
      {role === 'client' && selectedProgressProject && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.22 }}
          className="mb-6"
        >
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Progression d{'\''}un projet
              </h3>
              <Select value={selectedProgressProject.id} onValueChange={setSelectedProgressProjectId}>
                <SelectTrigger className="sm:w-80 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">{selectedProgressProject.title}</span>
              <span className="text-xs font-semibold text-primary">Avancement actuel : {selectedProgressProject.progress}%</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border',
                  projectStatusMeta[selectedProgressProject.status]?.color === 'success'
                    ? 'bg-success/15 text-success border-success/30'
                    : projectStatusMeta[selectedProgressProject.status]?.color === 'warning'
                      ? 'bg-warning/15 text-warning border-warning/30'
                      : projectStatusMeta[selectedProgressProject.status]?.color === 'destructive'
                        ? 'bg-destructive/15 text-destructive border-destructive/30'
                        : 'bg-info/15 text-info border-info/30',
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {projectStatusMeta[selectedProgressProject.status]?.label}
              </span>
            </div>
            <div className="h-64 sm:h-72">
              {selectedSubtaskLines && selectedSubtaskLines.rows.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedSubtaskLines.rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="key"
                      tickFormatter={(v: string) =>
                        new Date(`${v}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      }
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value) => [`${value}%`]}
                      labelFormatter={(v) =>
                        new Date(`${v}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
                    {selectedSubtaskLines.series.map((s) => (
                      <Line
                        key={s.id}
                        type="monotone"
                        dataKey={s.id}
                        name={s.title}
                        stroke={subtaskBarColor(s.status)}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Aucune sous-tâche pour ce projet.
                </div>
              )}
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

      {/* Client: requêtes demandées par l'équipe */}
      {role === 'client' && clientRequetes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="mb-6"
        >
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquareQuote className="h-4 w-4 text-info" /> Requêtes demandées
                {clientRequetesPending.length > 0 && (
                  <span className="rounded-full bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                    {clientRequetesPending.length} à répondre
                  </span>
                )}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => router.push('/requetes')}>Voir tout</Button>
            </div>
            <div className="space-y-2.5">
              {clientRequetes.slice(0, 4).map((r) => {
                const requester = getUser(users, r.createdById);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => router.push('/requetes')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {requester?.name ?? r.createdByName} · {r.projectTitle}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{r.content}</p>
                    </div>
                    {r.status === 'pending' ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 flex-shrink-0">
                        À répondre
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 flex-shrink-0">
                        Répondu
                      </span>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
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
              key: 'date', value: dateFilter, onChange: setDateFilter,
              options: [
                { value: 'all', label: 'Toutes les dates' },
                { value: 'today', label: "Aujourd'hui" },
                { value: 'this_week', label: 'Cette semaine' },
                { value: 'this_month', label: 'Ce mois-ci' },
              ],
            },
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

function ModStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Envoyée', className: 'bg-warning/15 text-warning border-warning/30' },
    pending_client: { label: 'Validation client', className: 'bg-info/15 text-info border-info/30' },
    approved: { label: 'Acceptée', className: 'bg-success/15 text-success border-success/30' },
    rejected: { label: 'Rejetée', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  };
  const c = config[status];
  if (!c) return null;
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', c.className)}>{c.label}</span>;
}