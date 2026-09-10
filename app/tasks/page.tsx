'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import {
  CheckSquare, Calendar, Paperclip, Edit3,
  AlertCircle, MessageSquare, Play, Pause, Timer,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SubtaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { ProgressBar } from '@/components/shared/progress';
import { FilterBar } from '@/components/shared/filter-bar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { subtaskStatusMeta, formatDate, daysUntil } from '@/lib/status';
import type { SubtaskStatus, WorkSession } from '@/types';

function formatWorkTime(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export default function TasksPage() {
  const user = useAuthGuard();
  const { projects, updateSubtaskStatus, suggestModification, toggleTaskActive } = useApp();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modDialogOpen, setModDialogOpen] = useState(false);
  const [modTarget, setModTarget] = useState<{ projectId: string; subtaskId: string; title: string; field: string; oldValue: string } | null>(null);
  const [modForm, setModForm] = useState({ field: 'description', newValue: '', reason: '' });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const taskWorkSeconds = (task: { isActive?: boolean; workSessions?: WorkSession[] }): number => {
    const sessions = task.workSessions ?? [];
    const closed = sessions
      .filter((s) => s.end !== null)
      .reduce((acc, s) => acc + (s.duration || 0), 0);
    const running = task.isActive ? sessions.find((s) => s.end === null) : undefined;
    const runningSecs = running ? (Math.max(Date.now(), now) - new Date(running.start).getTime()) / 1000 : 0;
    return closed + runningSecs;
  };

  const myTasks = useMemo(() => {
    if (!user) return [];
    let tasks = projects.flatMap((p) =>
      p.subtasks
        .filter((st) => st.assignedToId === user.id)
        .map((st) => ({ ...st, projectTitle: p.title, projectId: p.id }))
    );
    if (statusFilter !== 'all') tasks = tasks.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'all') tasks = tasks.filter((t) => t.priority === priorityFilter);
    if (search) tasks = tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    return tasks;
  }, [user, projects, statusFilter, priorityFilter, search]);

  if (!user) return null;

  const canValidate = user.role === 'admin' || user.role === 'chef_de_projet';

  const availableStatuses = (status: SubtaskStatus): SubtaskStatus[] => {
    let options: SubtaskStatus[];
    if (status === 'review') options = ['todo', 'in_progress', 'review'];
    else if (status === 'done') options = ['done'];
    else options = ['todo', 'in_progress', 'review'];
    if (!canValidate) options = options.filter((s) => s !== 'done');
    return options;
  };

  const openModDialog = (task: { projectId: string; id: string; title: string; description: string; dueDate: string; priority: string }) => {
    setModTarget({ projectId: task.projectId, subtaskId: task.id, title: task.title, field: modForm.field, oldValue: '' });
    setModForm({
      field: 'description',
      newValue: task.description,
      reason: '',
    });
    setModDialogOpen(true);
  };

  const handleModFieldChange = (field: string) => {
    if (!modTarget) return;
    const task = projects.flatMap(p => p.subtasks).find(st => st.id === modTarget.subtaskId);
    if (!task) return;
    const oldVal = field === 'title' ? task.title : field === 'description' ? task.description : field === 'dueDate' ? task.dueDate.split('T')[0] : task.priority;
    setModForm({ ...modForm, field, newValue: field === 'dueDate' ? task.dueDate.split('T')[0] : oldVal });
  };

  const handleSubmitModification = () => {
    if (!modTarget || !modForm.newValue || !modForm.reason) return;
    suggestModification({
      projectId: modTarget.projectId,
      subtaskId: modTarget.subtaskId,
      target: 'subtask',
      field: modForm.field,
      oldValue: modForm.field === 'dueDate'
        ? (projects.flatMap(p => p.subtasks).find(st => st.id === modTarget.subtaskId)?.dueDate ?? '')
        : (projects.flatMap(p => p.subtasks).find(st => st.id === modTarget.subtaskId)?.[modForm.field as 'title' | 'description' | 'priority'] as string ?? ''),
      newValue: modForm.newValue,
      reason: modForm.reason,
    });
    setModDialogOpen(false);
    setModForm({ field: 'description', newValue: '', reason: '' });
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-2xl font-bold tracking-tight mb-2">Mes tâches assignées</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Consultez vos tâches et suivez leur progression. Vous pouvez suggérer des modifications qui seront examinées par un chef de projet ou l’admin.
        </p>
      </motion.div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une tâche..."
        filters={[
          {
            key: 'status', value: statusFilter, onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'Tous les statuts' },
              ...Object.entries(subtaskStatusMeta).map(([v, m]) => ({ value: v, label: m.label })),
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

      {myTasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucune tâche assignée pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <AnimatePresence mode="popLayout">
            {myTasks.map((task, i) => {
              const daysLeft = daysUntil(task.dueDate);
              const isLate = daysLeft < 0 && task.status !== 'done';
              const isDone = task.status === 'done';
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                >
                  <Card className={`p-5 hover:shadow-lg transition-all`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <button onClick={() => router.push(`/projects/${task.projectId}`)} className="font-semibold text-sm hover:text-primary transition-colors text-left">
                          {task.title}
                        </button>
                        <p className="text-xs text-muted-foreground mt-0.5">{task.projectTitle}</p>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>

                    <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(task.dueDate)}</span>
                      <span className={isLate ? 'text-destructive font-medium' : ''}>
                        {isDone ? 'Terminé' : isLate ? `En retard de ${Math.abs(daysLeft)} j` : daysLeft > 0 ? `${daysLeft} j restants` : "Aujourd'hui"}
                      </span>
                      {task.attachments.length > 0 && (
                        <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{task.attachments.length}</span>
                      )}
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{task.comments.length}</span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">Progression</span>
                        <span className="text-xs font-bold">{task.progress}%</span>
                      </div>
                      <ProgressBar value={task.progress} indicatorClassName={task.progress < 33 ? 'bg-destructive' : task.progress < 66 ? 'bg-warning' : 'bg-success'} />
                      <div className={`mt-2 flex items-center gap-1.5 text-xs text-muted-foreground ${task.isActive ? 'text-primary' : ''}`}>
                        <Timer className={`h-3.5 w-3.5 ${task.isActive ? 'animate-pulse' : ''}`} />
                        <span>Temps de travail : <span className="font-medium">{formatWorkTime(taskWorkSeconds(task))}</span></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
                      <SubtaskStatusBadge status={task.status} />

                      {/* Pause / resume working session */}
                      {!isDone && (
                        <Button
                          size="sm"
                          variant={task.isActive ? 'destructive' : 'default'}
                          className="h-8 text-xs gap-1.5"
                          onClick={() => toggleTaskActive(task.projectId, task.id)}
                        >
                          {task.isActive ? (<><Pause className="h-3.5 w-3.5" /> Pause</>) : (<><Play className="h-3.5 w-3.5" /> Reprendre</>)}
                        </Button>
                      )}

                      {/* Discussion button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-primary"
                        onClick={() => router.push(`/projects/${task.projectId}?tab=tasks`)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Discussion ({task.comments.length})
                      </Button>

                      {/* Suggest modification button */}
                      {!isDone && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-primary"
                          onClick={() => openModDialog(task)}
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Suggérer modif.
                        </Button>
                      )}

                      <div className="ml-auto">
                        <Select value={task.status} onValueChange={(v) => { updateSubtaskStatus(task.projectId, task.id, v as SubtaskStatus); toast({ title: 'Statut mis à jour', description: `« ${task.title} » est maintenant « ${subtaskStatusMeta[v as SubtaskStatus].label} ».` }); }}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStatuses(task.status).map((s) => (
                              <SelectItem key={s} value={s} disabled={s === 'review' && task.status === 'review'}>{subtaskStatusMeta[s].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modification suggestion dialog */}
      <Dialog open={modDialogOpen} onOpenChange={setModDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Suggérer une modification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Votre suggestion sera examinée par un administrateur avant d’être appliquée. Le champ sera modifié uniquement après approbation.
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tâche concernée</Label>
              <p className="text-sm font-medium mt-1">{modTarget?.title}</p>
            </div>
            <div>
              <Label>Champ à modifier</Label>
              <Select value={modForm.field} onValueChange={handleModFieldChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Titre</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="dueDate">Date de fin</SelectItem>
                  <SelectItem value="priority">Priorité</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-value">Nouvelle valeur</Label>
              {modForm.field === 'description' ? (
                <Textarea id="new-value" value={modForm.newValue} onChange={(e) => setModForm({ ...modForm, newValue: e.target.value })} rows={4} />
              ) : modForm.field === 'dueDate' ? (
                <Input id="new-value" type="date" value={modForm.newValue} onChange={(e) => setModForm({ ...modForm, newValue: e.target.value })} />
              ) : modForm.field === 'priority' ? (
                <Select value={modForm.newValue} onValueChange={(v) => setModForm({ ...modForm, newValue: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input id="new-value" value={modForm.newValue} onChange={(e) => setModForm({ ...modForm, newValue: e.target.value })} />
              )}
            </div>
            <div>
              <Label htmlFor="reason">Justification *</Label>
              <Textarea id="reason" value={modForm.reason} onChange={(e) => setModForm({ ...modForm, reason: e.target.value })} placeholder="Expliquez pourquoi cette modification est nécessaire..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitModification} disabled={!modForm.newValue || !modForm.reason}>
              Soumettre la suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
