"use client";
import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiFetch } from './api';

interface UserPermissions {
  platforms: string[];
  monthlyPosts: number;
  canManageWhatsApp: boolean;
  whatsappMessagesPerMonth: number;
  canManageTelegram: boolean;
  canSallaIntegration: boolean;
  canManageContent: boolean;
  canManageCustomers: boolean;
  canMarketServices: boolean;
  maxServices: number;
  canManageEmployees: boolean;
  maxEmployees: number;
  canUseAI: boolean;
  aiCredits: number;
  canUseLiveChat: boolean;
  liveChatAiResponses?: number;
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

// Simple in-memory cache to prevent multiple simultaneous API calls
let cachedPermissions: UserPermissions | null = null;
let cachedSubscription: Subscription | null = null;
let lastLoadTime = 0;
let loadingPromise: Promise<void> | null = null;
const CACHE_DURATION = 30000; // 30 seconds cache

export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    try {
      // If already loading, wait for the existing promise
      if (loadingPromise) {
        await loadingPromise;
        setPermissions(cachedPermissions);
        setSubscription(cachedSubscription);
        setLoading(false);
        return;
      }
      
      // Use cache if it's fresh (less than 30 seconds old)
      const now = Date.now();
      if (cachedPermissions && now - lastLoadTime < CACHE_DURATION) {
        console.log('Using cached permissions');
        setPermissions(cachedPermissions);
        setSubscription(cachedSubscription);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        cachedPermissions = null;
        cachedSubscription = null;
        setPermissions(null);
        setSubscription(null);
        return;
      }

      // Create loading promise to prevent duplicate calls
      loadingPromise = (async () => {
        try {
          // Check if user is an employee first
          try {
            const employeeResponse = await apiFetch<{ success: boolean; employee?: { permissions: UserPermissions } }>('/api/employees/me', { authToken: token });
            if (employeeResponse.success && employeeResponse.employee) {
              // User is an employee - use employee permissions
              cachedPermissions = employeeResponse.employee.permissions;
              cachedSubscription = null;
              setPermissions(cachedPermissions);
              setSubscription(null);
              lastLoadTime = Date.now();
              return;
            }
          } catch (error) {
            // Not an employee, continue with owner logic
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
              break;
            } catch (error: any) {
              lastError = error;
              continue;
            }
          }

          if (!response) {
            throw lastError || new Error('All endpoints failed');
          }

          if ((response as any).success) {
            if ((response as any).subscription) {
              cachedSubscription = (response as any).subscription;
              cachedPermissions = (response as any).subscription.plan.permissions;
              setSubscription(cachedSubscription);
              setPermissions(cachedPermissions);
              lastLoadTime = Date.now();
            } else {
              cachedPermissions = null;
              cachedSubscription = null;
              setPermissions(null);
              setSubscription(null);
              lastLoadTime = Date.now();
            }
          } else {
            cachedPermissions = null;
            cachedSubscription = null;
            setPermissions(null);
            setSubscription(null);
            lastLoadTime = Date.now();
          }
        } finally {
          loadingPromise = null;
        }
      })();
      
      await loadingPromise;
    } catch (err: any) {
      console.error('Error loading permissions:', err);
      setError(err.message);
      setPermissions(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

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

  const canManageCustomers = (): boolean => {
    return hasPermission('canManageCustomers');
  };

  const canMarketServices = (): boolean => {
    return hasPermission('canMarketServices');
  };

  const getWhatsAppMessagesLimit = (): number => {
    return permissions?.whatsappMessagesPerMonth || 0;
  };

  const getMonthlyPostsLimit = (): number => {
    return permissions?.monthlyPosts || 0;
  };

  const getMaxServices = (): number => {
    return permissions?.maxServices || 0;
  };

  const canManageEmployees = (): boolean => {
    return Boolean(permissions?.canManageEmployees);
  };

  const getMaxEmployees = (): number => {
    return permissions?.maxEmployees || 0;
  };

  const canUseAI = (): boolean => {
    return Boolean(permissions?.canUseAI);
  };

  const getAICredits = (): number => {
    return permissions?.aiCredits || 0;
  };

  const canUseLiveChat = (): boolean => {
    return Boolean(permissions?.canUseLiveChat);
  };

  const hasActiveSubscription = useMemo((): boolean => {
    // إذا لم يكن هناك subscription object ولكن هناك permissions، فهو موظف
    // الموظف يعتبر لديه اشتراك نشط (موروث من المالك)
    if (permissions && !subscription) {
      console.log('Employee has active subscription (inherited from owner)');
      return true;
    }
    
    // للمالك، يتحقق من الـ subscription
    const isActive = Boolean(subscription?.status === 'active' && 
           subscription?.expiresAt && 
           new Date(subscription.expiresAt) > new Date());
    console.log('Owner subscription status:', isActive, subscription);
    return isActive;
  }, [subscription, permissions]);

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
    canManageCustomers,
    canMarketServices,
    canManageEmployees,
    getWhatsAppMessagesLimit,
    getMonthlyPostsLimit,
    getMaxServices,
    getMaxEmployees,
    canUseAI,
    getAICredits,
    canUseLiveChat,
    hasActiveSubscription,
    reloadPermissions: loadPermissions
  };
}
