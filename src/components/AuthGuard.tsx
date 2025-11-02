'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loader from '@/components/Loader';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    return fallback || (
      <Loader 
        text="جاري التحقق من المصادقة..." 
        size="lg" 
        variant="warning"
        showDots
        fullScreen
      />
    );
  }

  if (!user) {
    return fallback || (
      <Loader 
        text="جاري إعادة التوجيه لتسجيل الدخول..." 
        size="lg" 
        variant="warning"
        showDots
        fullScreen
      />
    );
  }

  return <>{children}</>;
}

















