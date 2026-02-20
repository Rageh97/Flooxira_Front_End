"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getAllSubscriptions, updateSubscriptionExpiry, getConnectedWhatsAppUsers } from "@/lib/api";
import { Users, Calendar, DollarSign, Edit, Download, UserCheck, UserMinus, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";

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
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);

  // Edit expiry date modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    Promise.all([
      getAllSubscriptions(token, currentPage, subscriptionsPerPage, filter),
      getConnectedWhatsAppUsers(token)
    ])
      .then(([res, connectedRes]) => {
        setSubscriptions(res.subscriptions);
        setTotalPages(res.totalPages || 1);
        setTotalSubscriptions(res.total || 0);
        if (connectedRes.success) {
          setConnectedUsers(connectedRes.users);
        }
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiresAt);
    const expiryDateOnly = new Date(expiry);
    expiryDateOnly.setHours(0, 0, 0, 0);

    const diffTime = expiryDateOnly.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleEditExpiry = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm) using local timezone
    const expiryDate = new Date(subscription.expiresAt);
    const offset = expiryDate.getTimezoneOffset() * 60000;
    const localDate = new Date(expiryDate.getTime() - offset);
    const formattedDate = localDate.toISOString().slice(0, 16);
    setNewExpiryDate(formattedDate);
    setIsEditModalOpen(true);
  };

  const handleUpdateExpiry = async () => {
    if (!selectedSubscription || !newExpiryDate || !token) return;

    setIsUpdating(true);
    try {
      await updateSubscriptionExpiry(token, selectedSubscription.id, newExpiryDate);
      
      // Refresh subscriptions list
      const res = await getAllSubscriptions(token, currentPage, subscriptionsPerPage, filter);
      setSubscriptions(res.subscriptions);
      setTotalPages(res.totalPages || 1);
      setTotalSubscriptions(res.total || 0);
      
      setIsEditModalOpen(false);
      setSelectedSubscription(null);
      setNewExpiryDate("");
    } catch (error: any) {
      alert(`خطأ في تحديث تاريخ الانتهاء: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportSubscriptions = async () => {
    if (!token) return;
    
    try {
      setIsExporting(true);
      // Fetch all subscriptions based on current filter with a large limit
      const response = await getAllSubscriptions(token, 1, 100000, filter);
      
      if (!response.success) {
        toast.error('فشل في جلب الاشتراكات للتصدير');
        return;
      }

      const allSubs = response.subscriptions;
      
      // Filter subs with user phone numbers and format data for Excel
      const exportData = allSubs
        .filter(sub => sub.user && sub.user.phone)
        .map(sub => ({
          'رقم الهاتف': sub.user.phone
        }));

      if (exportData.length === 0) {
        toast.error('لا توجد اشتراكات بأرقام هواتف للتصدير حسب الفلتر الحالي');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      
      // Dynamic sheet name based on filter
      let sheetName = 'الاشتراكات';
      if (filter === 'expired') sheetName = 'المنتهية';
      else if (filter === 'active') sheetName = 'النشطة';
      else if (filter === 'cancelled') sheetName = 'الملغية';
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filenameFilter = filter === 'all' ? 'subscriptions' : `subscriptions_${filter}`;
      XLSX.writeFile(workbook, `${filenameFilter}_phones_${timestamp}.xlsx`);
      
      toast.success(`تم تصدير ${exportData.length} رقم بنجاح`);
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredSubscriptions = subscriptions;

  const getConnectedData = (userId: number) => {
    return connectedUsers.find(cu => cu.id === userId);
  };

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
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportSubscriptions} 
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'جاري التصدير...' : `تصدير ${filter === 'expired' ? 'المنتهين' : 'القائمة'}`}
          </Button>
          <div className="text-sm text-gray-300">
            إجمالي المشتركين: {subscriptions.length}
          </div>
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
                    <th className="py-3 px-4 font-medium text-white">حالة الواتساب</th>
                    <th className="py-3 px-4 font-medium text-white">استهلاك AI</th>
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
                          <div className="flex justify-center">
                            {(() => {
                              const cu = getConnectedData(subscription.userId);
                              if (!cu) return <span className="text-gray-500 text-xs">غير مسجل</span>;
                              
                              return (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="text-[10px] text-gray-400 font-mono">{cu.whatsappName || '---'}</div>
                                  {cu.status === 'connected' ? (
                                    <Badge className="bg-green-100 text-green-800 border-none flex items-center gap-1">
                                      <UserCheck className="w-3 h-3" />
                                      متصل
                                    </Badge>
                                  ) : cu.status === 'initializing' ? (
                                    <Badge className="bg-blue-100 text-blue-800 border-none flex items-center gap-1">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      جاري...
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800 border-none flex items-center gap-1">
                                      <UserMinus className="w-3 h-3" />
                                      غير متصل
                                    </Badge>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            {(() => {
                              const cu = getConnectedData(subscription.userId);
                              return (
                                <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                                  {(cu?.aiCreditsUsed || 0)} كريديت
                                </Badge>
                              );
                            })()}
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
                          <button
                            onClick={() => handleEditExpiry(subscription)}
                            className="flex items-center justify-center space-x-1 rtl:space-x-reverse hover:bg-gray-700/30 rounded px-2 py-1 transition-colors group w-full"
                          >
                            <Calendar className="w-4 h-4 text-orange-400" />
                            <span className="text-sm text-gray-300">
                              {formatDate(subscription.expiresAt)}
                            </span>
                            <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
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

      {/* Edit Expiry Date Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">تعديل تاريخ الانتهاء</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSubscription && (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">المستخدم:</span> {selectedSubscription.user.name || selectedSubscription.user.email}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">الباقة:</span> {selectedSubscription.plan.name}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">تاريخ الانتهاء الحالي:</span> {formatDate(selectedSubscription.expiresAt)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="newExpiryDate" className="text-sm font-medium text-white">
                    تاريخ الانتهاء الجديد
                  </label>
                  <input
                    id="newExpiryDate"
                    type="datetime-local"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleUpdateExpiry}
              disabled={isUpdating || !newExpiryDate}
            >
              {isUpdating ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
