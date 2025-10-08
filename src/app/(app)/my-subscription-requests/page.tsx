"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  getUserSubscriptionRequests, 
  uploadReceipt,
  type SubscriptionRequest 
} from "@/lib/api";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  CreditCard,
  Calendar,
  FileText,
  Wallet,
  Gift,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

export default function MySubscriptionRequestsPage() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [uploadingReceipt, setUploadingReceipt] = useState<number | null>(null);

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    loadRequests();
  }, [token]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await getUserSubscriptionRequests(token);
      setRequests(response.requests);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = async (requestId: number, file: File) => {
    setUploadingReceipt(requestId);
    try {
      await uploadReceipt(token, requestId, file);
      loadRequests(); // Reload requests to show updated receipt
      alert('تم رفع الإيصال بنجاح!');
    } catch (e: any) {
      alert(`خطأ في رفع الإيصال: ${e.message}`);
    } finally {
      setUploadingReceipt(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
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
          <h1 className="text-2xl font-semibold">طلبات الاشتراك الخاصة بي</h1>
          <p className="text-sm text-gray-600">متابعة حالة طلبات الاشتراك</p>
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
        <h1 className="text-2xl font-semibold text-gray-800">طلبات الاشتراك الخاصة بي</h1>
        <p className="text-sm text-gray-600">متابعة حالة طلبات الاشتراك</p>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد طلبات اشتراك</h3>
            <p className="text-gray-600 mb-4">لم تقم بإرسال أي طلبات اشتراك بعد</p>
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              تصفح الباقات
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => {
            const { price, period } = formatPrice(request.Plan?.priceCents || 0, request.Plan?.interval || 'monthly');
            
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{request.Plan?.name}</CardTitle>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {getStatusText(request.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Plan Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">تفاصيل الباقة</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">الباقة:</span>
                          <span className="font-medium">{request.Plan?.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">السعر:</span>
                          <span className="font-medium text-green-600">{price} {period}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">تاريخ الطلب:</span>
                          <span>{new Date(request.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">طريقة الدفع</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {request.paymentMethod === 'usdt' ? (
                            <>
                              <Wallet className="h-4 w-4 text-green-600" />
                              <span>الدفع بـ USDT</span>
                            </>
                          ) : (
                            <>
                              <Gift className="h-4 w-4 text-blue-600" />
                              <span>استخدام قسيمة</span>
                            </>
                          )}
                        </div>
                        {request.paymentMethod === 'usdt' && request.usdtWalletAddress && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">عنوان المحفظة:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs ml-2">
                              {request.usdtWalletAddress}
                            </code>
                          </div>
                        )}
                        {request.paymentMethod === 'coupon' && request.couponCode && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">كود القسيمة:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs ml-2">
                              {request.couponCode}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Receipt Upload Section */}
                  {request.paymentMethod === 'usdt' && request.status === 'pending' && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-gray-800 mb-3">رفع إيصال الدفع</h3>
                      
                      {!request.receiptImage ? (
                        <div className="space-y-4">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                              <div className="text-sm text-yellow-800">
                                <p className="font-medium">مطلوب رفع إيصال الدفع</p>
                                <p>يرجى رفع صورة إيصال الدفع لتتم مراجعة طلبك</p>
                              </div>
                            </div>
                          </div>
                          
                          <FileUpload
                            onFileSelect={(file) => handleReceiptUpload(request.id, file)}
                            accept="image/*"
                            maxSize={5}
                            disabled={uploadingReceipt === request.id}
                          />
                          
                          {uploadingReceipt === request.id && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              جاري رفع الإيصال...
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-800">تم رفع الإيصال</span>
                          </div>
                          <div className="mt-2">
                            <a 
                              href={`/uploads/subscription-receipts/${request.receiptImage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                              عرض الإيصال المرفوع
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Notes */}
                  {request.adminNotes && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-gray-800 mb-3">ملاحظات الأدمن</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">{request.adminNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Status Messages */}
                  {request.status === 'approved' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">تم قبول طلبك!</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        تم تفعيل اشتراكك في باقة {request.Plan?.name} بنجاح
                      </p>
                    </div>
                  )}

                  {request.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800">تم رفض طلبك</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        للأسف، تم رفض طلب الاشتراك. يمكنك المحاولة مرة أخرى
                      </p>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">طلبك قيد المراجعة</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        فريقنا يمر على طلبك وسيتم إشعارك بالنتيجة قريباً
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}












