"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { clsx } from "clsx";
import { AlertCircle, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/lib/permissions";
import NoActiveSubscription from "@/components/NoActiveSubscription";
import { useToast } from "@/components/ui/toast-provider";


const whatsappTabs = [
  { href: "/whatsapp", label: "الاتصال", exact: true },
  { href: "/whatsapp/ai-settings", label: "إعدادات  البوت" },
  { href: "/whatsapp/bot-content", label: "محتوى البوت" },
  // { href: "/whatsapp/appointments", label: "إدارة المواعيد" },
  // { href: "/whatsapp/appointments/settings", label: "إعدادات المواعيد" },
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
  const { showError } = useToast();

  

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
  useEffect(() => {
    if (!permissionsLoading && !hasActiveSubscription) {
      showError("لا يوجد اشتراك نشط");
    }
  }, [hasActiveSubscription, permissionsLoading]);
  // Check permissions loading state
  if (permissionsLoading || checkingMessages) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }



  // Check if user has WhatsApp management permission
  if (hasActiveSubscription && !canManageWhatsApp()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6 text-white text-right">إدارة الواتساب</h1>
        <NoActiveSubscription 
          heading=""
          cardTitle="ليس لديك صلاحية إدارة الواتساب"
          description="باقتك الحالية أو صلاحياتك لا تشمل إدارة الواتساب"
        />
      </div>
    );
  }

  // Check if messages have run out
  if (hasActiveSubscription && messagesRemaining === 0) {
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
    <div className="space-y-2">
      {/* {!hasActiveSubscription && (
        <NoActiveSubscription 
          heading="إدارة الواتساب"
          featureName="إدارة الواتساب"
          className="container mx-auto p-6"
        />
      )} */}
      <div className={!hasActiveSubscription ? "opacity-50 pointer-events-none select-none grayscale-[0.5] space-y-3" : "space-y-3"}>
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
      <div className="gradient-border rounded-lg p-1 sm:p-2">
        <div className="relative">
          <div className="flex overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <div className="flex space-x-1 sm:space-x-2 px-1 sm:px-2">
              {whatsappTabs.map((tab) => {
                const isActive = tab.exact 
                  ? pathname === tab.href 
                  : pathname.startsWith(tab.href);
                
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={clsx(
                      "whitespace-nowrap px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors",
                      "flex-shrink-0",
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
          {/* Scroll indicators */}
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-secondry to-transparent pointer-events-none"></div>
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-secondry to-transparent pointer-events-none"></div>
        </div>
        <style jsx>{`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>

      {/* Page Content */}
      <div>
        {children}
      </div>
      </div>
    </div>
  );
}