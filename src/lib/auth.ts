"use client";
import { useEffect, useState, useCallback } from "react";
import { meRequest, AuthUser } from "./api";

// Helper: check if a JWT token is expired (client-side, no verify)
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      const res = await meRequest(token);
      setUser(res.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    // لا يوجد توكن
    if (!token) {
      setLoading(false);
      return;
    }

    // التوكن منتهي - نمسحه فقط، AuthGuard سيتولى الـ redirect
    if (isTokenExpired(token)) {
      console.warn('[useAuth] Token expired — clearing from localStorage');
      localStorage.removeItem("auth_token");
      setLoading(false);
      return;
    }

    console.log('[useAuth] Token valid, authenticating...');

    // يحاول جلب بيانات المستخدم العادي أولاً
    meRequest(token)
      .then((res) => {
        console.log('[useAuth] ✅ Authenticated as owner:', res.user?.email);
        setUser(res.user);
        setLoading(false);
      })
      .catch((err) => {
        const status = (err as any)?.status;

        // إذا كان الخطأ غير 401، إذن مشكلة في الشبكة أو السيرفر
        // إذا كان 401، قد يكون موظف (فـ /me ترفض الموظفين)، نجرب employee أولاً
        console.log('[useAuth] /me failed (status:', status, ') — trying employee...');

        // يحاول جلب بيانات الموظف
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        fetch(`${apiUrl}/api/employees/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
          .then(res => {
            if (res.status === 401) {
              // ليس موظفاً ولا مالكاً صالحاً = التوكن غير صالح
              console.warn('[useAuth] 401 from both /me & /employees/me — clearing token');
              localStorage.removeItem("auth_token");
              setLoading(false);
              return null;
            }
            return res.json();
          })
          .then(data => {
            if (!data) return;
            if (data.success && data.employee) {
              const employeeUser: AuthUser = {
                id: data.employee.id,
                name: data.employee.name,
                email: data.employee.email,
                phone: null,
                role: 'employee',
                storeId: data.employee.storeId
              };
              console.log('[useAuth] ✅ Authenticated as employee:', employeeUser.email);
              setUser(employeeUser);
            } else {
              console.warn('[useAuth] Employee auth failed — clearing token');
              localStorage.removeItem("auth_token");
            }
            setLoading(false);
          })
          .catch((fetchErr) => {
            console.error('[useAuth] Employee fetch error:', fetchErr);
            setLoading(false);
          });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // يعمل مرة واحدة فقط عند mount

  function signOut() {
    localStorage.removeItem("auth_token");
    setUser(null);
  }

  const getToken = useCallback(() => {
    return localStorage.getItem("auth_token");
  }, []);

  return { user, loading, signOut, getToken, refreshUser };
}
