'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    // If not logged in, redirect to sign-in
    if (!user) {
      router.push('/sign-in');
      return;
    }
    
    // If logged in but not admin, redirect to dashboard
    if (user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          <span className="text-gray-600">جاري التحقق من الصلاحيات...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          <span className="text-gray-600">جاري إعادة التوجيه لتسجيل الدخول...</span>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-red-500" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">غير مصرح لك</h2>
            <p className="text-gray-600 mb-4">ليس لديك صلاحيات الوصول إلى هذه الصفحة</p>
            <span className="text-sm text-gray-500">جاري إعادة التوجيه...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
