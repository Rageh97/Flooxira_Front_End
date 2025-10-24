"use client";
import React, { useState, useEffect } from 'react';
import { getUsageStats, getAllUsageStats } from '@/lib/api';

interface UsageStatsProps {
  platform?: 'whatsapp' | 'telegram';
  
  showAll?: boolean;
  className?: string;
}

export default function UsageStats({ platform, showAll = false, className = '' }: UsageStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStats();
    
    // Refresh stats every minute
    const interval = setInterval(loadStats, 60000);
    
    return () => clearInterval(interval);
  }, [platform, showAll]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      let response;
      if (showAll) {
        response = await getAllUsageStats(token);
      } else if (platform) {
        response = await getUsageStats(token, platform);
      } else {
        return;
      }

      if (response.success) {
        const newStats = response.data;
        
        // Check for warnings and show toast notifications
        if (newStats.warning) {
          showToast(newStats.warning, 'warning');
        }
        
        if (showAll && newStats.warnings && newStats.warnings.length > 0) {
          newStats.warnings.forEach((warning: string) => {
            showToast(warning, 'warning');
          });
        }
        
        setStats(newStats);
      } else {
        setError('فشل في تحميل الإحصائيات');
      }
    } catch (err) {
      console.error('Error loading usage stats:', err);
      setError('خطأ في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'warning' | 'error' | 'success') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'warning' ? 'bg-yellow-100 border border-yellow-400 text-yellow-800' :
      type === 'error' ? 'bg-red-100 border border-red-400 text-red-800' :
      'bg-green-100 border border-green-400 text-green-800'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          ${type === 'warning' ? '⚠️' : type === 'error' ? '❌' : '✅'}
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-lg">&times;</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'تم الوصول للحد الأقصى';
    if (percentage >= 80) return 'قريب من الحد الأقصى';
    if (percentage >= 60) return 'استخدام متوسط';
    return 'استخدام منخفض';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-gray-300 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  if (!stats) return null;

  if (showAll && stats.whatsapp && stats.telegram) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* WhatsApp Stats */}
        {stats.limits.canManageWhatsApp && (
          <div className="gradient-border rounded-lg p-4 shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">عدد الرسائل المستخدمة</h3>
              <span className={`text-sm px-2 py-1 rounded ${
                stats.whatsapp.isAtLimit ? 'bg-red-100 text-red-800' :
                stats.whatsapp.isNearLimit ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {getStatusText(stats.whatsapp.percentage)}
              </span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-white mb-1">
                <span>{stats.whatsapp.used} / {stats.whatsapp.limit}</span>
                <span>{stats.whatsapp.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(stats.whatsapp.percentage)}`}
                  style={{ width: `${Math.min(stats.whatsapp.percentage, 100)}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-white">
              متبقي: {stats.whatsapp.remaining} رسالة
            </p>
          </div>
        )}

        {/* Telegram Stats */}
        {stats.limits.canManageTelegram && (
          <div className="gradient-border rounded-lg p-4 shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">Telegram</h3>
              <span className={`text-sm px-2 py-1 rounded ${
                stats.telegram.isAtLimit ? 'bg-red-100 text-red-800' :
                stats.telegram.isNearLimit ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {getStatusText(stats.telegram.percentage)}
              </span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{stats.telegram.used} / {stats.telegram.limit}</span>
                <span>{stats.telegram.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(stats.telegram.percentage)}`}
                  style={{ width: `${Math.min(stats.telegram.percentage, 100)}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              متبقي: {stats.telegram.remaining} رسالة
            </p>
          </div>
        )}

        {/* Warnings */}
        {stats.warnings && stats.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-medium text-yellow-800 mb-2">تحذيرات:</h4>
            {stats.warnings.map((warning: string, index: number) => (
              <p key={index} className="text-sm text-yellow-700">• {warning}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Single platform stats
  if (stats.usage) {
    return (
      <div className={`gradient-border rounded-lg p-5 shadow ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white capitalize">عدد الرسائل المستخدمة</h3>
          <span className={`text-sm px-2 py-1 rounded ${
            stats.usage.isAtLimit ? 'bg-red-100 text-red-800' :
            stats.usage.isNearLimit ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {getStatusText(stats.usage.percentage)}
          </span>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span className='text-primary'><span className='text-white'>{stats.usage.used}</span> / {stats.usage.limit}</span>
            <span className='text-white'>{stats.usage.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2  rounded-full ${getProgressColor(stats.usage.percentage)}`}
              style={{ width: `${Math.min(stats.usage.percentage, 100)}%` }}
            ></div>
          </div>
        </div>
        <p className="text-xs text-yellow-500">
          متبقي: {stats.usage.remaining} رسالة
        </p>
        {stats.warning && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            ⚠️ {stats.warning}
          </div>
        )}
      </div>
    );
  }

  return null;
}
