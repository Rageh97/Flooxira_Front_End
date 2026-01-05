"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getRevenue } from "@/lib/api";

type RevenueData = {
  revenue: {
    total: number;
    currentMonth: number;
    totalFormatted: string;
    currentMonthFormatted: string;
  };
  stats: {
    totalSubscriptions: number;
    currentMonthSubscriptions: number;
    activeSubscriptions: number;
  };
  currentMonth: {
    month: number;
    year: number;
    name: string;
  };
};

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    getRevenue(token)
      .then((res) => {
        if (res.success) {
          setData({
            revenue: res.revenue,
            stats: res.stats,
            currentMonth: res.currentMonth
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-gray-300">جاري تحميل بيانات الإيرادات...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-red-400">خطأ: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-gray-300">لا توجد بيانات متاحة</p>
        </CardContent>
      </Card>
    );
  }

  // Helper function to format price without unnecessary zeros
  const formatPrice = (price: number): string => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  const totalRevenue = formatPrice(data.revenue.total);
  const currentMonthRevenue = formatPrice(data.revenue.currentMonth);
  const averageSubscriptionValue = data.stats.totalSubscriptions > 0 
    ? formatPrice(data.revenue.total / data.stats.totalSubscriptions)
    : '0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">الإيرادات</h2>
        <p className="text-sm text-gray-400">عرض الإيرادات الكلية والشهرية</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Revenue */}
        <Card className="gradient-border">
          <CardHeader className="border-b border-purple-500/20">
            <h3 className="text-lg font-semibold text-white">الإيرادات الكلية</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-white">
                {totalRevenue} ر.س
              </p>
              <p className="text-sm text-gray-400">
                من {data.stats.totalSubscriptions} اشتراك
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Month Revenue */}
        <Card className="gradient-border">
          <CardHeader className="border-b border-green-500/20">
            <h3 className="text-lg font-semibold text-white">إيرادات {data.currentMonth.name}</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-white">
                {currentMonthRevenue} ر.س
              </p>
              <p className="text-sm text-gray-400">
                من {data.stats.currentMonthSubscriptions} اشتراك جديد
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Subscriptions */}
        <Card className="bg-card border-none">
          <CardHeader className="border-b border-gray-700">
            <h3 className="text-base font-semibold text-white">إجمالي الاشتراكات</h3>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-white">{data.stats.totalSubscriptions}</p>
            <p className="text-sm text-gray-400 mt-1">اشتراك</p>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="bg-card border-none">
          <CardHeader className="border-b border-gray-700">
            <h3 className="text-base font-semibold text-white">الاشتراكات النشطة</h3>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-green-400">{data.stats.activeSubscriptions}</p>
            <p className="text-sm text-gray-400 mt-1">اشتراك نشط</p>
          </CardContent>
        </Card>

        {/* Current Month Subscriptions */}
        <Card className="bg-card border-none">
          <CardHeader className="border-b border-gray-700">
            <h3 className="text-base font-semibold text-white">اشتراكات الشهر الحالي</h3>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-blue-400">{data.stats.currentMonthSubscriptions}</p>
            <p className="text-sm text-gray-400 mt-1">اشتراك جديد</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card className="bg-card border-none">
        <CardHeader className="border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">تفاصيل الإيرادات</h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">الإيرادات الكلية</p>
                <p className="text-xl font-bold text-white">{totalRevenue} ر.س</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">عدد الاشتراكات</p>
                <p className="text-xl font-bold text-white">{data.stats.totalSubscriptions}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">إيرادات الشهر الحالي</p>
                <p className="text-xl font-bold text-white">{currentMonthRevenue} ر.س</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">اشتراكات جديدة</p>
                <p className="text-xl font-bold text-white">{data.stats.currentMonthSubscriptions}</p>
              </div>
            </div>
{/* 
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">متوسط قيمة الاشتراك</p>
                <p className="text-xl font-bold text-white">
                  {averageSubscriptionValue} ر.س
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">الاشتراكات النشطة</p>
                <p className="text-xl font-bold text-green-400">{data.stats.activeSubscriptions}</p>
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
