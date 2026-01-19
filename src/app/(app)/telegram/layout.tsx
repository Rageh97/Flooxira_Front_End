"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect } from "react";
import { clsx } from "clsx";
import { usePermissions } from "@/lib/permissions";
import NoActiveSubscription from "@/components/NoActiveSubscription";
import { useToast } from "@/components/ui/toast-provider";

const telegramTabs = [
  { href: "/telegram", label: "الاتصال", exact: true },
  // { href: "/telegram/chat-management", label: "إدارة المحادثات" },
  // { href: "/telegram/admin-tools", label: "أدوات الإدارة" },
  // { href: "/telegram/groups", label: "المجموعات" },
  { href: "/telegram/chats", label: "سجل المحادثات" },
  { href: "/telegram/campaigns", label: "الحملات" },
  // { href: "/telegram/tags", label: "العلامات" },
  { href: "/telegram-templates", label: "القوالب" },
];

export default function TelegramLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { hasActiveSubscription, canManageTelegram, loading: permissionsLoading } = usePermissions();
  const { showError } = useToast();
  
  useEffect(() => {
    if (!permissionsLoading && !hasActiveSubscription) {
      showError("لا يوجد اشتراك نشط");
    }
  }, [hasActiveSubscription, permissionsLoading]);

  // Loading state
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-3">جاري التحقق من الصلاحيات...</span>
      </div>
    );
  }

  // Check if user has Telegram management permission
  if (hasActiveSubscription && !canManageTelegram()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6 text-white text-right">إدارة التليجرام</h1>
        <NoActiveSubscription 
          heading=""
          cardTitle="ليس لديك صلاحية إدارة التليجرام"
          description="باقتك الحالية أو صلاحياتك لا تشمل إدارة التليجرام"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={!hasActiveSubscription ? "opacity-50 pointer-events-none select-none grayscale-[0.5] space-y-6" : "space-y-6"}>
      {/* Header */}
      {/* <div className="bg-semidark-custom border border-gray-700 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">إدارة التليجرام</h1>
        <p className="text-gray-300">إدارة البوتات والقوالب التفاعلية للتيليجرام</p>
      </div> */}

      {/* Telegram Tabs */}
      <div className="bg-secondry inner-shadow rounded-lg p-1 sm:p-2">
        <div className="relative">
          <div className="flex overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <div className="flex gap-2 px-1 sm:px-2">
              {telegramTabs.map((tab) => {
                const isActive = tab.exact 
                  ? pathname === tab.href 
                  : pathname.startsWith(tab.href);
                
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={clsx(
                      "whitespace-nowrap px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1 sm:gap-2 flex-shrink-0",
                      isActive
                        ? "gradient-border text-white shadow-md"
                        : "text-gray-300 hover:text-white hover:bg-blue-500 hover:scale-105"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
          {/* Scroll indicators */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-secondry to-transparent pointer-events-none"></div>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-secondry to-transparent pointer-events-none"></div>
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


