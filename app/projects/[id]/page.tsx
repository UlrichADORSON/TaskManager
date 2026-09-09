'use client';

import { useState, lazy, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const GanttChart = lazy(() => import('@/components/shared/gantt-chart').then(m => ({ default: m.GanttChart })));
const ProgressChart = lazy(() => import('@/components/shared/progress-chart').then(m => ({ default: m.ProgressChart })));
import {
  ArrowLeft, Calendar, Euro, Users, FolderKanban, BarChart3,
  MessageSquare, GanttChartSquare, Info, UserCircle, CalendarDays, MapPin, Clock,
  CheckCircle2, XCircle, UserCog, Plus, UserPlus,
  FileText, Image as ImageIcon, Edit3, AlertCircle,
  Check, Trash2, Download, Eye, Lock, Paperclip, Send, ListTodo,
  Phone, Mail, Building2, User as UserIcon, CalendarClock, ArrowUpRight,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  StatusBadge, PriorityBadge, SubtaskStatusBadge, RoleBadge,
} from '@/components/shared/badges';
import { UserAvatar } from '@/components/shared/user-avatar';
import { MemberProfileDialog } from '@/components/shared/member-profile-dialog';
import { ProgressBar, ProgressRing } from '@/components/shared/progress';
import { StatCard } from '@/components/shared/stat-card';
import {
  getUser, formatDate, formatDateTime, formatCurrency, daysUntil, daysBetween,
  specialtyMeta,
} from '@/lib/status';
import type { SubtaskStatus, Priority, ModificationRequest, Role, Subtask, MemberSpecialty, User } from '@/types';
import { cn } from '@/lib/utils';

export default function ProjectDetailPage() {
  const user = useAuthGuard();
  const {
    projects, users,     validateProject, rejectProject, assignManager,
    addSubtask, addProjectMember, removeProjectMember, reviewModification,
    suggestModification, approveSubtask, addSubtaskComment,
    scheduleClientMeeting,
    addEmployee: addEmployeeFromContext,
  } = useApp();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') as string | null;
  const projectId = params?.id as string;
  const project = projects.find((p) => p.id === projectId);

  const [activeTab, setActiveTab] = useState<string>(initialTab && ['info', 'gantt', 'progress', 'calendar', 'tasks', 'team', 'modifications'].includes(initialTab) ? initialTab : 'info');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [newSubtaskOpen, setNewSubtaskOpen] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: '', description: '', priority: 'medium' as Priority,
    assignedToId: '', startDate: '', dueDate: '', dependsOnId: '',
  });
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({
    existingUserId: '', role: 'membre' as Role,
    createNew: false, name: '', email: '', password: '', specialty: 'Designer' as string,
  });
  const [reviewDialog, setReviewDialog] = useState<{ mod: ModificationRequest; decision: 'approved' | 'rejected' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [fileViewer, setFileViewer] = useState<{ url: string; fileName: string; fileType: string } | null>(null);
  const [modReqOpen, setModReqOpen] = useState(false);
  const [modReq, setModReq] = useState({
    target: 'project' as 'project' | 'subtask',
    subtaskId: '',
    field: 'description' as string,
    newValue: '',
    reason: '',
  });
  // Task discussion state
  const [discussionSubtask, setDiscussionSubtask] = useState<Subtask | null>(null);
  const [commentText, setCommentText] = useState('');
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ date: '', note: '' });
  const [profileUser, setProfileUser] = useState<User | null>(null);

  if (!user) return null;
  if (!project) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Projet introuvable.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">Retour au dashboard</Button>
        </div>
      </AppShell>
    );
  }

  const client = getUser(users, project.clientId);
  const teamMembers = project.members.map((m) => ({ ...m, user: getUser(users, m.userId) })).filter((m) => m.user);
  const members = users.filter((u) => u.role === 'membre');
  const chefs = users.filter((u) => u.role === 'chef_de_projet');
  const daysLeft = daysUntil(project.endDate);
  const isLate = daysLeft < 0 && project.status === 'in_progress';
  const canManage = user.role === 'admin' || user.role === 'chef_de_projet';
  const isProjectMember = project.members.some((m) => m.userId === user.id);
  const canViewAttachments = user.role === 'admin' || user.role === 'chef_de_projet' || isProjectMember;
  const pendingMods = project.modifications.filter((m) => m.status === 'pending');
  const availableEmployees = members.filter((e) => !project.members.some((m) => m.userId === e.id));

  const handleReject = () => {
    if (rejectReason.trim()) {
      rejectProject(project.id, rejectReason.trim());
      setRejectOpen(false);
      setRejectReason('');
    }
  };

  const handleCreateSubtask = () => {
    if (!newSubtask.title || !newSubtask.startDate || !newSubtask.dueDate) return;
    addSubtask(project.id, {
      title: newSubtask.title,
      description: newSubtask.description,
      status: 'todo',
      priority: newSubtask.priority,
      assignedToId: newSubtask.assignedToId || null,
      dependsOnId: newSubtask.dependsOnId || null,
      startDate: newSubtask.startDate,
      dueDate: newSubtask.dueDate,
    });
    setNewSubtaskOpen(false);
    setNewSubtask({ title: '', description: '', priority: 'medium', assignedToId: '', startDate: '', dueDate: '', dependsOnId: '' });
  };

  const handleAddMember = () => {
    if (memberForm.createNew) {
      if (!memberForm.name || !memberForm.email || !memberForm.password) return;
      // Create a new user account then add as member
      addEmployeeFromContext({
        name: memberForm.name, email: memberForm.email, password: memberForm.password,
        phone: '',
        role: memberForm.role === 'chef_de_projet' ? 'chef_de_projet' : 'membre',
        memberSpecialty: memberForm.role === 'chef_de_projet' ? undefined : memberForm.specialty as MemberSpecialty,
      });
      setAddMemberOpen(false);
      setMemberForm({ existingUserId: '', role: 'membre', createNew: false, name: '', email: '', password: '', specialty: 'Designer' });
    } else {
      if (!memberForm.existingUserId) return;
      addProjectMember(project.id, { userId: memberForm.existingUserId, role: memberForm.role });
      setAddMemberOpen(false);
      setMemberForm({ existingUserId: '', role: 'membre', createNew: false, name: '', email: '', password: '', specialty: 'Designer' });
    }
  };

  const handleReview = () => {
    if (!reviewDialog) return;
    reviewModification(project.id, reviewDialog.mod.id, reviewDialog.decision, reviewNote);
    setReviewDialog(null);
    setReviewNote('');
  };

  const handleSendComment = () => {
    if (!discussionSubtask || !commentText.trim()) return;
    addSubtaskComment(project.id, discussionSubtask.id, commentText);
    setCommentText('');
  };

  const handleAddMeeting = () => {
    if (!meetingForm.date) return;
    scheduleClientMeeting(project.id, {
      date: new Date(meetingForm.date).toISOString(),
      note: meetingForm.note.trim(),
    });
    setMeetingOpen(false);
    setMeetingForm({ date: '', note: '' });
  };

  const fileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const fieldLabels: Record<string, string> = {
    title: 'Titre', description: 'Description', dueDate: 'Date de fin', priority: 'Priorité',
    endDate: 'Date de fin', budget: 'Budget',
  };

  const projectFields = [
    { value: 'title', label: 'Titre' },
    { value: 'description', label: 'Description' },
    { value: 'endDate', label: 'Date de fin' },
    { value: 'priority', label: 'Priorité' },
    { value: 'budget', label: 'Budget' },
  ];

  const subtaskFields = [
    { value: 'title', label: 'Titre' },
    { value: 'description', label: 'Description' },
    { value: 'dueDate', label: 'Date de fin' },
    { value: 'priority', label: 'Priorité' },
  ];

  const handleSubmitModification = () => {
    if (!modReq.newValue || !modReq.reason) return;
    const target = modReq.target as 'project' | 'subtask';
    const subtaskId = target === 'subtask' ? modReq.subtaskId : null;
    let oldValue = '';
    if (target === 'project') {
      if (modReq.field === 'title') oldValue = project.title;
      else if (modReq.field === 'description') oldValue = project.description;
      else if (modReq.field === 'endDate') oldValue = project.endDate;
      else if (modReq.field === 'priority') oldValue = project.priority;
      else if (modReq.field === 'budget') oldValue = String(project.budget);
    } else {
      const st = project.subtasks.find((s) => s.id === modReq.subtaskId);
      if (st) {
        if (modReq.field === 'title') oldValue = st.title;
        else if (modReq.field === 'description') oldValue = st.description;
        else if (modReq.field === 'dueDate') oldValue = st.dueDate;
        else if (modReq.field === 'priority') oldValue = st.priority;
      }
    }
    suggestModification({
      projectId: project.id, subtaskId, target, field: modReq.field,
      oldValue, newValue: modReq.newValue, reason: modReq.reason,
    });
    setModReqOpen(false);
    setModReq({ target: 'project', subtaskId: '', field: 'description', newValue: '', reason: '' });
  };

  // Compute duration in weeks
  const durationDays = Math.max(0, daysBetween(project.startDate, project.endDate));
  const durationWeeks = Math.ceil(durationDays / 7);

  return (
    <AppShell>
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      {/* Header with logo */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {project.logoUrl ? (
              <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-border bg-muted/30 flex items-center justify-center flex-shrink-0">
                <img src={project.logoUrl} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="font-display font-bold text-xl">{project.title[0]}</span>
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">{project.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
                <span className="text-sm text-muted-foreground">{project.category}</span>
                {pendingMods.length > 0 && (
                  <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20">
                    <AlertCircle className="h-3 w-3 mr-1" />{pendingMods.length} modif. en attente
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 max-w-2xl">{project.description}</p>
        </div>

        <div className="flex flex-col gap-3 flex-shrink-0">
          <Card className="p-5 flex items-center gap-4">
            <ProgressRing value={project.progress} size={64} strokeWidth={5} />
            <div>
              <p className="text-sm text-muted-foreground">Avancement global</p>
              <p className="text-xs text-muted-foreground mt-1">
                {project.subtasks.length} sous-tâche{project.subtasks.length > 1 ? 's' : ''}
              </p>
            </div>
          </Card>
          {project.status !== 'pending' && project.status !== 'rejected' && (
            <Button variant="outline" onClick={() => setModReqOpen(true)}>
              <Edit3 className="h-4 w-4 mr-2" /> Demander une modification
            </Button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Euro} label="Budget" value={formatCurrency(project.budget)} color="text-info" />
        <StatCard icon={Clock} label="Durée" value={`${durationDays} j · ${durationWeeks} sem.`} color="text-warning" />
        <StatCard icon={ListTodo} label="Sous-tâches" value={project.subtasks.length} color="text-primary" />
        <StatCard icon={Users} label="Équipe" value={teamMembers.length} color="text-accent" />
      </div>

      {/* Admin actions */}
      <AnimatePresence>
        {user.role === 'admin' && project.status === 'pending' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6">
            <Card className="p-5 border-warning/30 bg-warning/5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-warning" /> Action requise — Validation du projet
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => validateProject(project.id)} className="bg-success hover:bg-success/90">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Valider le projet
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                  <XCircle className="h-4 w-4 mr-2" /> Rejeter
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {user.role === 'admin' && project.status === 'validated' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="p-5 border-primary/30 bg-primary/5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" /> Assigner un chef de projet
            </h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={selectedManager} onValueChange={setSelectedManager}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Choisir un chef de projet..." />
                </SelectTrigger>
                <SelectContent>
                  {chefs.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => selectedManager && assignManager(project.id, selectedManager)} disabled={!selectedManager}>
                Assigner
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {project.status === 'rejected' && project.rejectionReason && (
        <Card className="p-5 mb-6 border-destructive/30 bg-destructive/5">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" /> Motif du rejet
          </h3>
          <p className="text-sm text-muted-foreground">{project.rejectionReason}</p>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="info" className="gap-1.5"><Info className="h-4 w-4" /> Informations</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="h-4 w-4" /> Calendrier</TabsTrigger>
          <TabsTrigger value="gantt" className="gap-1.5"><GanttChartSquare className="h-4 w-4" /> Gantt</TabsTrigger>
          <TabsTrigger value="progress" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Avancement</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5"><ListTodo className="h-4 w-4" /> Tâches</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><UserCircle className="h-4 w-4" /> Équipe</TabsTrigger>
          <TabsTrigger value="modifications" className="gap-1.5">
            <Edit3 className="h-4 w-4" /> Modifications
            {pendingMods.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold rounded-full bg-warning text-warning-foreground">
                {pendingMods.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ---- Info tab ---- */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5 lg:col-span-2">
              <h3 className="font-semibold mb-4">Détails du projet</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Calendar} label="Date de début" value={formatDate(project.startDate)} />
                <InfoRow icon={Calendar} label="Date de fin" value={formatDate(project.endDate)} />
                <InfoRow icon={Clock} label="Durée" value={`${durationDays} jours (${durationWeeks} semaine${durationWeeks > 1 ? 's' : ''})`} />
                <InfoRow icon={Euro} label="Budget" value={formatCurrency(project.budget)} />
                <InfoRow icon={FolderKanban} label="Semaines de réalisation" value={`${durationWeeks} semaine${durationWeeks > 1 ? 's' : ''}`} />
                <InfoRow icon={CalendarClock} label="Mise à jour" value={formatDate(project.createdAt)} />
              </div>

              {/* Submission detail fields */}
              {(project.platformUsers || project.desiredFeatures || project.necessaryPages || project.plannedFeatures) && (
                <div className="mt-5 pt-5 border-t border-border space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> Détails de la soumission
                  </h4>
                  {project.platformUsers && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Utilisateurs de la plateforme</p>
                      <p className="text-sm">{project.platformUsers}</p>
                    </div>
                  )}
                  {project.desiredFeatures && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Fonctionnalités souhaitées</p>
                      <p className="text-sm">{project.desiredFeatures}</p>
                    </div>
                  )}
                  {project.necessaryPages && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Pages nécessaires pour le projet</p>
                      <p className="text-sm">{project.necessaryPages}</p>
                    </div>
                  )}
                  {project.plannedFeatures && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Fonctionnalités prévues</p>
                      <p className="text-sm">{project.plannedFeatures}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {project.attachments.length > 0 && (
                <div className="mt-5 pt-5 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4" /> Pièces jointes ({project.attachments.length})
                    {!canViewAttachments && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Lock className="h-3 w-3" /> Accès restreint
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {project.attachments.map((att) => (
                      <div
                        key={att.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 transition-all ${
                          canViewAttachments
                            ? 'hover:bg-primary/5 hover:border-primary/30 border border-transparent cursor-pointer'
                            : 'opacity-60 border border-transparent'
                        }`}
                        onClick={() => canViewAttachments && setFileViewer({ url: att.url, fileName: att.fileName, fileType: att.fileType })}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          {fileIcon(att.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{att.fileName}</p>
                          {canViewAttachments && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Eye className="h-2.5 w-2.5" /> Cliquer pour ouvrir
                            </p>
                          )}
                        </div>
                        {canViewAttachments && <Download className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                        {!canViewAttachments && <Lock className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {client && (
                <div className="mt-5 pt-5 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Client</h4>
                  <button onClick={() => setProfileUser(client)} className="flex items-center gap-3 mb-3 w-full text-left p-1 -m-1 rounded-2xl hover:bg-muted/40 transition-colors group">
                    <UserAvatar user={client} size="md" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                    </div>
                  </button>
                  <div className="space-y-2">
                    {client.company && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{client.company}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Calendrier du projet
              </h3>
              <div className="space-y-2 mb-4">
                {project.calendarEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun événement planifié pour l’instant.</p>
                ) : (
                  project.calendarEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                      <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(ev.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Client meeting after framing */}
              {project.clientMeeting ? (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                  <p className="text-sm font-medium flex items-center gap-1.5 text-success">
                    <CheckCircle2 className="h-4 w-4" /> Rendez-vous client planifié
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(project.clientMeeting.date)}</p>
                  {project.clientMeeting.note && (
                    <p className="text-xs text-muted-foreground mt-1">« {project.clientMeeting.note} »</p>
                  )}
                </div>
              ) : canManage && project.subtasks.length > 0 ? (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setMeetingOpen(true)}>
                  <CalendarDays className="h-4 w-4 mr-2" /> Planifier un rendez-vous client (rapport)
                </Button>
              ) : null}
            </Card>
          </div>
        </TabsContent>

        {/* ---- Calendar tab ---- */}
        <TabsContent value="calendar">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Calendrier synchronisé avec le cadrage des tâches
              </h3>
              {canManage && (
                <Button variant="outline" size="sm" onClick={() => setMeetingOpen(true)}>
                  <CalendarDays className="h-4 w-4 mr-2" /> Planifier un rendez-vous client
                </Button>
              )}
            </div>

            {project.calendarEvents.length === 0 && project.subtasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Aucun événement de cadrage planifié. Le calendrier se remplira une fois le cadrage des tâches effectué.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timeline of events + tasks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Événements du projet</h4>
                    <div className="space-y-2">
                      {project.calendarEvents.map((ev) => (
                        <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                            ev.type === 'rendez_vous' ? 'bg-primary/10 text-primary' : ev.type === 'cadrage' ? 'bg-info/10 text-info' : ev.type === 'livraison' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
                            <CalendarDays className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{ev.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(ev.date)}</p>
                            {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Sous-tâches (cadrage)</h4>
                    <div className="space-y-2">
                      {project.subtasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune sous-tâche définie.</p>
                      ) : project.subtasks.map((st) => (
                        <div key={st.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <ListTodo className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{st.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(st.startDate)} → {formatDate(st.dueDate)}</p>
                          </div>
                          <SubtaskStatusBadge status={st.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ---- Gantt tab ---- */}
        <TabsContent value="gantt">
          <div>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Diagramme de Gantt</h3>
                {canManage && project.subtasks.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setNewSubtaskOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Ajouter une sous-tâche
                  </Button>
                )}
              </div>
              <Suspense fallback={<div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Chargement du diagramme...</div>}>
                <GanttChart subtasks={project.subtasks} />
              </Suspense>
            </Card>
          </div>
        </TabsContent>

        {/* ---- Progress tab ---- */}
        <TabsContent value="progress">
          <div>
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Courbe d’avancement</h3>
              <Suspense fallback={<div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Chargement du graphique...</div>}>
                <ProgressChart data={project.progressTimeline} />
              </Suspense>
            </Card>
          </div>
        </TabsContent>

        {/* ---- Tasks tab (with comments) ---- */}
        <TabsContent value="tasks">
          <div>
            {canManage && project.status !== 'pending' && project.status !== 'rejected' && (
              <div className="mb-4 flex justify-end">
                <Button onClick={() => setNewSubtaskOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter une sous-tâche
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {project.subtasks.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Aucune sous-tâche définie. Le chef de projet ou l’admin doit cadrer les tâches.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {project.subtasks.map((st) => {
                    const assignee = getUser(users, st.assignedToId);
                    return (
                      <Card key={st.id} className="p-4 hover:shadow-card-hover hover:border-primary/20 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{st.title}</p>
                              <SubtaskStatusBadge status={st.status} />
                              <PriorityBadge priority={st.priority} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{st.description}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(st.startDate)} → {formatDate(st.dueDate)}</span>
                              <span className="flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" /> {assignee?.name ?? 'Non assigné'}</span>
                              <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {st.comments.length} commentaire{st.comments.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="mt-3 w-48">
                              <ProgressBar value={st.progress} indicatorClassName={st.progress < 33 ? 'bg-destructive' : st.progress < 66 ? 'bg-warning' : 'bg-success'} />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => { setDiscussionSubtask(st); setActiveTab('tasks'); }}>
                              <MessageSquare className="h-3.5 w-3.5" /> Discussion
                            </Button>
                            {canManage && st.status === 'review' && (
                              <Button size="sm" className="h-8 text-xs gap-1 bg-success hover:bg-success/90" onClick={() => approveSubtask(project.id, st.id)}>
                                <Check className="h-3.5 w-3.5" /> Valider
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Inline comments preview */}
                        {st.comments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                            {st.comments.slice(0, 2).map((c) => {
                              const author = getUser(users, c.authorId);
                              return (
                                <div key={c.id} className="flex items-start gap-2">
                                  <UserAvatar user={author} size="sm" />
                                  <div className="flex-1">
                                    <p className="text-xs"><span className="font-semibold">{author?.name}</span> <span className="text-muted-foreground">· {formatDate(c.createdAt)}</span></p>
                                    <p className="text-sm mt-0.5">{c.content}</p>
                                  </div>
                                </div>
                              );
                            })}
                            {st.comments.length > 2 && (
                              <button className="text-xs text-primary hover:underline" onClick={() => setDiscussionSubtask(st)}>
                                Voir les {st.comments.length} commentaires
                              </button>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ---- Team tab ---- */}
        <TabsContent value="team">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <h3 className="font-display text-lg font-bold tracking-tight">Équipe du projet</h3>
                <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {teamMembers.length}
                </span>
              </div>
              {canManage && project.status !== 'pending' && project.status !== 'rejected' && (
                <Button onClick={() => setAddMemberOpen(true)} className="rounded-full gap-1.5">
                  <UserPlus className="h-4 w-4" /> Ajouter un membre
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {teamMembers.map((m) => {
                  const memberTasks = project.subtasks.filter((st) => st.assignedToId === m.userId);
                  const total = memberTasks.length;
                  const doneCount = memberTasks.filter((t) => t.status === 'done').length;
                  const activeCount = memberTasks.filter((t) => t.status === 'in_progress' || t.status === 'review').length;
                  const ratio = total ? doneCount / total : 0;
                  const filled = total ? Math.max(1, Math.round(ratio * 5)) : 0;
                  const dotColor = ratio >= 0.75 ? 'bg-success' : ratio >= 0.4 ? 'bg-warning' : 'bg-destructive';
                  const removable = canManage && m.role !== 'client' && m.role !== 'admin' && m.userId !== user.id;
                  return (
                    <motion.div key={m.userId} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <Card
                        className="group relative cursor-pointer overflow-hidden rounded-[24px] border-border/60 bg-card p-6 shadow-card hover:-translate-y-1 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300"
                        onClick={() => m.user && setProfileUser(m.user)}
                      >
                        <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                        <div className="flex items-start gap-4">
                          <UserAvatar user={m.user} className="h-14 w-14 rounded-[18px] shadow-soft-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="font-display font-semibold text-[15px] leading-tight truncate group-hover:text-primary transition-colors">{m.user?.name}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <RoleBadge role={m.role} />
                              {m.user?.memberSpecialty && (
                                <span className="inline-flex items-center rounded-full bg-muted/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                  {specialtyMeta[m.user.memberSpecialty]?.label ?? m.user.memberSpecialty}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="relative flex flex-col items-end gap-2 flex-shrink-0">
                            <span className="flex items-center justify-center h-9 w-9 rounded-full border border-border/70 bg-white/60 text-muted-foreground group-hover:text-primary group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </span>
                            {removable && (
                              <button
                                onClick={(e) => { e.stopPropagation(); removeProjectMember(project.id, m.userId); }}
                                className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Contacts</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {m.user?.email && (
                              <a href={`mailto:${m.user.email}`} className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 max-w-[180px] transition-colors">
                                <Mail className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{m.user.email}</span>
                              </a>
                            )}
                            {m.user?.phone && (
                              <a href={`tel:${m.user.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                                <Phone className="h-3 w-3" /> {m.user.phone}
                              </a>
                            )}
                          </div>
                        </div>

                        {m.user?.company && (
                          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{m.user.company}</span>
                          </p>
                        )}

                        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Tâches {total > 0 ? `· ${total}` : ''}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <span
                                  key={i}
                                  className={cn('h-2 w-2 rounded-full transition-colors', i < filled ? (total > 0 ? dotColor : 'bg-border') : 'bg-border')}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                              {total ? `${doneCount}/${total} terminée${doneCount > 1 ? 's' : ''}${activeCount > 0 ? ` · ${activeCount} en cours` : ''}` : 'Aucune tâche'}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {teamMembers.length === 0 && (
              <Card className="p-10 text-center text-muted-foreground rounded-[24px]">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Aucun membre dans l’équipe pour le moment.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ---- Modifications tab ---- */}
        <TabsContent value="modifications">
          <div>
            {project.modifications.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Edit3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Aucune demande de modification pour ce projet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {project.modifications.map((mod) => {
                  const requester = getUser(users, mod.requestedById);
                  const reviewer = mod.reviewedById ? getUser(users, mod.reviewedById) : null;
                  const subtask = mod.subtaskId ? project.subtasks.find((st) => st.id === mod.subtaskId) : null;
                  return (
                    <motion.div key={mod.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className={`p-5 ${mod.status === 'pending' ? 'border-warning/30' : mod.status === 'approved' ? 'border-success/30' : 'border-destructive/30'}`}>
                        <div className="flex items-start gap-4">
                          {requester && <UserAvatar user={requester} size="md" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-medium text-sm">{mod.requestedByName}</span>
                              <span className="text-xs text-muted-foreground">demande une modification sur</span>
                              {subtask ? (
                                <Badge variant="outline" className="text-xs">{subtask.title}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">le projet</Badge>
                              )}
                              <ModificationStatusBadge status={mod.status} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                              <div className="p-3 rounded-lg bg-muted/30">
                                <p className="text-xs text-muted-foreground mb-1">Valeur actuelle — {fieldLabels[mod.field] ?? mod.field}</p>
                                <p className="text-sm line-clamp-2">{mod.oldValue || '(vide)'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                                <p className="text-xs text-muted-foreground mb-1">Nouvelle valeur proposée</p>
                                <p className="text-sm line-clamp-2 font-medium">{mod.newValue}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-muted-foreground">{mod.reason}</p>
                            </div>
                            {mod.status !== 'pending' && reviewer && (
                              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {mod.status === 'approved' ? 'Approuvée' : 'Rejetée'} par {reviewer.name}
                                {mod.reviewNote && <span className="italic">— « {mod.reviewNote} »</span>}
                              </div>
                            )}
                            {mod.status === 'pending' && user.role === 'admin' && (
                              <div className="mt-4 flex gap-2 pt-3 border-t border-border/50">
                                <Button size="sm" className="bg-success hover:bg-success/90 h-8 gap-1.5" onClick={() => { setReviewDialog({ mod, decision: 'approved' }); setReviewNote(''); }}>
                                  <Check className="h-3.5 w-3.5" /> Approuver
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 gap-1.5" onClick={() => { setReviewDialog({ mod, decision: 'rejected' }); setReviewNote(''); }}>
                                  <XCircle className="h-3.5 w-3.5" /> Rejeter
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le projet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label htmlFor="reason">Motif du rejet</Label>
            <Textarea id="reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Expliquez la raison du rejet..." rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>Rejeter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New subtask dialog */}
      <Dialog open={newSubtaskOpen} onOpenChange={setNewSubtaskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle sous-tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
            <div>
              <Label htmlFor="st-title">Titre</Label>
              <Input id="st-title" value={newSubtask.title} onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })} placeholder="Titre de la sous-tâche" />
            </div>
            <div>
              <Label htmlFor="st-desc">Description</Label>
              <Textarea id="st-desc" value={newSubtask.description} onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })} placeholder="Description..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priorité</Label>
                <Select value={newSubtask.priority} onValueChange={(v) => setNewSubtask({ ...newSubtask, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigner à</Label>
                <Select value={newSubtask.assignedToId} onValueChange={(v) => setNewSubtask({ ...newSubtask, assignedToId: v })}>
                  <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                  <SelectContent>
                    {members.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name} — {emp.memberSpecialty ? (specialtyMeta[emp.memberSpecialty]?.label ?? emp.memberSpecialty) : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date de début</Label>
                <Input type="date" value={newSubtask.startDate ? new Date(newSubtask.startDate).toISOString().split('T')[0] : ''} onChange={(e) => setNewSubtask({ ...newSubtask, startDate: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
              </div>
              <div>
                <Label>Date de fin</Label>
                <Input type="date" value={newSubtask.dueDate ? new Date(newSubtask.dueDate).toISOString().split('T')[0] : ''} onChange={(e) => setNewSubtask({ ...newSubtask, dueDate: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
              </div>
            </div>
            {project.subtasks.length > 0 && (
              <div>
                <Label>Dépend de</Label>
                <Select value={newSubtask.dependsOnId} onValueChange={(v) => setNewSubtask({ ...newSubtask, dependsOnId: v })}>
                  <SelectTrigger><SelectValue placeholder="Aucune dépendance" /></SelectTrigger>
                  <SelectContent>
                    {project.subtasks.map((st) => (
                      <SelectItem key={st.id} value={st.id}>{st.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSubtaskOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateSubtask} disabled={!newSubtask.title || !newSubtask.startDate || !newSubtask.dueDate}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Ajouter un membre au projet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMemberForm({ ...memberForm, createNew: false })} className={cn('p-3 rounded-lg border text-sm font-medium transition-all', !memberForm.createNew ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground')}>
                Sélectionner un membre existant
              </button>
              <button type="button" onClick={() => setMemberForm({ ...memberForm, createNew: true })} className={cn('p-3 rounded-lg border text-sm font-medium transition-all', memberForm.createNew ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground')}>
                Créer un nouveau compte
              </button>
            </div>

            {memberForm.createNew ? (
              <div className="space-y-3">
                <div>
                  <Label>Nom complet *</Label>
                  <Input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="Ex: Marie Dupont" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="marie@entreprise.com" />
                </div>
                <div>
                  <Label>Mot de passe *</Label>
                  <Input type="text" value={memberForm.password} onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} placeholder="Mot de passe du compte" />
                </div>
                <div>
                  <Label>Rôle dans le projet</Label>
                  <Select value={memberForm.role} onValueChange={(v) => setMemberForm({ ...memberForm, role: v as Role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="membre">Membre du projet</SelectItem>
                      <SelectItem value="chef_de_projet">Chef de projet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {memberForm.role === 'membre' && (
                  <div>
                    <Label>Spécialité</Label>
                    <Select value={memberForm.specialty} onValueChange={(v) => setMemberForm({ ...memberForm, specialty: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Designer', 'DevOps', 'Frontend', 'Backend', 'Fullstack', 'QA', 'Chef de projet junior', 'Autre'].map((s) => (
                          <SelectItem key={s} value={s}>{specialtyMeta[s]?.label ?? s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {availableEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tous les membres sont déjà dans ce projet.</p>
                ) : (
                  <>
                    <div>
                      <Label>Choisir un membre existant</Label>
                      <Select value={memberForm.existingUserId} onValueChange={(v) => setMemberForm({ ...memberForm, existingUserId: v })}>
                        <SelectTrigger><SelectValue placeholder="Choisir un membre..." /></SelectTrigger>
                        <SelectContent>
                          {availableEmployees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name} — {emp.memberSpecialty ? (specialtyMeta[emp.memberSpecialty]?.label ?? emp.memberSpecialty) : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Rôle dans le projet</Label>
                      <Select value={memberForm.role} onValueChange={(v) => setMemberForm({ ...memberForm, role: v as Role })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="membre">Membre du projet</SelectItem>
                          <SelectItem value="chef_de_projet">Chef de projet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Annuler</Button>
            <Button onClick={handleAddMember} disabled={memberForm.createNew ? (!memberForm.name || !memberForm.email || !memberForm.password) : !memberForm.existingUserId}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review modification dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => { if (!open) setReviewDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewDialog?.decision === 'approved' ? (
                <><CheckCircle2 className="h-5 w-5 text-success" /> Approuver la modification</>
              ) : (
                <><XCircle className="h-5 w-5 text-destructive" /> Rejeter la modification</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">Champ: <span className="font-medium text-foreground">{fieldLabels[reviewDialog?.mod.field ?? ''] ?? reviewDialog?.mod.field}</span></p>
              <p className="text-xs text-muted-foreground">Demandé par: <span className="font-medium text-foreground">{reviewDialog?.mod.requestedByName}</span></p>
            </div>
            <div>
              <Label htmlFor="review-note">Note (facultatif)</Label>
              <Textarea id="review-note" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Ajouter un commentaire sur votre décision..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>Annuler</Button>
            <Button onClick={handleReview} className={reviewDialog?.decision === 'approved' ? 'bg-success hover:bg-success/90' : ''} variant={reviewDialog?.decision === 'rejected' ? 'destructive' : 'default'}>
              {reviewDialog?.decision === 'approved' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modification request dialog */}
      <Dialog open={modReqOpen} onOpenChange={setModReqOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" /> Demander une modification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
            {user.role !== 'admin' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
                <p>Votre demande sera examinée par un administrateur. Vous recevrez une notification dès qu’elle sera traitée.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setModReq({ ...modReq, target: 'project', subtaskId: '' })} className={cn('p-3 rounded-lg border text-sm font-medium transition-all text-left', modReq.target === 'project' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-border/80 text-muted-foreground')}>
                <FolderKanban className="h-4 w-4 mb-1.5" />
                Le projet
              </button>
              <button type="button" onClick={() => setModReq({ ...modReq, target: 'subtask' })} disabled={project.subtasks.length === 0} className={cn('p-3 rounded-lg border text-sm font-medium transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed', modReq.target === 'subtask' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-border/80 text-muted-foreground')}>
                <ListTodo className="h-4 w-4 mb-1.5" />
                Une sous-tâche
              </button>
            </div>
            {modReq.target === 'subtask' && (
              <div>
                <Label>Sous-tâche à modifier</Label>
                <Select value={modReq.subtaskId} onValueChange={(v) => setModReq({ ...modReq, subtaskId: v, field: 'title' })}>
                  <SelectTrigger><SelectValue placeholder="Choisir une sous-tâche..." /></SelectTrigger>
                  <SelectContent>
                    {project.subtasks.map((st) => (
                      <SelectItem key={st.id} value={st.id}>{st.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Champ à modifier</Label>
              <Select value={modReq.field} onValueChange={(v) => setModReq({ ...modReq, field: v, newValue: '' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(modReq.target === 'project' ? projectFields : subtaskFields).map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nouvelle valeur</Label>
              {(modReq.field === 'priority') ? (
                <Select value={modReq.newValue} onValueChange={(v) => setModReq({ ...modReq, newValue: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              ) : (modReq.field === 'endDate' || modReq.field === 'dueDate') ? (
                <Input type="date" value={modReq.newValue} onChange={(e) => setModReq({ ...modReq, newValue: e.target.value })} />
              ) : modReq.field === 'budget' ? (
                <Input type="number" value={modReq.newValue} onChange={(e) => setModReq({ ...modReq, newValue: e.target.value })} placeholder="Ex: 50000" />
              ) : modReq.field === 'description' ? (
                <Textarea value={modReq.newValue} onChange={(e) => setModReq({ ...modReq, newValue: e.target.value })} placeholder="Nouvelle description..." rows={3} />
              ) : (
                <Input value={modReq.newValue} onChange={(e) => setModReq({ ...modReq, newValue: e.target.value })} placeholder="Nouvelle valeur..." />
              )}
            </div>
            <div>
              <Label>Raison de la modification *</Label>
              <Textarea value={modReq.reason} onChange={(e) => setModReq({ ...modReq, reason: e.target.value })} placeholder="Expliquez pourquoi cette modification est nécessaire..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModReqOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitModification} disabled={!modReq.newValue || !modReq.reason || (modReq.target === 'subtask' && !modReq.subtaskId)}>
              <Send className="h-4 w-4 mr-2" /> Soumettre la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task discussion dialog */}
      <Dialog open={!!discussionSubtask} onOpenChange={(open) => { if (!open) { setDiscussionSubtask(null); setCommentText(''); } }}>
        <DialogContent className="max-w-xl h-[70vh] flex flex-col">
          {discussionSubtask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Discussion — {discussionSubtask.title}
                </DialogTitle>
              </DialogHeader>
              {/* Task info */}
              <div className="px-2 py-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span><span className="font-medium text-foreground">Assigné :</span> {getUser(users, discussionSubtask.assignedToId)?.name ?? 'Non assigné'}</span>
                  <span><span className="font-medium text-foreground">Statut :</span> <SubtaskStatusBadge status={discussionSubtask.status} /></span>
                  <span><span className="font-medium text-foreground">Dates :</span> {formatDate(discussionSubtask.startDate)} → {formatDate(discussionSubtask.dueDate)}</span>
                  <span><span className="font-medium text-foreground">Progression :</span> {discussionSubtask.progress}%</span>
                </div>
              </div>
              {/* Comments */}
              <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 my-4 px-1">
                {discussionSubtask.comments.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Aucun commentaire pour l’instant. Lancez la discussion !</p>
                ) : discussionSubtask.comments.map((c) => {
                  const author = getUser(users, c.authorId);
                  const isMine = c.authorId === user.id;
                  return (
                    <div key={c.id} className={cn('flex items-start gap-2', isMine && 'flex-row-reverse')}>
                      <UserAvatar user={author} size="sm" />
                      <div className={cn('max-w-[80%] p-3 rounded-xl', isMine ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border/50')}>
                        <p className={cn('text-xs font-semibold', isMine ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                          {author?.name} · {formatDate(c.createdAt)}
                        </p>
                        <p className="text-sm mt-1">{c.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Input */}
              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Écrivez un commentaire..." rows={2} className="resize-none" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }} />
                <Button onClick={handleSendComment} disabled={!commentText.trim()} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Client meeting dialog */}
      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Planifier un rendez-vous client (rapport)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-xs text-muted-foreground">
              Une fois le cadrage des tâches terminé, planifiez un rendez-vous avec le client pour présenter le rapport et valider le périmètre.
            </p>
            <div>
              <Label>Date et heure du rendez-vous</Label>
              <Input type="datetime-local" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} />
            </div>
            <div>
              <Label>Note (facultatif)</Label>
              <Textarea value={meetingForm.note} onChange={(e) => setMeetingForm({ ...meetingForm, note: e.target.value })} rows={3} placeholder="Ex: Présentation du rapport de cadrage et validation du périmètre" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingOpen(false)}>Annuler</Button>
            <Button onClick={handleAddMeeting} disabled={!meetingForm.date}>Planifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File viewer dialog */}
      <Dialog open={!!fileViewer} onOpenChange={(open) => !open && setFileViewer(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-primary" /> {fileViewer?.fileName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {fileViewer?.fileType.startsWith('image/') ? (
              <div className="flex items-center justify-center rounded-xl bg-muted/30 p-4 max-h-[60vh] overflow-hidden">
                <img src={fileViewer.url} alt={fileViewer.fileName} className="max-h-[55vh] max-w-full rounded-lg object-contain" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 p-8 gap-3">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium">{fileViewer?.fileName}</p>
                <p className="text-xs text-muted-foreground">Ce type de fichier ne peut pas être prévisualisé.</p>
                <Button size="sm" className="mt-2" onClick={() => fileViewer && window.open(fileViewer.url, '_blank')}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Télécharger le fichier
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Member profile dialog */}
      <MemberProfileDialog
        user={profileUser}
        open={!!profileUser}
        onOpenChange={(o) => { if (!o) setProfileUser(null); }}
        canEdit={user.role === 'admin'}
      />
    </AppShell>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-muted/50 text-muted-foreground flex-shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ModificationStatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const config = {
    pending: { label: 'En attente', className: 'bg-warning/15 text-warning border-warning/30' },
    approved: { label: 'Approuvée', className: 'bg-success/15 text-success border-success/30' },
    rejected: { label: 'Rejetée', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  };
  const c = config[status];
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}
