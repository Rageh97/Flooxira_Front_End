"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { clsx } from "clsx";
import AdminGuard from "@/components/AdminGuard";

const adminTabs = [
  { href: "/admin/users", label: "المستخدمين" },
  { href: "/admin/subscriptions", label: "المشتركين" },
  { href: "/admin/plans", label: "الباقات" },
  { href: "/admin/subscription-requests", label: "طلبات الاشتراك" },
  { href: "/admin/coupons", label: "إدارة القسائم" },
  { href: "/admin/tutorials", label: "الشروحات" },
  { href: "/admin/reviews", label: "التقييمات" },
  { href: "/admin/analytics", label: "التحليلات" },
];

export default function AdminLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">لوحة تحكم الإدارة</h1>
        <p className="text-sm text-gray-300">أدوات وإعدادات الإدارة.</p>
      </div>
      
      <div className="pt-2">
        <div className="mb-4 flex gap-2">
          {adminTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "rounded-md px-3 py-2 text-sm",
                pathname === tab.href 
                  ? "bg-light-custom text-white" 
                  : "bg-card hover:bg-light-custom text-white"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        
        <div>
          {children}
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}






