'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';

export default function Home() {
  const { currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    router.replace(currentUser ? '/dashboard' : '/login');
  }, [currentUser, router]);

  return null;
}