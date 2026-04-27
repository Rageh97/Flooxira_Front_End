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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  Gift,
  ShieldCheck,
  AlertCircle,
  Fingerprint,
  ChevronRight,
  ChevronLeft,
  Filter
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
  const [totalCount, setTotalCount] = useState(0);

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
      setTotalCount(response.total);
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
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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
        return 'عملية ناجحة';
      case 'rejected':
        return 'عملية فاشلة';
      case 'pending':
        return 'قيد الانتظار';
      default:
        return status;
    }
  };

  const formatPrice = (priceCents: number, interval: string) => {
    const price = priceCents;
    const period = interval === 'yearly' ? '/year' : '/month';
    return { price: `$${price}`, period };
  };

  if (loading) {
    return (
      <div className="space-y-8 p-8">
        <h1 className="text-2xl font-bold text-white">إدارة طلبات الاشتراك</h1>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">إدارة طلبات الاشتراك</h1>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">
              <span className="text-[11px] text-gray-300 font-medium">
                الصفحة <span className="text-white font-bold">{currentPage}</span> / {totalPages}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ">
        <Card className="col-span-1 md:col-span-3 gradient-border backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="status-filter" className="text-gray-400 text-xs mb-2 flex items-center gap-1.5 px-1">
                  <Filter className="h-3 w-3" /> تصفية حسب حالة العملية
                </Label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="" className="bg-gray-900">جميع الحالات</option>
                  <option value="approved" className="bg-gray-900">العمليات الناجحة</option>
                  <option value="rejected" className="bg-gray-900">العمليات الفاشلة</option>
                  <option value="pending" className="bg-gray-900">العمليات المعلقة</option>
                </select>
              </div>
              <Button 
                onClick={loadRequests}
                className="bg-green-600 hover:bg-green-500 text-white rounded-xl h-10 px-8 font-bold transition-all shadow-lg shadow-green-900/20"
              >
                تحديث البيانات
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="gradient-border backdrop-blur-md flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-[10px] text-green-400 uppercase font-bold tracking-widest mb-1">إجمالي الطلبات</p>
            <p className="text-3xl font-black text-white">{totalCount}</p>
          </div>
        </Card>
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-transparent py-20">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <AlertCircle className="h-10 w-10 text-white/20" />
            </div>
            <p className="text-lg font-medium text-white/40">لا توجد سجلات مطابقة للبحث</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-right text-gray-400 font-bold w-[80px] py-5 px-6">ID</TableHead>
                <TableHead className="text-right text-gray-400 font-bold px-6">العميل</TableHead>
                <TableHead className="text-right text-gray-400 font-bold px-6">الاشتراك / المبلغ</TableHead>
                <TableHead className="text-right text-gray-400 font-bold px-6">البوابة</TableHead>
                <TableHead className="text-right text-gray-400 font-bold px-6">رقم المرجع</TableHead>
                <TableHead className="text-right text-gray-400 font-bold px-6">التاريخ</TableHead>
                <TableHead className="text-center text-gray-400 font-bold px-6">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                let price = '0';
                let planName = request.Plan?.name || 'باقة مخصصة';
                let gatewayInfo: any = null;

                if (request.Plan) {
                  const formatted = formatPrice(request.Plan.priceCents || 0, request.Plan.interval || 'monthly');
                  price = formatted.price;
                }

                if (request.paymentMethod === 'edfapay' && request.notes) {
                  try {
                    gatewayInfo = JSON.parse(request.notes);
                    if (gatewayInfo.totalPrice) price = `$${gatewayInfo.totalPrice}`;
                  } catch (e) {}
                }

                return (
                  <TableRow key={request.id} className="border-white/5 hover:bg-white/[0.03] transition-all group">
                    <TableCell className="font-mono text-xs text-gray-500 px-6">#{request.id}</TableCell>
                    <TableCell className="px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{request.user?.name || 'مستخدم غير معروف'}</span>
                        <span className="text-[10px] text-gray-500 font-mono tracking-tighter truncate max-w-[150px]">{request.user?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-gray-300">{planName}</span>
                        <span className="text-xs font-bold text-green-400">{price}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                        {request.paymentMethod === 'edfapay' ? (
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> EdfaPay
                          </span>
                        ) : request.paymentMethod === 'usdt' ? (
                          <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-md border border-green-500/20 flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> USDT
                          </span>
                        ) : (
                          <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20 flex items-center gap-1">
                            <Gift className="h-3 w-3" /> Coupon
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6">
                      <span className="font-mono text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                        {gatewayInfo?.transId || request.couponCode || (request.usdtWalletAddress ? request.usdtWalletAddress.slice(0, 8) + '...' : '---')}
                      </span>
                    </TableCell>
                    <TableCell className="px-6">
                      <div className="flex flex-col text-[10px] leading-tight">
                        <span className="text-gray-300 font-bold">{new Date(request.createdAt).toLocaleDateString('ar-EG')}</span>
                        <span className="text-gray-500 font-mono">{new Date(request.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-center">
                      <Badge className={`font-black border px-3 py-1 rounded-xl whitespace-nowrap text-[9px] uppercase tracking-widest ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </Badge>
                    </TableCell>
                    {/* <TableCell className="px-6">
                      <div className="flex items-center justify-center gap-2">
                        {request.status === 'pending' && request.paymentMethod !== 'edfapay' ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openActionModal(request, 'approve')}
                              className="h-8 w-8 text-green-400 hover:bg-green-400/20 transition-all border border-transparent hover:border-green-400/30"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openActionModal(request, 'reject')}
                              className="h-8 w-8 text-red-400 hover:bg-red-400/20 transition-all border border-transparent hover:border-red-400/30"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                             <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                {request.paymentMethod === 'edfapay' ? 'Bot' : 'Done'}
                             </span>
                          </div>
                        )}
                        {request.receiptImage && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:bg-blue-400/20 border border-transparent hover:border-blue-400/30" asChild>
                            <a href={`/uploads/subscription-receipts/${request.receiptImage}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell> */}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              {actionType === 'approve' ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  موافقة على الطلب
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                  رفض الطلب
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              {actionType === 'approve' 
                ? 'هل أنت متأكد من تفعيل هذا الاشتراك؟ سيتم منح الصلاحيات للمستخدم فوراً.'
                : 'هل أنت متأكد من رفض هذا الطلب؟ لن يتم تفعيل أي صلاحيات.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes" className="text-xs font-bold text-gray-500 uppercase px-1">ملاحظات إضافية (تظهر للمستخدم)</Label>
              <Textarea
                id="admin-notes"
                placeholder="أضف سبباً للرفض أو ملاحظة ترحيبية بالقبول..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-green-500/50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setActionModalOpen(false)}
                variant="ghost"
                className="flex-1 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 font-bold"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAction}
                className={`flex-1 rounded-xl font-bold ${
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
                }`}
              >
                {actionType === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
