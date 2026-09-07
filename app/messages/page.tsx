'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { Card } from '@/components/ui/card';
import { DiscussionChannel } from '@/components/shared/discussion-channel';
import { getUser } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Channel } from '@/types';

export default function MessagesPage() {
  const user = useAuthGuard();
  const { projects, users } = useApp();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const allChannels = useMemo(() => {
    if (!user) return [];
    const channels: { channel: Channel; projectName: string }[] = [];
    projects.forEach((p) => {
      p.channels.forEach((ch) => {
        const isParticipant = ch.participants.some((par) => par.userId === user.id);
        if (isParticipant) {
          channels.push({ channel: ch, projectName: p.title });
        }
      });
    });
    return channels;
  }, [user, projects]);

  // Auto-select first channel when channels load
  useEffect(() => {
    if (!selectedChannel && allChannels.length > 0) {
      setSelectedChannel(allChannels[0].channel);
    }
  }, [allChannels, selectedChannel]);

  if (!user) return null;

  return (
    <AppShell>
      <h2 className="font-display text-2xl font-bold tracking-tight mb-6">Messages</h2>

      {allChannels.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucun canal de discussion disponible.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)]">
          {/* Channel list */}
          <Card className="p-3 lg:w-80 flex-shrink-0 overflow-y-auto scrollbar-thin">
            <div className="space-y-1">
              {allChannels.map(({ channel, projectName }) => {
                const lastMsg = channel.messages[channel.messages.length - 1];
                const lastAuthor = lastMsg ? getUser(users, lastMsg.authorId) : undefined;
                const isSelected = selectedChannel?.id === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50',
                    )}
                  >
                    <p className="font-medium text-sm truncate">{projectName}</p>
                    <p className={cn('text-xs truncate mt-0.5', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {channel.type === 'client_admin' ? 'Canal Client ↔ Admin' : 'Canal Groupe'}
                    </p>
                    {lastMsg && (
                      <p className={cn('text-xs truncate mt-1', isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                        {lastAuthor?.name.split(' ')[0]}: {lastMsg.content}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Channel view */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            {selectedChannel ? (
              <DiscussionChannel channel={selectedChannel} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Sélectionnez un canal pour commencer à discuter
              </div>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
