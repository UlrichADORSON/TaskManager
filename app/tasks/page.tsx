'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CheckSquare, Calendar, Paperclip, Play, Pause, Edit3,
  Clock, AlertCircle,
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
import type { SubtaskStatus } from '@/types';

export default function TasksPage() {
  const user = useAuthGuard();
  const { projects, updateSubtaskStatus, toggleTaskActive, suggestModification } = useApp();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modDialogOpen, setModDialogOpen] = useState(false);
  const [modTarget, setModTarget] = useState<{ projectId: string; subtaskId: string; title: string; field: string; oldValue: string } | null>(null);
  const [modForm, setModForm] = useState({ field: 'description', newValue: '', reason: '' });

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

  const statusOptions: SubtaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

  const availableStatuses = (status: SubtaskStatus): SubtaskStatus[] => {
    if (status === 'review') return ['todo', 'in_progress', 'review'];
    if (status === 'done') return ['done'];
    return statusOptions;
  };

  const openModDialog = (task: { projectId: string; id: string; title: string; description: string; dueDate: string; priority: string }) => {
    const fieldLabels: Record<string, string> = {
      title: 'Titre', description: 'Description', dueDate: 'Date de fin', priority: 'Priorité',
    };
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
          Utilisez le bouton <Play className="inline h-3 w-3" /> pour démarrer une tâche et <Pause className="inline h-3 w-3" /> pour la mettre en pause. L'admin doit valider toute modification suggérée.
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
                  <Card className={`p-5 hover:shadow-lg transition-all relative overflow-hidden ${task.isActive ? 'ring-2 ring-success/40 border-success/30' : ''}`}>
                    {task.isActive && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-bl-lg flex items-center gap-1">
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <span className="inline-block h-2 w-2 rounded-full bg-success" />
                        </motion.span>
                        En cours
                      </div>
                    )}
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
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">Progression</span>
                        <span className="text-xs font-bold">{task.progress}%</span>
                      </div>
                      <ProgressBar value={task.progress} indicatorClassName={task.progress < 33 ? 'bg-destructive' : task.progress < 66 ? 'bg-warning' : 'bg-success'} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
                      <SubtaskStatusBadge status={task.status} />

                      {/* Pause / Resume button */}
                      {!isDone && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            variant={task.isActive ? 'outline' : 'default'}
                            className={`h-8 text-xs gap-1.5 ${task.isActive ? '' : 'bg-success hover:bg-success/90'}`}
                            onClick={() => toggleTaskActive(task.projectId, task.id)}
                          >
                            {task.isActive ? (
                              <><Pause className="h-3.5 w-3.5" /> Mettre en pause</>
                            ) : (
                              <><Play className="h-3.5 w-3.5" /> Reprendre</>
                            )}
                          </Button>
                        </motion.div>
                      )}

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
                        <Select value={task.status} onValueChange={(v) => updateSubtaskStatus(task.projectId, task.id, v as SubtaskStatus)}>
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
                Votre suggestion sera examinée par un administrateur avant d'être appliquée. Le champ sera modifié uniquement après approbation.
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
