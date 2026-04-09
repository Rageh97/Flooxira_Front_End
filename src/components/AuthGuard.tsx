'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Loader from '@/components/Loader';
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    
    // Protect only the /admin route (requires admin role)
    if (pathname.startsWith('/admin')) {
      if (!user) {
        toast.error("يجب تسجيل الدخول كمسؤول للوصول لهذه الصفحة");
        router.push('/sign-in');
        return;
      }
      if (user.role !== 'admin') {
        toast.error("ليس لديك صلاحية الوصول لإدارة المنصة");
        router.push('/dashboard');
        return;
      }
    }

    // Allow all other routes to be viewable by anyone (logged in or guest)
    // we will protect ACTIONS inside the components themselves.
  }, [user, loading, router, pathname]);

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

  // Admin Route Protection UI
  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      return fallback || (
        <Loader 
          text="جاري إعادة التوجيه..." 
          size="lg" 
          variant="warning" 
          showDots
          fullScreen
        />
      );
    }
  }

  return <>{children}</>;
}

















