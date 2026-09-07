'use client';

import { motion } from 'framer-motion';
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

export function StatCard({ label, value, icon: Icon, trend, color = 'text-primary', delay = 0, onClick }: StatCardProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Component
        onClick={onClick}
        className={cn(
          'w-full rounded-xl border border-border bg-card p-5 text-left transition-all',
          onClick && 'hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer',
          !onClick && 'hover:shadow-md'
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={cn('inline-flex items-center justify-center h-10 w-10 rounded-lg bg-muted/50', color)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span className={cn('text-xs font-medium', trend.positive ? 'text-success' : 'text-destructive')}>
              {trend.value}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold font-display tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </Component>
    </motion.div>
  );
}
