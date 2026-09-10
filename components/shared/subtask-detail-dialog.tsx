'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MessageSquare, Paperclip, Upload, Download, Eye,
  Image as ImageIcon, FileText, Send, Edit3, CheckCircle2,
  ChevronDown, ChevronUp, History, Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { SubtaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ProgressBar } from '@/components/shared/progress';
import { getUser, formatDate, formatDateTime, timeAgo, subtaskStatusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Subtask, SubtaskStatus, User as UserType, Attachment } from '@/types';

interface SubtaskDetailDialogProps {
  subtask: Subtask | null;
  users: UserType[];
  canManage: boolean;
  isProjectMember: boolean;
  currentUserId: string;
  open: boolean;
  onClose: () => void;
  onStatusChange: (subtaskId: string, status: SubtaskStatus) => void;
  onProgressChange: (subtaskId: string, progress: number) => void;
  onAddComment: (subtaskId: string, content: string) => void;
  onAddDeliverable: (subtaskId: string, attachment: Attachment) => void;
  onModificationRequest: (subtaskId: string) => void;
}

export function SubtaskDetailDialog({
  subtask,
  users,
  canManage,
  isProjectMember,
  currentUserId,
  open,
  onClose,
  onStatusChange,
  onProgressChange,
  onAddComment,
  onAddDeliverable,
  onModificationRequest,
}: SubtaskDetailDialogProps) {
  const [commentText, setCommentText] = useState('');
  const [editProgress, setEditProgress] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);
  const [viewingFile, setViewingFile] = useState<{ url: string; fileName: string; fileType: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!subtask || !open) return null;

  const assignee = getUser(users, subtask.assignedToId);
  const deliverables = subtask.attachments ?? [];
  const comments = subtask.comments ?? [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const att: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        fileType: file.type,
        url: URL.createObjectURL(file),
        uploadedBy: currentUserId,
        uploadedAt: new Date().toISOString(),
      };
      onAddDeliverable(subtask.id, att);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    onAddComment(subtask.id, commentText);
    setCommentText('');
  };

  const handleSaveProgress = () => {
    onProgressChange(subtask.id, tempProgress);
    setEditProgress(false);
  };

  const handleStartEditProgress = () => {
    setTempProgress(subtask.progress);
    setEditProgress(true);
  };

  const getNextStatus = (): SubtaskStatus | null => {
    switch (subtask.status) {
      case 'todo': return 'in_progress';
      case 'in_progress': return 'review';
      case 'review': return 'done';
      default: return null;
    }
  };

  const getPrevStatus = (): SubtaskStatus | null => {
    switch (subtask.status) {
      case 'in_progress': return 'todo';
      case 'review': return 'in_progress';
      case 'done': return 'review';
      default: return null;
    }
  };

  const nextStatus = getNextStatus();
  const prevStatus = getPrevStatus();

  const fileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <>
      {/* Main Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-card rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <SubtaskStatusBadge status={subtask.status} />
                <PriorityBadge priority={subtask.priority} />
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight">{subtask.title}</h2>
              {subtask.description && (
                <p className="text-sm text-muted-foreground mt-1">{subtask.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center flex-shrink-0 ml-3"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Assigné</p>
                <div className="flex items-center gap-2">
                  {assignee ? (
                    <>
                      <UserAvatar user={assignee} size="sm" className="h-5 w-5" />
                      <span className="text-sm font-medium truncate">{assignee.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Non assigné</span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Dates</p>
                <p className="text-sm">{formatDate(subtask.startDate)}</p>
                <p className="text-xs text-muted-foreground">→ {formatDate(subtask.dueDate)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Commentaires</p>
                <p className="text-sm font-medium">{comments.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Livrables</p>
                <p className="text-sm font-medium">{deliverables.length}</p>
              </div>
            </div>

            {/* Progress Section */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Progression</span>
                </div>
                {canManage && !editProgress && (
                  <button
                    onClick={handleStartEditProgress}
                    className="text-xs text-primary hover:underline"
                  >
                    Modifier
                  </button>
                )}
              </div>

              {editProgress ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempProgress}
                      onChange={(e) => setTempProgress(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-lg font-bold w-12 text-right">{tempProgress}%</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProgress} className="h-8">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Sauvegarder
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditProgress(false)} className="h-8">
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Avancement</span>
                    <span className="font-bold text-primary">{subtask.progress}%</span>
                  </div>
                  <ProgressBar
                    value={subtask.progress}
                    indicatorClassName={subtask.progress < 33 ? 'bg-destructive' : subtask.progress < 66 ? 'bg-warning' : 'bg-success'}
                    className="h-3"
                  />
                </div>
              )}
            </div>

            {/* Status Actions */}
            {canManage && (
              <div className="flex gap-2">
                {prevStatus && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(subtask.id, prevStatus)}
                    className="gap-1.5"
                  >
                    ← {subtaskStatusMeta[prevStatus].label}
                  </Button>
                )}
                {nextStatus && (
                  <Button
                    size="sm"
                    onClick={() => onStatusChange(subtask.id, nextStatus)}
                    className="gap-1.5 bg-primary hover:bg-primary/90"
                  >
                    {subtaskStatusMeta[nextStatus].label} →
                  </Button>
                )}
              </div>
            )}

            {/* Deliverables Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Livrables</span>
                  <Badge variant="outline" className="text-[10px]">{deliverables.length}</Badge>
                </div>
                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" /> Ajouter
                  </Button>
                )}
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
              </div>

              {deliverables.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun livrable pour le moment</p>
                  {canManage && (
                    <p className="text-xs mt-1">Uploadez des fichiers pour montrer l'avancement</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {deliverables.map((att) => {
                    const uploader = getUser(users, att.uploadedBy);
                    return (
                      <div
                        key={att.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 transition-colors group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          {fileIcon(att.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{att.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {uploader?.name ?? 'Inconnu'} · {timeAgo(att.uploadedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setViewingFile({ url: att.url, fileName: att.fileName, fileType: att.fileType })}
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                            title="Aperçu"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={att.url}
                            download={att.fileName}
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Version History */}
            {deliverables.length > 1 && (
              <div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <History className="h-4 w-4" />
                  Historique des versions ({deliverables.length})
                  {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2 pl-4 border-l-2 border-border">
                        {[...deliverables].reverse().map((att, i) => {
                          const uploader = getUser(users, att.uploadedBy);
                          return (
                            <div key={att.id} className="flex items-center gap-3 py-2">
                              <div className={cn(
                                'h-2 w-2 rounded-full flex-shrink-0',
                                i === 0 ? 'bg-success' : 'bg-muted-foreground/30'
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">{att.fileName}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {uploader?.name} · {formatDateTime(att.uploadedAt)}
                                </p>
                              </div>
                              {i === 0 && (
                                <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
                                  Actuelle
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Comments Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Discussion</span>
                <Badge variant="outline" className="text-[10px]">{comments.length}</Badge>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun commentaire. Commencez la discussion !
                  </p>
                ) : (
                  comments.map((c) => {
                    const author = getUser(users, c.authorId);
                    const isMine = c.authorId === currentUserId;
                    return (
                      <div key={c.id} className={cn('flex items-start gap-2', isMine && 'flex-row-reverse')}>
                        <UserAvatar user={author} size="sm" className="h-6 w-6 mt-0.5" />
                        <div className={cn(
                          'max-w-[80%] p-3 rounded-xl',
                          isMine ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border/50'
                        )}>
                          <div className="flex items-center gap-2">
                            <span className={cn('text-xs font-semibold', isMine ? 'text-primary-foreground/80' : '')}>{author?.name ?? 'Inconnu'}</span>
                            <span className={cn('text-[10px]', isMine ? 'text-primary-foreground/60' : 'text-muted-foreground')}>{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className={cn('text-sm mt-0.5', isMine ? 'text-primary-foreground' : '')}>{c.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Écrivez un commentaire..."
                  rows={2}
                  className="resize-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                />
                <Button onClick={handleSendComment} disabled={!commentText.trim()} className="shrink-0 h-10">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Footer - Modification Request */}
          {isProjectMember && (
            <div className="p-4 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                onClick={() => onModificationRequest(subtask.id)}
                className="w-full gap-2"
              >
                <Edit3 className="h-4 w-4" /> Demander une modification
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* File Viewer */}
      {viewingFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setViewingFile(null)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{viewingFile.fileName}</span>
              </div>
              <button onClick={() => setViewingFile(null)} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              {viewingFile.fileType.startsWith('image/') ? (
                <div>
                  <div className="flex justify-center mb-3">
                    <a
                      href={viewingFile.url}
                      download={viewingFile.fileName}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary text-white text-xs font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Télécharger
                    </a>
                  </div>
                  <img src={viewingFile.url} alt={viewingFile.fileName} className="max-w-full max-h-[70vh] rounded-lg object-contain mx-auto" />
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">{viewingFile.fileName}</p>
                  <Button onClick={() => window.open(viewingFile.url, '_blank')}>
                    <Download className="h-4 w-4 mr-2" /> Télécharger
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
