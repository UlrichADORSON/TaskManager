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

const gradientMap: Record<string, string> = {
  'text-primary': 'from-[#2E98FF] to-[#172A6B]',
  'text-accent': 'from-[#8E6CF9] to-[#6C4DF6]',
  'text-warning': 'from-[#FFA24B] to-[#FF7A2E]',
  'text-success': 'from-[#34D399] to-[#0E9F6E]',
  'text-info': 'from-[#3FD4FF] to-[#2196F3]',
  'text-destructive': 'from-[#F87171] to-[#DC2626]',
};

export function StatCard({ label, value, icon: Icon, trend, color = 'text-primary', delay = 0, onClick }: StatCardProps) {
  const Component = onClick ? 'button' : 'div';
  const gradient = gradientMap[color] ?? gradientMap['text-primary'];
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
          'relative w-full rounded-2xl p-5 text-left overflow-hidden transition-all duration-300 bg-gradient-to-br text-white shadow-card',
          gradient,
          onClick && 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer',
          !onClick && 'hover:shadow-card-hover'
        )}
      >
        {/* Décorations en arrière-plan */}
        <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex-shrink-0">
            <Icon className="h-6 w-6 text-white" />
          </div>
          {onClick && (
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/15 border border-white/20 flex-shrink-0">
              <TrendIcon className={cn('h-4 w-4', trend && !trend.positive && 'rotate-90')} />
            </span>
          )}
        </div>

        <div className="relative mt-4">
          {trend && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">
              <TrendIcon className="h-3 w-3" /> {trend.value}
            </span>
          )}
          <p className="text-3xl font-bold font-display tracking-tight mt-1">{value}</p>
          <p className="text-white/80 text-sm mt-0.5">{label}</p>
        </div>
      </Component>
    </motion.div>
  );
}