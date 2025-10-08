"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { clsx } from "clsx";

const whatsappTabs = [
  { href: "/whatsapp", label: "الاتصال" },
  { href: "/whatsapp/chats", label: "المحادثات" },
  { href: "/whatsapp/campaigns", label: "الحملات" },
  { href: "/whatsapp/groups", label: "المجموعات" },
  { href: "/whatsapp/stats", label: "الإحصائيات" },
  { href: "/whatsapp/bot-content", label: "محتوى البوت" },
  { href: "/whatsapp/ai-settings", label: "إعدادات الذكاء الاصطناعي" },
  { href: "/whatsapp/tags", label: "التصنيفات" },
  { href: "/whatsapp-templates", label: "القوالب", exact: true },
];

export default function WhatsAppTemplatesLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* WhatsApp Tabs */}
      <div className="bg-semidark-custom border border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
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
                    ? "bg-light-custom text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
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
