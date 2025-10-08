"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  getAllSubscriptionRequests, 
  updateSubscriptionRequestStatus,
  type SubscriptionRequest 
} from "@/lib/api";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User, 
  CreditCard,
  Calendar,
  FileText,
  Wallet,
  Gift
} from "lucide-react";

export default function SubscriptionRequestsAdminPage() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    loadRequests();
  }, [token, statusFilter, currentPage]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await getAllSubscriptionRequests(token, {
        status: statusFilter || undefined,
        page: currentPage,
        limit: 10
      });
      
      setRequests(response.requests);
      setTotalPages(Math.ceil(response.total / 10));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      await updateSubscriptionRequestStatus(token, selectedRequest.id, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        adminNotes: adminNotes
      });

      setActionModalOpen(false);
      setAdminNotes("");
      loadRequests();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openActionModal = (request: SubscriptionRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'مقبول';
      case 'rejected':
        return 'مرفوض';
      case 'pending':
        return 'قيد الانتظار';
      default:
        return status;
    }
  };

  const formatPrice = (priceCents: number, interval: string) => {
    const price = (priceCents / 100).toFixed(2);
    const period = interval === 'yearly' ? '/year' : '/month';
    return { price: `$${price}`, period };
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">إدارة طلبات الاشتراك</h1>
          <p className="text-sm text-gray-600">إدارة ومراجعة طلبات الاشتراك</p>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">إدارة طلبات الاشتراك</h1>
        <p className="text-sm text-gray-600">إدارة ومراجعة طلبات الاشتراك</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="status-filter">فلترة حسب الحالة</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">جميع الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="approved">مقبول</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>
            <Button 
              onClick={loadRequests}
              className="bg-green-600 hover:bg-green-700"
            >
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">لا توجد طلبات اشتراك</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const { price, period } = formatPrice(request.Plan?.priceCents || 0, request.Plan?.interval || 'monthly');
            
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {getStatusText(request.status)}
                        </div>
                        <span className="text-sm text-gray-500">#{request.id}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-2">معلومات المستخدم</h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span>{request.User?.name || 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">البريد:</span>
                              <span>{request.User?.email}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-800 mb-2">معلومات الباقة</h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-gray-500" />
                              <span>{request.Plan?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">السعر:</span>
                              <span className="font-medium text-green-600">{price} {period}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-2">طريقة الدفع</h3>
                          <div className="flex items-center gap-2">
                            {request.paymentMethod === 'usdt' ? (
                              <>
                                <Wallet className="h-4 w-4 text-green-600" />
                                <span>USDT</span>
                              </>
                            ) : (
                              <>
                                <Gift className="h-4 w-4 text-blue-600" />
                                <span>قسيمة</span>
                              </>
                            )}
                          </div>
                          {request.paymentMethod === 'usdt' && request.usdtWalletAddress && (
                            <p className="text-xs text-gray-600 mt-1">
                              المحفظة: {request.usdtWalletAddress}
                            </p>
                          )}
                          {request.paymentMethod === 'coupon' && request.couponCode && (
                            <p className="text-xs text-gray-600 mt-1">
                              الكود: {request.couponCode}
                            </p>
                          )}
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-800 mb-2">التاريخ</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{new Date(request.createdAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>

                      {request.adminNotes && (
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-800 mb-2">ملاحظات الأدمن</h3>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{request.adminNotes}</p>
                          </div>
                        </div>
                      )}

                      {request.receiptImage && (
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-800 mb-2">صورة الإيصال</h3>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <a 
                              href={`/uploads/subscription-receipts/${request.receiptImage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                              عرض الإيصال
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => openActionModal(request, 'approve')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            قبول
                          </Button>
                          <Button
                            onClick={() => openActionModal(request, 'reject')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            رفض
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="outline"
          >
            السابق
          </Button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-600">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            التالي
          </Button>
        </div>
      )}

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  قبول طلب الاشتراك
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  رفض طلب الاشتراك
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'هل أنت متأكد من قبول هذا الطلب؟ سيتم تفعيل الاشتراك للمستخدم.'
                : 'هل أنت متأكد من رفض هذا الطلب؟'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes">ملاحظات الأدمن (اختياري)</Label>
              <Textarea
                id="admin-notes"
                placeholder="أضف ملاحظات حول هذا القرار..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setActionModalOpen(false)}
                variant="outline"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAction}
                className={actionType === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
                }
              >
                {actionType === 'approve' ? 'قبول الطلب' : 'رفض الطلب'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}









