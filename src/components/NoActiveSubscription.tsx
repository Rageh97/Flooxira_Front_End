"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";

interface NoActiveSubscriptionProps {
  heading: string;
  featureName?: string;
  description?: string;
  className?: string;
  cardClassName?: string;
  cardTitle?: string;
}

export default function NoActiveSubscription({
  heading,
  featureName,
  description,
  className,
  cardClassName,
  cardTitle,
}: NoActiveSubscriptionProps) {
  const { user } = useAuth();
  const { hasActiveSubscription } = usePermissions();
  const isEmployee = user?.role === 'employee';

  return (
    <div className={className ? className : "space-y-8"}>
      {heading && <h1 className="text-2xl font-semibold text-white">{heading}</h1>}
      <Card className={cardClassName ? cardClassName : "bg-card border-none"}>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">{cardTitle || "لا يوجد اشتراك نشط"}</h3>
          <p className="text-gray-400 mb-4">
            {isEmployee 
              ? (hasActiveSubscription 
                  ? (description || "ليس لديك صلاحية للوصول إلى هذه الميزة. يرجى مراجعة مسؤول النظام.")
                  : "انتهت صلاحية اشتراك مالك الحساب. يرجى التواصل مع المدير لتجديد الاشتراك.")
              : (description
                ? description
                : featureName
                ? `تحتاج إلى اشتراك نشط للوصول إلى ${featureName}`
                : "تحتاج إلى اشتراك نشط للوصول إلى هذه الميزة")}
          </p>
          {!isEmployee && (
            <Button onClick={() => (window.location.href = "/plans")} className="bg-green-600 hover:bg-green-700">
              {cardTitle ? "ترقية الباقة" : "تصفح الباقات"}
            </Button>
          )}
          {isEmployee && (
            <div className="text-yellow-500 font-medium">
              يرجى مراجعة مسؤول النظام
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
