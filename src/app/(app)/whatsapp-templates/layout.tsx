"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { clsx } from "clsx";

const whatsappTabs = [
  { href: "/whatsapp", label: "Connection" },
  { href: "/whatsapp/chats", label: "Chats" },
  { href: "/whatsapp/campaigns", label: "Campaigns" },
  { href: "/whatsapp/groups", label: "Groups" },
  { href: "/whatsapp/stats", label: "Stats" },
  { href: "/whatsapp/bot-content", label: "Bot Content" },
  { href: "/whatsapp/ai-settings", label: "AI Settings" },
  { href: "/whatsapp/tags", label: "Tags" },
  { href: "/whatsapp-templates", label: "Templates", exact: true },
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
