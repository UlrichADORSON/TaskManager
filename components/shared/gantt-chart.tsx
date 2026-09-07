'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { subtaskStatusMeta, formatDateShort, getUser } from '@/lib/status';
import { useApp } from '@/lib/app-context';
import type { Subtask } from '@/types';

export function GanttChart({ subtasks }: { subtasks: Subtask[] }) {
  const { users } = useApp();

  const { timelineStart, timelineEnd, days, rows } = useMemo(() => {
    if (subtasks.length === 0) {
      return { timelineStart: 0, timelineEnd: 0, days: 0, rows: [] };
    }
    const start = Math.min(...subtasks.map((s) => new Date(s.startDate).getTime()));
    const end = Math.max(...subtasks.map((s) => new Date(s.dueDate).getTime()));
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    // Add padding
    const paddedStart = start - 2 * 24 * 60 * 60 * 1000;
    const paddedEnd = end + 2 * 24 * 60 * 60 * 1000;
    const totalPaddedDays = totalDays + 4;

    const sorted = [...subtasks].sort((a, b) => {
      if (a.dependsOnId && a.dependsOnId === b.id) return 1;
      if (b.dependsOnId && b.dependsOnId === a.id) return -1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    return {
      timelineStart: paddedStart,
      timelineEnd: paddedEnd,
      days: totalPaddedDays,
      rows: sorted,
    };
  }, [subtasks]);

  if (subtasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucune sous-tâche à afficher dans le Gantt.</p>
        <p className="text-sm mt-1">Le manager doit créer des sous-tâches pour ce projet.</p>
      </div>
    );
  }

  // Generate week markers
  const weekMarkers: { label: string; offset: number }[] = [];
  const msPerDay = 24 * 60 * 60 * 1000;
  for (let d = 0; d <= days; d += 7) {
    const date = new Date(timelineStart + d * msPerDay);
    weekMarkers.push({ label: formatDateShort(date.toISOString()), offset: d });
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="min-w-[700px]">
        {/* Timeline header */}
        <div className="flex border-b border-border pb-2 mb-3 sticky top-0 bg-card z-10">
          <div className="w-64 flex-shrink-0 text-xs font-medium text-muted-foreground">Sous-tâche</div>
          <div className="flex-1 relative h-6">
            {weekMarkers.map((m, i) => (
              <div
                key={i}
                className="absolute text-[10px] text-muted-foreground font-medium"
                style={{ left: `${(m.offset / days) * 100}%`, transform: 'translateX(-50%)' }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rows.map((st, i) => {
            const startOffset = (new Date(st.startDate).getTime() - timelineStart) / msPerDay;
            const duration = Math.max(1, Math.ceil((new Date(st.dueDate).getTime() - new Date(st.startDate).getTime()) / msPerDay));
            const leftPct = (startOffset / days) * 100;
            const widthPct = (duration / days) * 100;
            const meta = subtaskStatusMeta[st.status];
            const assignee = getUser(users, st.assignedToId);
            const dependency = st.dependsOnId ? subtasks.find((s) => s.id === st.dependsOnId) : null;
            const depIndex = dependency ? rows.indexOf(dependency) : -1;

            return (
              <div key={st.id} className="flex items-center group">
                <div className="w-64 flex-shrink-0 pr-3">
                  <p className="text-sm font-medium truncate">{st.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {assignee?.name ?? 'Non assigné'}
                  </p>
                </div>
                <div className="flex-1 relative h-10">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: Math.ceil(days / 7) }).map((_, j) => (
                      <div key={j} className="flex-1 border-l border-border/30 first:border-l-0" />
                    ))}
                  </div>

                  {/* Dependency arrow */}
                  {depIndex >= 0 && depIndex < i && (
                    <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
                      <motion.line
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        x1={`${leftPct}%`}
                        y1="-4"
                        x2={`${leftPct}%`}
                        y2="0"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    </svg>
                  )}

                  {/* Bar */}
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${widthPct}%`, opacity: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-2 text-xs font-medium shadow-sm cursor-pointer',
                      meta.bg, meta.color, 'border',
                    )}
                    style={{ left: `${leftPct}%` }}
                    title={`${st.title} — ${formatDateShort(st.startDate)} → ${formatDateShort(st.dueDate)}`}
                  >
                    <div className={cn('h-1 w-1 rounded-full flex-shrink-0 mr-1.5', meta.dot)} />
                    <span className="truncate">{st.title}</span>
                    {st.status === 'done' && (
                      <span className="ml-auto text-[10px] font-bold">100%</span>
                    )}
                    {st.status !== 'done' && st.progress > 0 && (
                      <span className="ml-auto text-[10px] font-bold">{st.progress}%</span>
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
