'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: string;
  delay?: number;
  onClick?: () => void;
}

const cardMeta: Record<string, { bg: string; chip: string }> = {
  'text-primary':     { bg: 'bg-primary/5 border-primary/20',     chip: 'bg-primary/10 text-primary' },
  'text-accent':      { bg: 'bg-accent/5 border-accent/20',       chip: 'bg-accent/10 text-accent' },
  'text-warning':     { bg: 'bg-warning/5 border-warning/20',     chip: 'bg-warning/10 text-warning' },
  'text-success':     { bg: 'bg-success/5 border-success/20',     chip: 'bg-success/10 text-success' },
  'text-info':        { bg: 'bg-info/5 border-info/20',           chip: 'bg-info/10 text-info' },
  'text-destructive': { bg: 'bg-destructive/5 border-destructive/20', chip: 'bg-destructive/10 text-destructive' },
};

export function StatCard({ label, value, icon: Icon, trend, color = 'text-primary', delay = 0, onClick }: StatCardProps) {
  const Component = onClick ? 'button' : 'div';
  const meta = cardMeta[color] ?? cardMeta['text-primary'];
  const TrendIcon = trend ? (trend.positive ? ArrowUpRight : ArrowDownRight) : ArrowUpRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Component
        onClick={onClick}
        className={cn(
          'relative w-full rounded-xl p-4 text-left bg-card transition-all duration-300 border',
          meta.bg,
          onClick && 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer'
        )}
      >
        <div className="relative flex items-center justify-between">
          <div className={cn('inline-flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0', meta.chip)}>
            <Icon className="h-4 w-4" />
          </div>
          {onClick && (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted/70 text-muted-foreground flex-shrink-0">
              <TrendIcon className={cn('h-3 w-3', trend && !trend.positive && 'rotate-90')} />
            </span>
          )}
        </div>

        <div className="relative mt-3">
          {trend && (
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              trend.positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
              <TrendIcon className="h-3 w-3" /> {trend.value}
            </span>
          )}
          <p className="text-xl font-bold font-display tracking-tight mt-1 text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </Component>
    </motion.div>
  );
}