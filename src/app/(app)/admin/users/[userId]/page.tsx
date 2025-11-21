"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getUserDetails, updateUserStatus } from "@/lib/api";
import { ArrowLeft, User, Mail, Phone, Shield, Calendar, Bot, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";

type UserDetails = {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerifiedAt?: string;
  botPaused: boolean;
  botPausedUntil?: string;
  createdAt: string;
  updatedAt: string;
  subscriptions: Array<{
    id: number;
    userId: number;
    planId: number;
    status: 'active' | 'expired' | 'cancelled';
    startedAt: string;
    expiresAt: string;
    autoRenew: boolean;
    createdAt: string;
    updatedAt: string;
    plan: {
      id: number;
      name: string;
      priceCents: number;
      interval: 'monthly' | 'yearly';
      features: any;
      permissions: any;
    };
  }>;
  subscriptionRequests: Array<{
    id: number;
    userId: number;
    planId: number;
    paymentMethod: 'usdt' | 'coupon';
    status: 'pending' | 'approved' | 'rejected';
    usdtWalletAddress?: string;
    receiptImage?: string;
    couponCode?: string;
    notes?: string;
    adminNotes?: string;
    processedAt?: string;
    processedBy?: number;
    createdAt: string;
    updatedAt: string;
    plan: {
      id: number;
      name: string;
      priceCents: number;
      interval: 'monthly' | 'yearly';
    };
  }>;
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'activate' | 'deactivate' | null>(null);

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token || !userId) return;
    
    setLoading(true);
    getUserDetails(token, parseInt(userId))
      .then((res) => setUser(res.user))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'expired':
        return 'منتهي الصلاحية';
      case 'cancelled':
        return 'ملغي';
      case 'pending':
        return 'معلق';
      case 'approved':
        return 'موافق عليه';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  };

  const handleToggleStatus = () => {
    if (!user) return;
    
    const action = user.isActive ? 'deactivate' : 'activate';
    setPendingAction(action);
    setConfirmModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!user || !pendingAction) return;
    
    setUpdating(true);
    try {
      const newStatus = pendingAction === 'activate';
      const res = await updateUserStatus(token, user.id, newStatus);
      if (res.success) {
        setUser(prev => prev ? { ...prev, isActive: newStatus } : null);
        setConfirmModalOpen(false);
        setPendingAction(null);
      }
    } catch (e: any) {
      console.error('Error updating user status:', e);
      alert(e.message || 'حدث خطأ في تحديث حالة المستخدم');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-gray-300">جاري تحميل تفاصيل المستخدم...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !user) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-red-400">خطأ: {error || 'المستخدم غير موجود'}</p>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
            variant="outline"
          >
            العودة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة</span>
          </Button>
          <h1 className="text-2xl font-bold text-white">تفاصيل المستخدم</h1>
        </div>
        <Button
          onClick={handleToggleStatus}
          disabled={updating}
          variant={user.isActive ? "destructive" : "default"}
          className="flex items-center space-x-2 rtl:space-x-reverse"
        >
          {user.isActive ? (
            <>
              <ToggleLeft className="w-4 h-4" />
              <span>تعطيل المستخدم</span>
            </>
          ) : (
            <>
              <ToggleRight className="w-4 h-4" />
              <span>تفعيل المستخدم</span>
            </>
          )}
        </Button>
      </div>

      {/* User Basic Info */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold flex items-center space-x-2 rtl:space-x-reverse">
            <User className="w-5 h-5" />
            <span>المعلومات الأساسية</span>
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-gray-600">
                  <td className="py-3 px-4 font-medium text-gray-300 w-1/3">الاسم</td>
                  <td className="py-3 px-4 text-white">{user.name || 'لا يوجد اسم'}</td>
                </tr>
                <tr className="border-b border-gray-600">
                  <td className="py-3 px-4 font-medium text-gray-300">البريد الإلكتروني</td>
                  <td className="py-3 px-4 text-white flex items-center space-x-2 rtl:space-x-reverse">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-600">
                  <td className="py-3 px-4 font-medium text-gray-300">الهاتف</td>
                  <td className="py-3 px-4 text-white flex items-center space-x-2 rtl:space-x-reverse">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone || 'لا يوجد هاتف'}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-600">
                  <td className="py-3 px-4 font-medium text-gray-300">الدور</td>
                  <td className="py-3 px-4">
                    <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b border-gray-600">
                  <td className="py-3 px-4 font-medium text-gray-300">الحالة</td>
                  <td className="py-3 px-4">
                    <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {user.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </td>
                </tr>
                {/* <tr className="border-b border-gray-600">
                  <td className="py-3 px-4 font-medium text-gray-300">حالة البريد الإلكتروني</td>
                  <td className="py-3 px-4">
                    <Badge className={user.emailVerifiedAt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {user.emailVerifiedAt ? 'مؤكد' : 'غير مؤكد'}
                    </Badge>
                  </td>
                </tr> */}
                {/* <tr className="border-b border-gray-600">
                  <td className="py-3 px-4 font-medium text-gray-300">حالة البوت</td>
                  <td className="py-3 px-4">
                    <Badge className={user.botPaused ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      <Bot className="w-3 h-3 mr-1" />
                      {user.botPaused ? 'متوقف' : 'نشط'}
                    </Badge>
                  </td>
                </tr> */}
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-300">تاريخ الإنشاء</td>
                  <td className="py-3 px-4 text-white flex items-center space-x-2 rtl:space-x-reverse">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(user.createdAt)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold">الاشتراكات النشطة</h3>
        </CardHeader>
        <CardContent>
          {user.subscriptions.length === 0 ? (
            <p className="text-sm text-gray-300">لا توجد اشتراكات نشطة</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4 font-medium text-white text-right">الباقة</th>
                    <th className="py-3 px-4 font-medium text-white text-right">الحالة</th>
                    <th className="py-3 px-4 font-medium text-white text-right">السعر</th>
                    <th className="py-3 px-4 font-medium text-white text-right">تاريخ البداية</th>
                    <th className="py-3 px-4 font-medium text-white text-right">تاريخ الانتهاء</th>
                    <th className="py-3 px-4 font-medium text-white text-right">التجديد التلقائي</th>
                    <th className="py-3 px-4 font-medium text-white text-right">الصلاحيات</th>
                  </tr>
                </thead>
                <tbody>
                  {user.subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b border-gray-600">
                      <td className="py-3 px-4 text-white font-medium">{subscription.plan.name}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(subscription.status)}>
                          {getStatusText(subscription.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-white">
                        ${formatPrice(subscription.plan.priceCents)} / {subscription.plan.interval === 'monthly' ? 'شهري' : 'سنوي'}
                      </td>
                      <td className="py-3 px-4 text-white">{formatDate(subscription.startedAt)}</td>
                      <td className="py-3 px-4 text-white">{formatDate(subscription.expiresAt)}</td>
                      <td className="py-3 px-4 text-white">{subscription.autoRenew ? 'مفعل' : 'غير مفعل'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {subscription.plan.permissions?.platforms && subscription.plan.permissions.platforms.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {subscription.plan.permissions.platforms.join(', ')}
                            </Badge>
                          )}
                          {subscription.plan.permissions?.monthlyPosts > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {subscription.plan.permissions.monthlyPosts} منشور
                            </Badge>
                          )}
                          {subscription.plan.permissions?.canManageWhatsApp && (
                            <Badge variant="outline" className="text-xs">واتساب</Badge>
                          )}
                          {subscription.plan.permissions?.whatsappMessagesPerMonth > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {subscription.plan.permissions.whatsappMessagesPerMonth} رسالة واتساب
                            </Badge>
                          )}
                          {subscription.plan.permissions?.canManageTelegram && (
                            <Badge variant="outline" className="text-xs">تليجرام</Badge>
                          )}
                          {subscription.plan.permissions?.canSallaIntegration && (
                            <Badge variant="outline" className="text-xs">سلة</Badge>
                          )}
                          {subscription.plan.permissions?.canManageContent && (
                            <Badge variant="outline" className="text-xs">إدارة المحتوى</Badge>
                          )}
                          {subscription.plan.permissions?.canManageCustomers && (
                            <Badge variant="outline" className="text-xs">إدارة العملاء</Badge>
                          )}
                          {subscription.plan.permissions?.canMarketServices && (
                            <Badge variant="outline" className="text-xs">تسويق الخدمات</Badge>
                          )}
                          {subscription.plan.permissions?.maxServices > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {subscription.plan.permissions.maxServices} خدمة
                            </Badge>
                          )}
                          {subscription.plan.permissions?.canManageEmployees && (
                            <Badge variant="outline" className="text-xs">إدارة الموظفين</Badge>
                          )}
                          {subscription.plan.permissions?.maxEmployees > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {subscription.plan.permissions.maxEmployees} موظف
                            </Badge>
                          )}
                          {subscription.plan.permissions?.canUseAI && (
                            <Badge variant="outline" className="text-xs">AI</Badge>
                          )}
                          {subscription.plan.permissions?.aiCredits > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {subscription.plan.permissions.aiCredits} نقطة AI
                            </Badge>
                          )}
                          {subscription.plan.permissions?.canUseLiveChat && (
                            <Badge variant="outline" className="text-xs">Live Chat</Badge>
                          )}
                          {subscription.plan.permissions?.liveChatAiResponses > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {subscription.plan.permissions.liveChatAiResponses} رد تلقائي
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Requests */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold">طلبات الاشتراك</h3>
        </CardHeader>
        <CardContent>
          {user.subscriptionRequests.length === 0 ? (
            <p className="text-sm text-gray-300">لا توجد طلبات اشتراك</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4 font-medium text-white text-right">الباقة</th>
                    <th className="py-3 px-4 font-medium text-white text-right">الحالة</th>
                    <th className="py-3 px-4 font-medium text-white text-right">طريقة الدفع</th>
                    <th className="py-3 px-4 font-medium text-white text-right">تاريخ الطلب</th>
                    <th className="py-3 px-4 font-medium text-white text-right">كود الكوبون</th>
                    <th className="py-3 px-4 font-medium text-white text-right">عنوان المحفظة</th>
                    <th className="py-3 px-4 font-medium text-white text-right">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {user.subscriptionRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-600">
                      <td className="py-3 px-4 text-white font-medium">{request.plan.name}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusText(request.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-white">
                        {request.paymentMethod === 'usdt' ? 'USDT' : 'كوبون'}
                      </td>
                      <td className="py-3 px-4 text-white">{formatDate(request.createdAt)}</td>
                      <td className="py-3 px-4 text-white font-mono text-sm">
                        {request.couponCode || '-'}
                      </td>
                      <td className="py-3 px-4 text-white font-mono text-xs">
                        {request.usdtWalletAddress || '-'}
                      </td>
                      <td className="py-3 px-4 text-white text-sm">
                        <div className="space-y-1">
                          {request.notes && (
                            <div>
                              <span className="text-gray-300 text-xs">ملاحظات:</span>
                              <p className="text-xs">{request.notes}</p>
                            </div>
                          )}
                          {request.adminNotes && (
                            <div>
                              <span className="text-gray-300 text-xs">أدمن:</span>
                              <p className="text-xs">{request.adminNotes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span>تأكيد العملية</span>
            </DialogTitle>
            <DialogDescription className="text-right">
              {pendingAction === 'deactivate' ? (
                <>
                  هل أنت متأكد من تعطيل المستخدم <strong>{user?.name || user?.email}</strong>؟
                  <br />
                  <span className="text-sm text-gray-500 mt-2 block">
                    لن يتمكن المستخدم من تسجيل الدخول بعد التعطيل، ويمكنك تفعيله مرة أخرى في أي وقت.
                  </span>
                </>
              ) : (
                <>
                  هل أنت متأكد من تفعيل المستخدم <strong>{user?.name || user?.email}</strong>؟
                  <br />
                  <span className="text-sm text-gray-500 mt-2 block">
                    سيتمكن المستخدم من تسجيل الدخول مرة أخرى.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 rtl:flex-row-reverse">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmModalOpen(false);
                setPendingAction(null);
              }}
              disabled={updating}
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmToggleStatus}
              disabled={updating}
              variant={pendingAction === 'deactivate' ? 'destructive' : 'default'}
            >
              {updating ? 'جاري المعالجة...' : (pendingAction === 'deactivate' ? 'تعطيل' : 'تفعيل')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
