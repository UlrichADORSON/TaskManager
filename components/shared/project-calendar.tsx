'use client';

import { useMemo, useState } from 'react';
import * as df from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent, Subtask } from '@/types';

const typeColor: Record<string, string> = {
  rendez_vous: 'bg-primary text-white',
  deadline: 'bg-primary text-white',
  cadrage: 'bg-info text-white',
  design: 'bg-foreground/90 text-white',
  developpement: 'bg-chart-5 text-white',
  recette: 'bg-warning text-white',
  livraison: 'bg-success text-white',
};

const typeLabel: Record<string, string> = {
  rendez_vous: 'Rendez-vous',
  deadline: 'Échéance',
  cadrage: 'Cadrage',
  design: 'Design',
  developpement: 'Développement',
  recette: 'Recette',
  livraison: 'Livraison',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface ProjectCalendarProps {
  events: CalendarEvent[];
  subtasks: Subtask[];
  className?: string;
}

export function ProjectCalendar({ events, subtasks, className }: ProjectCalendarProps) {
  const [month, setMonth] = useState(() => df.startOfMonth(new Date()));

  const days = useMemo(
    () =>
      df.eachDayOfInterval({
        start: df.startOfWeek(df.startOfMonth(month), { weekStartsOn: 1 }),
        end: df.endOfWeek(df.endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month]
  );

  const monthEvents = useMemo(
    () => events.filter((e) => df.isSameMonth(df.parseISO(e.date), month)),
    [events, month]
  );

  const monthSubtasks = useMemo(
    () => subtasks.filter((st) => df.isSameMonth(df.parseISO(st.startDate), month)),
    [subtasks, month]
  );

  const legendTypes = useMemo(
    () => Array.from(new Set(monthEvents.map((e) => e.type))),
    [monthEvents]
  );

  const byDay = (date: Date) => {
    const dayEvents = events.filter((e) => df.isSameDay(df.parseISO(e.date), date));
    const dayTasks = subtasks.filter((st) => df.isSameDay(df.parseISO(st.startDate), date));
    return { dayEvents, dayTasks };
  };

  return (
    <div className={cn('bg-card border border-border/40 rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.12)]', className)}>
      {/* En-tête */
      }
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMonth((m) => df.addMonths(m, -1))}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMonth((m) => df.addMonths(m, 1))}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h4 className="font-display font-semibold text-base ml-1 capitalize">
            {df.format(month, 'MMMM yyyy', { locale: fr })}
          </h4>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground rounded-full bg-muted/60 px-3 py-1">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          {monthEvents.length} événement{monthEvents.length > 1 ? 's' : ''} · {monthSubtasks.length} tâche{monthSubtasks.length > 1 ? 's' : ''} au cours du mois
        </span>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grille du mois */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const { dayEvents, dayTasks } = byDay(d);
          const inMonth = df.isSameMonth(d, month);
          const today = df.isToday(d);
          return (
            <div
              key={d.toISOString()}
              className={cn(
                'min-h-[70px] sm:min-h-[92px] rounded-[10px] border p-1.5 flex flex-col gap-1',
                inMonth ? 'bg-[#F7FAFD] border-border/40' : 'bg-muted/20 border-transparent opacity-50'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full',
                    today ? 'bg-primary text-white' : inMonth ? 'text-foreground' : 'text-muted-foreground/60'
                  )}
                >
                  {df.format(d, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-info rounded-md bg-info/10 px-1.5 py-0.5">
                    <ListTodo className="h-3 w-3" />{dayTasks.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((ev) => (
                  <span
                    key={ev.id}
                    title={ev.title}
                    className={cn('block truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight', typeColor[ev.type] ?? 'bg-primary text-white')}
                  >
                    {ev.title}
                  </span>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[10px] font-semibold text-muted-foreground px-1">+{dayEvents.length - 2}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      {legendTypes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><ListTodo className="h-3 w-3 text-info" /> Sous-tâches (cadrage)</span>
          {legendTypes.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-[4px]', (typeColor[t] ?? 'bg-primary').split(' ')[0])} />
              {typeLabel[t] ?? t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}