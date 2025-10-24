"use client";
import { useEffect, useState, useCallback } from "react";
import { meRequest, AuthUser } from "./api";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.log('[useAuth] Not an owner, trying employee authentication...');
        // إذا فشل، يحاول جلب بيانات الموظف
        fetch('/api/employees/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(res => res.json())
        .then(data => {
          console.log('[useAuth] Employee response:', data);
          if (data.success) {
            // تحويل بيانات الموظف إلى تنسيق المستخدم
            const employeeUser = {
              id: data.employee.id,
              name: data.employee.name,
              email: data.employee.email,
              phone: null,
              role: 'employee' as const
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

  return { user, loading, signOut, getToken };
}









