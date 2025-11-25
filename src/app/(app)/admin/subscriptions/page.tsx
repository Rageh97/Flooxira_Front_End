"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllSubscriptions } from "@/lib/api";
import { Users, Calendar, DollarSign } from "lucide-react";

type Subscription = {
  id: number;
  userId: number;
  planId: number;
  status: 'active' | 'expired' | 'cancelled';
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name?: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
  plan: {
    id: number;
    name: string;
    priceCents: number;
    interval: 'monthly' | 'yearly';
    features: any;
    permissions: any;
  };
};

export default function SubscriptionsAdminPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState<number>(0);
  const subscriptionsPerPage = 10;

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    getAllSubscriptions(token, currentPage, subscriptionsPerPage, filter)
      .then((res) => {
        setSubscriptions(res.subscriptions);
        setTotalPages(res.totalPages || 1);
        setTotalSubscriptions(res.total || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, currentPage, filter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (priceCents: number) => {
    return priceCents.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'expired':
        return 'منتهي';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredSubscriptions = subscriptions;

  const stats = {
    total: totalSubscriptions, // Use total from API response if available, otherwise subscriptions.length is wrong for pagination
    // Note: These stats are currently only accurate for the current page/filter. 
    // To get accurate global stats, we would need a separate API endpoint.
    // For now, we'll just use the current list counts which is better than nothing, 
    // but ideally this should be fixed in the future.
    active: subscriptions.filter(sub => sub.status === 'active' && getDaysUntilExpiry(sub.expiresAt) > 0).length,
    expired: subscriptions.filter(sub => sub.status === 'expired' || (sub.status === 'active' && getDaysUntilExpiry(sub.expiresAt) <= 0)).length,
    cancelled: subscriptions.filter(sub => sub.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-gray-300">جاري تحميل المشتركين...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2 rtl:space-x-reverse">
          <Users className="w-6 h-6" />
          <span>إدارة المشتركين</span>
        </h1>
        <div className="text-sm text-gray-300">
          إجمالي المشتركين: {subscriptions.length}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-300">إجمالي المشتركين</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-300">نشط</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-300">منتهي </p>
                <p className="text-2xl font-bold text-white">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-300">ملغي</p>
                <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="bg-card border-none">
        <CardContent className="p-4">
          <div className="flex space-x-2 rtl:space-x-reverse">
            {[
              { key: 'all', label: 'الكل', count: stats.total },
              { key: 'active', label: 'نشط', count: stats.active },
              { key: 'expired', label: 'منتهي ', count: stats.expired },
              { key: 'cancelled', label: 'ملغي', count: stats.cancelled },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold">قائمة المشتركين</h3>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-8">
              لا توجد اشتراكات {filter !== 'all' ? `بالحالة "${getStatusText(filter)}"` : ''}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="text-center">
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4 font-medium text-white">المستخدم</th>
                    <th className="py-3 px-4 font-medium text-white">الباقة</th>
                    <th className="py-3 px-4 font-medium text-white">السعر</th>
                    <th className="py-3 px-4 font-medium text-white">الحالة</th>
                    <th className="py-3 px-4 font-medium text-white">تاريخ البداية</th>
                    <th className="py-3 px-4 font-medium text-white">تاريخ الانتهاء</th>
                    <th className="py-3 px-4 font-medium text-white">الأيام المتبقية</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {filteredSubscriptions.map((subscription) => {
                    const daysLeft = getDaysUntilExpiry(subscription.expiresAt);
                    const isExpired = daysLeft <= 0;
                    const displayStatus = isExpired && subscription.status === 'active' ? 'expired' : subscription.status;

                    return (
                      <tr key={subscription.id} className="border-b border-gray-600 hover:bg-gray-700/30">
                        <td className="py-3 px-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-white">
                              {subscription.user.name || 'لا يوجد اسم'}
                            </p>
                            <p className="text-xs text-gray-300">{subscription.user.email}</p>
                            <p className="text-xs text-gray-400">
                              {subscription.user.phone || 'لا يوجد هاتف'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-white">{subscription.plan.name}</p>
                            <p className="text-xs text-gray-300">
                              {subscription.plan.interval === 'monthly' ? 'شهري' : 'سنوي'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium text-white">
                              {formatPrice(subscription.plan.priceCents)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            <Badge className={getStatusColor(displayStatus)}>
                              {getStatusText(displayStatus)}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-gray-300">
                              {formatDate(subscription.startedAt)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
                            <Calendar className="w-4 h-4 text-orange-400" />
                            <span className="text-sm text-gray-300">
                              {formatDate(subscription.expiresAt)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-medium ${
                            daysLeft > 7 ? 'text-green-400' : 
                            daysLeft > 0 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="bg-card border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                عرض {((currentPage - 1) * subscriptionsPerPage) + 1} - {Math.min(currentPage * subscriptionsPerPage, totalSubscriptions)} من {totalSubscriptions} اشتراك
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
