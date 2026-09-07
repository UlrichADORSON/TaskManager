'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useApp } from '@/lib/app-context';

export function useAuthGuard() {
  const { currentUser } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);
  return currentUser;
}
