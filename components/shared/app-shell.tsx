'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/shared/sidebar';
import { Topbar } from '@/components/shared/topbar';
import { NotificationToastListener } from '@/components/shared/notification-toast-listener';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NotificationToastListener />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div
        className="transition-[padding] duration-300"
        style={{ paddingLeft: collapsed ? 72 : 264 }}
      >
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
