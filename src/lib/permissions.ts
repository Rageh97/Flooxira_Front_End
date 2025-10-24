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

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setPermissions(null);
        setSubscription(null);
        return;
      }

      // Check if user is an employee first
      try {
        console.log('Checking if user is employee...');
        const employeeResponse = await apiFetch('/api/employees/me', { authToken: token });
        console.log('Employee response:', employeeResponse);
        if (employeeResponse.success) {
          // User is an employee - use employee permissions
          console.log('User is employee, permissions:', employeeResponse.employee.permissions);
          setPermissions(employeeResponse.employee.permissions);
          setSubscription(null); // Employees don't have subscriptions
          return;
        }
      } catch (error) {
        console.log('Not an employee, error:', error);
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

  const hasActiveSubscription = useMemo((): boolean => {
    // إذا كان موظف، يعتبر لديه اشتراك نشط (لأن المالك لديه اشتراك)
    if (permissions && !permissions.canManageEmployees) {
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
    hasActiveSubscription,
    reloadPermissions: loadPermissions
  };
}
