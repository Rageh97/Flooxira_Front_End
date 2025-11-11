"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { clsx } from "clsx";
import { AlertCircle, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/lib/permissions";

const whatsappTabs = [
  { href: "/whatsapp", label: "الاتصال", exact: true },
  { href: "/whatsapp/ai-settings", label: "إعدادات الذكاء الاصطناعي" },
  { href: "/whatsapp/bot-content", label: "محتوى البوت" },
  { href: "/whatsapp/appointments", label: "إدارة المواعيد" },
  { href: "/whatsapp/appointments/settings", label: "إعدادات المواعيد" },
  { href: "/whatsapp/settings", label: " أوقات عمل البوت" },
  { href: "/whatsapp/chats", label: "المحادثات" },
  { href: "/whatsapp/groups", label: "المجموعات" },
  { href: "/whatsapp/campaigns", label: "الحملات الاعلانية" },
  { href: "/whatsapp/tags", label: "التصنيفات" },
  { href: "/whatsapp/stats", label: "الإحصائيات" },
  // { href: "/whatsapp-templates", label: "القوالب" },
];

export default function WhatsAppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { canManageWhatsApp, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
  const [messagesRemaining, setMessagesRemaining] = useState(0);
  const [checkingMessages, setCheckingMessages] = useState(true);

  useEffect(() => {
    checkMessagesRemaining();
  }, []);

  const checkMessagesRemaining = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/billing/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[WhatsApp Layout] Full response:', data);
        
        const whatsappStats = data.data?.messageUsage?.find((m: any) => m.platform === 'whatsapp');
        const limit = data.data?.limits?.whatsappMessagesPerMonth || 0;
        const used = whatsappStats?.count || 0;
        const remaining = Math.max(0, limit - used);
        
        console.log('[WhatsApp Layout] Limit:', limit);
        console.log('[WhatsApp Layout] Used:', used);
        console.log('[WhatsApp Layout] Remaining:', remaining);
        console.log('[WhatsApp Layout] Stats:', whatsappStats);
        
        // If limit is 0 or undefined, set a default limit
        if (limit === 0 || !limit) {
          console.log('[WhatsApp Layout] No limit set, using default');
          setMessagesRemaining(30); // Default limit
        } else {
          setMessagesRemaining(remaining);
        }
        setCheckingMessages(false);
      } else {
        console.error('[WhatsApp Layout] Response not OK:', response.status);
        // Set default values if API fails
        setMessagesRemaining(30); // Default limit instead of 0
        setCheckingMessages(false);
      }
    } catch (error) {
      console.error('Error checking messages:', error);
      // Set default limit if there's an error
      setMessagesRemaining(30);
    } finally {
      setCheckingMessages(false);
    }
  };

  // Check permissions loading state
  if (permissionsLoading || checkingMessages) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has active subscription
  if (!hasActiveSubscription) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">إدارة الواتساب</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا يوجد اشتراك نشط</h3>
            <p className="text-gray-600 mb-4">تحتاج إلى اشتراك نشط للوصول إلى إدارة الواتساب</p>
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              تصفح الباقات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has WhatsApp management permission
  if (!canManageWhatsApp()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">إدارة الواتساب</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ليس لديك صلاحية إدارة الواتساب</h3>
            <p className="text-gray-600 mb-4">باقتك الحالية لا تشمل إدارة الواتساب</p>
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              ترقية الباقة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if messages have run out
  if (messagesRemaining === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-900 mb-2">انتهى اشتراك رسائل الواتساب</h2>
              <p className="text-red-700 mb-6">
                لقد استخدمت جميع رسائل الواتساب المتاحة في باقتك الحالية.
                <br />
                يرجى ترقية باقتك أو الاتصال بالدعم لإضافة المزيد من الرسائل.
              </p>
              <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">عدد الرسائل المتبقية: 0</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/plans'}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                ترقية الباقة
              </Button>
              <Button 
                variant="secondary"
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                العودة للوحة التحكم
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning banner if messages are running low */}
      {messagesRemaining > 0 && messagesRemaining <= 10 && (
        <Card className="bg-card border-none">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-yellow-300">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">
                تحذير: لديك {messagesRemaining} رسالة متبقية فقط في باقتك
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Tabs */}
      <div className="bg-secondry inner-shadow rounded-lg p-4">
        <div className="flex justify-center items-center flex-wrap gap-2">
          {whatsappTabs.map((tab) => {
            const isActive = tab.exact 
              ? pathname === tab.href 
              : pathname.startsWith(tab.href);
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "gradient-border text-white"
                    : "text-gray-300 hover:text-white hover:bg-blue-700"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <div>
        {children}
      </div>
    </div>
  );
}