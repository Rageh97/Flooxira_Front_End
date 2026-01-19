"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface PermissionDeniedProps {
  title?: string;
  message?: string;
  featureName: string;
}

export default function PermissionDenied({
  title = "ليس لديك صلاحية",
  message,
  featureName
}: PermissionDeniedProps) {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">{featureName}</h1>
      <Card className="bg-card border-none">
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-4">
            {message || (isEmployee 
              ? `ليس لديك صلاحية الوصول إلى ${featureName}. يرجى التواصل مع المدير لتفعيل هذه الصلاحية لك.`
              : `باقتك الحالية لا تشمل ${featureName}. يمكنك الترقية للحصول على هذه الميزة.`)}
          </p>
          {!isEmployee ? (
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              ترقية الباقة
            </Button>
          ) : (
            <div className="text-yellow-500 font-medium font-bold">
              يرجى مراجعة مسؤول النظام لتعديل صلاحياتك
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
