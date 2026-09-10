'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useApp } from '@/lib/app-context';

export function useAuthGuard() {
  const { currentUser, sessionInitialized } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!currentUser && sessionInitialized) {
      router.replace('/login');
    }
  }, [currentUser, sessionInitialized, router]);
  return currentUser;
}
