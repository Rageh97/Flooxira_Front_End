"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Users,
  BarChart3,
  Settings,
  Crown,
  Zap
} from "lucide-react";
import NoActiveSubscription from "@/components/NoActiveSubscription";

interface UserPermissions {
  // المنصات الاجتماعية المسموحة
  platforms: string[];
  
  // عدد المنشورات الشهرية
  monthlyPosts: number;
  
  // إدارة الواتساب والتليجرام
  canManageWhatsApp: boolean;
  whatsappMessagesPerMonth: number;
  canManageTelegram: boolean;
  
  // تكامل سلة
  canSallaIntegration: boolean;
  
  // إدارة المحتوى
  canManageContent: boolean;
  
  // تسويق الخدمات
  canMarketServices: boolean;
  maxServices: number;
  
  // إدارة العملاء
  canManageCustomers: boolean;
  
  // إدارة الموظفين
  canManageEmployees: boolean;
  maxEmployees: number;
  
  // ميزات الذكاء الاصطناعي
  canUseAI: boolean;
  aiCredits: number;
  
  // Live Chat & Tickets
  canUseLiveChat: boolean;
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

export default function MySubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    loadSubscription();
  }, [token]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/subscription-requests/my-subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubscription(result.subscription);
      } else {
        setError(result.message || 'فشل في تحميل معلومات الاشتراك');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'expired': return 'منتهي';
      case 'cancelled': return 'ملغي';
      default: return 'غير معروف';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return '';
      case 'instagram': return '';
      case 'twitter': return '';
      case 'linkedin': return '';
      case 'youtube': return '';
      case 'tiktok': return '';
      case 'pinterest': return '';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">اشتراكي</h1>
          <p className="text-sm text-gray-300">معلومات اشتراكك وصلاحياتك</p>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">اشتراكي</h1>
          <p className="text-sm text-gray-300">معلومات اشتراكك وصلاحياتك</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">خطأ في التحميل</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadSubscription} className="bg-green-600 hover:bg-green-700">
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return (
      <NoActiveSubscription 
        heading="اشتراكي"
        description="ليس لديك اشتراك نشط حالياً"
        className="space-y-8"
      />
    );
  }

  const permissions = subscription.plan.permissions;
  const daysRemaining = getDaysRemaining(subscription.expiresAt);

  return (
    <div className="space-y-8">
      <div>
        {/* <h1 className="text-2xl font-semibold text-white">اشتراكي</h1> */}
        <p className="text-2xl font-bold text-white">معلومات اشتراكك وصلاحياتك</p>
      </div>

      {/* Subscription Overview */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Crown className="h-5 w-5 text-primary" />
            معلومات الاشتراك
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
            <div>
              <h3 className="font-semibold text-white mb-3">تفاصيل الباقة</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">اسم الباقة:</span>
                  <span className="font-medium text-white">{subscription.plan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">الحالة:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-black ${getStatusColor(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">تاريخ البداية:</span>
                  <span className="text-white">{formatDate(subscription.startedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">تاريخ الانتهاء:</span>
                  <span className="text-white">{formatDate(subscription.expiresAt)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">مدة الاشتراك</h3>
              <div className="bg-fixed-40 border-primary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-white" />
                  <span className="font-medium text-white">
                    {daysRemaining > 0 ? `${daysRemaining} يوم متبقي` : 'انتهت صلاحية الاشتراك'}
                  </span>
                </div>
                {daysRemaining > 0 && (
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, (daysRemaining / 30) * 100))}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-primary" />
            صلاحياتك المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#01191040] text-white border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-md font-medium text-white uppercase tracking-wider">
                    الفئة
                  </th>
                  <th className="px-4 py-3 text-right text-md font-medium text-white uppercase tracking-wider">
                    الميزة
                  </th>
                  <th className="px-4 py-3 text-right text-md font-medium text-white uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right text-md font-medium text-white uppercase tracking-wider">
                    الحد المسموح
                  </th>
                </tr>
              </thead>
              <tbody className="bg-light-custom/80 divide-y divide-green-200">
                {/* Social Media Platforms */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-md font-medium text-white" rowSpan={permissions.platforms?.length || 1}>
                     المنصات الاجتماعية
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-md text-white">
                    المنصات المسموحة
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.platforms && permissions.platforms.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {permissions.platforms.map((platform, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {getPlatformIcon(platform)} {platform}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-md text-white">
                    {permissions.platforms?.length || 0} منصة
                  </td>
                </tr>

                {/* Monthly Posts */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-md font-medium text-white">
                     المنشورات الشهرية
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-md text-white">
                    عدد المنشورات المسموح شهرياً
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.monthlyPosts > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-md text-white">
                    {permissions.monthlyPosts === -1 ? 'غير محدود' : `${permissions.monthlyPosts || 0} منشور/شهر`}
                  </td>
                </tr>

                {/* WhatsApp Management */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-md font-medium text-white">
                     إدارة الواتساب
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-md text-white">
                    إدارة الواتساب والرسائل
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.canManageWhatsApp ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-md text-white">
                    {permissions.canManageWhatsApp ? `${permissions.whatsappMessagesPerMonth === -1 ? 'غير محدود' : permissions.whatsappMessagesPerMonth || 0} رسالة/شهر` : '-'}
                  </td>
                </tr>

                {/* Telegram Management */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                     إدارة التليجرام
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    إدارة التليجرام والرسائل
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.canManageTelegram ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    -
                  </td>
                </tr>

                {/* Salla Integration */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                     تكامل سلة
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    تكامل مع منصة سلة للتجارة الإلكترونية
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.canSallaIntegration ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    -
                  </td>
                </tr>

                {/* Content Management */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                     إدارة المحتوى
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    إدارة المحتوى والمنشورات
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.canManageContent ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    -
                  </td>
                </tr>

                {/* Service Marketing */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                     تسويق الخدمات
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    تسويق وعرض الخدمات على المنصة
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.canMarketServices ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    {permissions.canMarketServices ? (
                      permissions.maxServices === -1 ? 'غير محدود' : `${permissions.maxServices || 0} خدمة`
                    ) : '-'}
                  </td>
                </tr>

                {/* Customer Management */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                     إدارة العملاء
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    إدارة قاعدة بيانات العملاء والمتابعة
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.canManageCustomers ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    {permissions.canManageCustomers ? 'غير محدود' : '-'}
                  </td>
                </tr>

                {/* Employee Management */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                     إدارة الموظفين
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    إضافة وإدارة الموظفين وصلاحياتهم
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.canManageEmployees ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    {permissions.canManageEmployees ? (
                      permissions.maxEmployees === 0 ? 'غير محدود' : `${permissions.maxEmployees || 0} موظف`
                    ) : '-'}
                  </td>
                </tr>

                {/* AI Features */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                    الذكاء الاصطناعي
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    استخدام AI لإنشاء المحتوى (Ask AI)
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.canUseAI ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    {permissions.canUseAI ? (
                      permissions.aiCredits === 0 ? 'غير محدود' : `${permissions.aiCredits || 0} كريديت/شهر`
                    ) : '-'}
                  </td>
                </tr>

                {/* Live Chat & Tickets */}
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                     Live Chat & Tickets
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    نظام الدردشة المباشرة وإدارة التذاكر
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {permissions.canUseLiveChat ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        غير متاح
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                    {permissions.canUseLiveChat
                      ? (permissions.liveChatAiResponses && permissions.liveChatAiResponses > 0
                          ? `${permissions.liveChatAiResponses} رد/شهر`
                          : 'غير محدود')
                      : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {/* <div className="flex gap-4">
        <Button 
          onClick={() => window.location.href = '/plans'}
          className="bg-green-600 hover:bg-green-700"
        >
          ترقية الباقة
        </Button>
        <Button 
          onClick={() => window.location.href = '/my-subscription-requests'}
          variant="secondary"
        >
          طلبات الاشتراك
        </Button>
      </div> */}
    </div>
  );
}
