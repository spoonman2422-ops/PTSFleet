"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';

export default function DashboardPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case 'Admin':
          router.replace('/dashboard/admin');
          break;
        case 'Dispatcher':
          router.replace('/dashboard/dispatcher');
          break;
        case 'Driver':
          router.replace('/dashboard/driver');
          break;
        default:
          router.replace('/');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
    </div>
  );
}
