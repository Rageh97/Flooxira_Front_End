"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from './api';

interface UserPermissions {
  platforms: string[];
  monthlyPosts: number;
  canManageWhatsApp: boolean;
  whatsappMessagesPerMonth: number;
  canManageTelegram: boolean;
  canSallaIntegration: boolean;
  canManageContent: boolean;
}

interface Subscription {
  id: number;
  status: string;
  startedAt: string;
  expiresAt: string;
  plan: {
    id: number;
    name: string;
    permissions: UserPermissions;
  };
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setPermissions(null);
        setSubscription(null);
        return;
      }

      // Try multiple endpoints to find the correct one
      const endpoints = [
        '/api/subscription-requests/my-subscription',
        '/api/subscription/my-subscription',
        '/subscription-requests/my-subscription',
        '/subscription/my-subscription'
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          response = await apiFetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          console.log(`Success with endpoint: ${endpoint}`, response);
          break;
        } catch (error: any) {
          console.log(`Failed with endpoint: ${endpoint}`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error('All endpoints failed');
      }

      if ((response as any).success) {
        if ((response as any).subscription) {
          setSubscription((response as any).subscription);
          setPermissions((response as any).subscription.plan.permissions);
        } else {
          setPermissions(null);
          setSubscription(null);
        }
      } else {
        setPermissions(null);
        setSubscription(null);
      }
    } catch (err: any) {
      console.error('Error loading permissions:', err);
      setError(err.message);
      setPermissions(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!permissions) return false;
    return Boolean(permissions[permission]);
  };

  const hasPlatformAccess = (platform: string): boolean => {
    if (!permissions) return false;
    return permissions.platforms?.includes(platform) || false;
  };

  const canManageWhatsApp = (): boolean => {
    return hasPermission('canManageWhatsApp');
  };

  const canManageTelegram = (): boolean => {
    return hasPermission('canManageTelegram');
  };

  const canManageContent = (): boolean => {
    return hasPermission('canManageContent');
  };

  const canSallaIntegration = (): boolean => {
    return hasPermission('canSallaIntegration');
  };

  const getWhatsAppMessagesLimit = (): number => {
    return permissions?.whatsappMessagesPerMonth || 0;
  };

  const getMonthlyPostsLimit = (): number => {
    return permissions?.monthlyPosts || 0;
  };

  const hasActiveSubscription = (): boolean => {
    return Boolean(subscription?.status === 'active' && 
           subscription?.expiresAt && 
           new Date(subscription.expiresAt) > new Date());
  };

  return {
    permissions,
    subscription,
    loading,
    error,
    hasPermission,
    hasPlatformAccess,
    canManageWhatsApp,
    canManageTelegram,
    canManageContent,
    canSallaIntegration,
    getWhatsAppMessagesLimit,
    getMonthlyPostsLimit,
    hasActiveSubscription,
    reloadPermissions: loadPermissions
  };
}
