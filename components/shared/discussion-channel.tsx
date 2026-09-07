'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Send, Download, FileIcon, ImageIcon, Phone } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { UserAvatar } from '@/components/shared/user-avatar';
import { RoleBadge } from '@/components/shared/badges';
import { UserContactHoverCard } from '@/components/shared/user-contact-hover-card';
import { getUser, formatTime, formatDate } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Channel } from '@/types';

export function DiscussionChannel({ channel }: { channel: Channel }) {
  const { users, currentUser, sendMessage } = useApp();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [channel.messages.length]);

  if (!currentUser) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(channel.id, input.trim());
    setInput('');
  };

  const participants = channel.participants
    .map((p) => getUser(users, p.userId))
    .filter(Boolean) as NonNullable<ReturnType<typeof getUser>>[];

  return (
    <div className="flex flex-col h-full">
      {/* Participants bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border overflow-x-auto scrollbar-thin">
        <span className="text-xs text-muted-foreground flex-shrink-0">Participants:</span>
        <div className="flex items-center gap-2">
          {participants.map((u) => (
            <UserContactHoverCard key={u.id} user={u}>
              <div className="flex items-center gap-1.5 flex-shrink-0 cursor-default" title={`${u.name}${u.phone ? ` — ${u.phone}` : ''}`}>
                <UserAvatar user={u} size="sm" className="h-6 w-6" />
                <span className="text-xs font-medium hidden sm:inline">{u.name.split(' ')[0]}</span>
                {u.phone && <Phone className="h-3 w-3 text-muted-foreground hidden lg:block" />}
              </div>
            </UserContactHoverCard>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 min-h-[300px]">
        {channel.messages.map((msg, i) => {
          const author = getUser(users, msg.authorId);
          const isMe = msg.authorId === currentUser.id;
          const prevMsg = channel.messages[i - 1];
          const showAvatar = !prevMsg || prevMsg.authorId !== msg.authorId;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex gap-3', isMe && 'flex-row-reverse')}
            >
              <div className="flex-shrink-0">
                {showAvatar ? <UserAvatar user={author} size="sm" className="h-8 w-8" /> : <div className="w-8" />}
              </div>
              <div className={cn('flex flex-col max-w-[75%]', isMe && 'items-end')}>
                {showAvatar && (
                  <div className={cn('flex items-center gap-2 mb-1', isMe && 'flex-row-reverse')}>
                    {author && (
                      <UserContactHoverCard user={author}>
                        <span className="text-xs font-semibold cursor-default">{author.name}</span>
                      </UserContactHoverCard>
                    )}
                    {author && <RoleBadge role={author.role} />}
                    <span className="text-[10px] text-muted-foreground">
                      {i === 0 || (prevMsg && new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString())
                        ? formatDate(msg.createdAt)
                        : ''} {formatTime(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm',
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm',
                )}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
                          isMe ? 'bg-primary-foreground/10' : 'bg-card',
                        )}>
                          {att.fileType.startsWith('image/') ? <ImageIcon className="h-4 w-4 flex-shrink-0" /> : <FileIcon className="h-4 w-4 flex-shrink-0" />}
                          <span className="truncate flex-1">{att.fileName}</span>
                          <Download className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Écrire un message..."
            className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-muted/40 border border-transparent focus:border-border focus:bg-card transition-all outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
