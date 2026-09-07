'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Users, Euro, ArrowRight, Paperclip, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatusBadge, PriorityBadge } from '@/components/shared/badges';
import { ProgressBar } from '@/components/shared/progress';
import { useApp } from '@/lib/app-context';
import { getUser, formatDate, formatCurrency, daysUntil } from '@/lib/status';
import type { Project } from '@/types';

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const { users } = useApp();
  const manager = getUser(users, project.managerId);
  const client = getUser(users, project.clientId);
  const teamMembers = project.members.filter((m) => m.role === 'employee' || m.role === 'manager');
  const daysLeft = daysUntil(project.endDate);
  const isLate = daysLeft < 0 && project.status === 'in_progress';
  const pendingMods = project.modifications.filter((m) => m.status === 'pending');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link href={`/projects/${project.id}`}>
        <Card className="group p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative h-full">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {project.logoUrl ? (
                <div className="h-11 w-11 rounded-lg border border-border overflow-hidden bg-card flex items-center justify-center flex-shrink-0">
                  <img src={project.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold">{project.title[0]}</span>
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">{project.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{project.category}</p>
              </div>
            </div>
            <PriorityBadge priority={project.priority} />
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <StatusBadge status={project.status} />
              <div className="flex items-center gap-2">
                {pendingMods.length > 0 && (
                  <span className="flex items-center gap-1 text-warning font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />{pendingMods.length} modif.
                  </span>
                )}
                <span className={isLate ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                  {isLate ? `En retard de ${Math.abs(daysLeft)} j` : daysLeft > 0 ? `${daysLeft} j restants` : "Échéance aujourd'hui"}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">Avancement</span>
                <span className="text-xs font-bold">{project.progress}%</span>
              </div>
              <ProgressBar value={project.progress} indicatorClassName={project.progress < 33 ? 'bg-destructive' : project.progress < 66 ? 'bg-warning' : 'bg-success'} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1" title="Membres"><Users className="h-3.5 w-3.5" />{teamMembers.length}</span>
                <span className="flex items-center gap-1" title="Budget"><Euro className="h-3.5 w-3.5" />{formatCurrency(project.budget)}</span>
                <span className="flex items-center gap-1" title="Échéance"><Calendar className="h-3.5 w-3.5" />{formatDate(project.endDate)}</span>
                {project.attachments.length > 0 && (
                  <span className="flex items-center gap-1" title="Pièces jointes"><Paperclip className="h-3.5 w-3.5" />{project.attachments.length}</span>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
