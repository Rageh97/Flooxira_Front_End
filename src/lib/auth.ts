"use client";
import { useEffect, useState, useCallback } from "react";
import { meRequest, AuthUser, apiFetch } from "./api";

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
    if (!token) {
      setLoading(false);
      return;
    }
    
    console.log('[useAuth] Token found, authenticating...');
    
    // يحاول جلب بيانات المستخدم العادي أولاً
    meRequest(token)
      .then((res) => {
        console.log('[useAuth] User authenticated as owner:', res.user);
        setUser(res.user);
        setLoading(false);
      })
      .catch(() => {
        console.log('[useAuth] Not an owner or request failed, trying employee authentication...');
        // استخدام apiFetch لجلب بيانات الموظف للاستفادة من المعالجة الموحدة للأخطاء
        apiFetch<any>('/api/employees/me', { authToken: token })
        .then(data => {
          console.log('[useAuth] Employee response:', data);
          if (data.success && data.employee) {
            // تحويل بيانات الموظف إلى تنسيق المستخدم
            const employeeUser = {
              id: data.employee.id,
              name: data.employee.name,
              email: data.employee.email,
              phone: data.employee.phone,
              role: 'employee' as const,
              storeId: data.employee.storeId
            };
            console.log('[useAuth] Employee authenticated:', employeeUser);
            setUser(employeeUser);
          } else {
            console.log('[useAuth] Employee authentication failed');
            setUser(null);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.log('[useAuth] Employee authentication error:', error);
          setUser(null);
          setLoading(false);
        });
      });
  }, []);

  function signOut() {
    localStorage.removeItem("auth_token");
    setUser(null);
  }

  const getToken = useCallback(() => {
    return localStorage.getItem("auth_token");
  }, []);

  return { user, loading, signOut, getToken, refreshUser };
}









