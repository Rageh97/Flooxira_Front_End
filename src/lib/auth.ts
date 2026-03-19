"use client";
import { useEffect, useState, useCallback } from "react";
import { meRequest, AuthUser } from "./api";

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
    // meRequest يستخدم apiFetch لكن هنا لا بأس إذا فشل لأننا نصطاد الخطأ
    meRequest(token)
      .then((res) => {
        console.log('[useAuth] User authenticated as owner:', res.user);
        setUser(res.user);
        setLoading(false);
      })
      .catch(() => {
        console.log('[useAuth] Not an owner, trying employee authentication...');
        // ⚠️ مهم: نستخدم fetch عادي وليس apiFetch لمنع المسح التلقائي للتوكن عند 401
        // apiFetch تمسح التوكن وتحول للـ sign-in عند أي 401، وهذا يسبب طرد الموظف فوراً
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        fetch(`${API_URL}/api/employees/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(res => res.json())
        .then((data: any) => {
          console.log('[useAuth] Employee response:', data);
          if (data.success && data.employee) {
            const employeeUser: AuthUser = {
              id: data.employee.id,
              name: data.employee.name,
              email: data.employee.email,
              phone: data.employee.phone || null,
              role: 'employee' as const,
              storeId: data.employee.storeId
            };
            console.log('[useAuth] Employee authenticated:', employeeUser);
            setUser(employeeUser);
          } else {
            // فشل التحقق من المالك والموظف معاً → التوكن غير صالح
            console.log('[useAuth] Both owner and employee checks failed, clearing token');
            localStorage.removeItem("auth_token");
            setUser(null);
          }
          setLoading(false);
        })
        .catch((error: any) => {
          console.log('[useAuth] Employee authentication network error:', error);
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









