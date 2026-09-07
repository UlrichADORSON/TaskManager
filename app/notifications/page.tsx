'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/types';

const notificationIcon: Record<AppNotification['type'], string> = {
  project_submitted: '📂',
  project_validated: '✅',
  project_rejected: '❌',
  subtask_assigned: '📌',
  new_message: '💬',
  delay_detected: '⏰',
  project_completed: '🎉',
  modification_requested: '📝',
  modification_reviewed: '🔍',
  member_added: '👥',
  subtask_reviewed: '✅',
};

export default function NotificationsPage() {
  const user = useAuthGuard();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const router = useRouter();

  if (!user) return null;

  const userNotifs = notifications.filter((n) => n.userId === user.id);
  const unreadCount = userNotifs.filter((n) => !n.read).length;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
            <CheckCheck className="h-4 w-4 mr-2" /> Tout marquer comme lu
          </Button>
        )}
      </div>

      {userNotifs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucune notification.</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {userNotifs.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
            >
              <Card
                className={cn(
                  'p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow',
                  !n.read && 'border-primary/30 bg-primary/5',
                )}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.projectId) router.push(`/projects/${n.projectId}`);
                }}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{notificationIcon[n.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-2" />}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
