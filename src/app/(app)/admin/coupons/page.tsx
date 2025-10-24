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
  listPlans,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  generateCoupons,
  type Plan,
  type Coupon 
} from "@/lib/api";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Gift, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Sparkles
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export default function CouponsAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [planFilter, setPlanFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { showSuccess, showError, showInfo } = useToast();

  // Form states
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    customSuffix: '',
    planId: '',
    discountType: 'percentage',
    discountValue: '',
    bonusDays: '',
    expiresAt: '',
    maxUses: '',
    notes: '',
    discountKeyword: '',
    discountKeywordValue: ''
  });

  const [editCoupon, setEditCoupon] = useState({
    isActive: true,
    discountType: 'percentage',
    discountValue: '',
    bonusDays: '',
    expiresAt: '',
    maxUses: '',
    notes: ''
  });

  const [generateData, setGenerateData] = useState({
    planId: '',
    count: 1,
    prefix: 'COUPON',
    customSuffix: '',
    discountType: 'percentage',
    discountValue: '',
    bonusDays: '',
    maxUses: '',
    expiresAt: '',
    discountKeyword: '',
    discountKeywordValue: ''
  });

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    loadData();
  }, [token, planFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [couponsRes, plansRes] = await Promise.all([
        listCoupons(token, {
          planId: planFilter ? parseInt(planFilter) : undefined,
          isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
        }),
        listPlans(token)
      ]);
      
      setCoupons(couponsRes.coupons);
      setPlans(plansRes.plans);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    try {
      await createCoupon(token, {
        code: newCoupon.code,
        customSuffix: newCoupon.customSuffix || undefined,
        planId: parseInt(newCoupon.planId),
        discountType: newCoupon.discountType,
        discountValue: parseFloat(newCoupon.discountValue) || 0,
        bonusDays: parseInt(newCoupon.bonusDays) || 0,
        expiresAt: newCoupon.expiresAt || undefined,
        maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : undefined,
        notes: newCoupon.notes || undefined,
        discountKeyword: newCoupon.discountKeyword || undefined,
        discountKeywordValue: newCoupon.discountKeywordValue ? parseFloat(newCoupon.discountKeywordValue) : undefined
      });

      showSuccess('تم إنشاء القسيمة بنجاح');
      setCreateModalOpen(false);
      setNewCoupon({ 
        code: '', 
        customSuffix: '',
        planId: '', 
        discountType: 'percentage',
        discountValue: '',
        bonusDays: '',
        expiresAt: '', 
        maxUses: '',
        notes: '',
        discountKeyword: '',
        discountKeywordValue: ''
      });
      loadData();
    } catch (e: any) {
      showError(e.message || 'فشل في إنشاء القسيمة');
    }
  };

  const handleUpdateCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      await updateCoupon(token, selectedCoupon.id, {
        isActive: editCoupon.isActive,
        discountType: editCoupon.discountType,
        discountValue: parseFloat(editCoupon.discountValue) || 0,
        bonusDays: parseInt(editCoupon.bonusDays) || 0,
        expiresAt: editCoupon.expiresAt || undefined,
        maxUses: editCoupon.maxUses ? parseInt(editCoupon.maxUses) : undefined,
        notes: editCoupon.notes || undefined
      });

      showSuccess('تم تحديث القسيمة بنجاح');
      setEditModalOpen(false);
      setSelectedCoupon(null);
      loadData();
    } catch (e: any) {
      showError(e.message || 'فشل في تحديث القسيمة');
    }
  };

  const handleDeleteCoupon = async (couponId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه القسيمة؟')) return;

    try {
      await deleteCoupon(token, couponId);
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGenerateCoupons = async () => {
    try {
      await generateCoupons(token, {
        planId: parseInt(generateData.planId),
        count: generateData.count,
        prefix: generateData.prefix,
        customSuffix: generateData.customSuffix || undefined,
        discountType: generateData.discountType,
        discountValue: parseFloat(generateData.discountValue) || 0,
        bonusDays: parseInt(generateData.bonusDays) || 0,
        maxUses: generateData.maxUses ? parseInt(generateData.maxUses) : undefined,
        expiresAt: generateData.expiresAt || undefined,
        discountKeyword: generateData.discountKeyword || undefined,
        discountKeywordValue: generateData.discountKeywordValue ? parseFloat(generateData.discountKeywordValue) : undefined
      });

      showSuccess('تم إنشاء القسائم بنجاح');
      setGenerateModalOpen(false);
      setGenerateData({ 
        planId: '', 
        count: 1, 
        prefix: 'COUPON', 
        customSuffix: '',
        discountType: 'percentage',
        discountValue: '',
        bonusDays: '',
        maxUses: '',
        expiresAt: '',
        discountKeyword: '',
        discountKeywordValue: ''
      });
      loadData();
    } catch (e: any) {
      showError(e.message || 'فشل في إنشاء القسائم');
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setEditCoupon({
      isActive: coupon.isActive,
      discountType: (coupon as any).discountType || 'percentage',
      discountValue: (coupon as any).discountValue?.toString() || '',
      bonusDays: (coupon as any).bonusDays?.toString() || '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      maxUses: (coupon as any).maxUses?.toString() || '',
      notes: coupon.notes || ''
    });
    setEditModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('تم نسخ الكود!', 'تم نسخ كود القسيمة إلى الحافظة');
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return { text: 'غير نشط', color: 'text-gray-600 bg-gray-100', icon: XCircle };
    
    // Check if coupon has reached max uses
    if ((coupon as any).maxUses && (coupon as any).currentUses >= (coupon as any).maxUses) {
      return { text: 'مستنفذ', color: 'text-red-600 bg-red-100', icon: XCircle };
    }
    
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) return { text: 'منتهي', color: 'text-red-600 bg-red-100', icon: XCircle };
    
    // If coupon has been used but not exhausted
    if ((coupon as any).currentUses > 0) {
      return { text: 'قيد الاستخدام', color: 'text-blue-600 bg-blue-100', icon: CheckCircle };
    }
    
    return { text: 'نشط', color: 'text-green-600 bg-green-100', icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">إدارة القسائم</h1>
          <p className="text-sm text-gray-600">إدارة قسائم الاشتراك</p>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">إدارة القسائم</h1>
          <p className="text-sm text-gray-600">إدارة قسائم الاشتراك</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setGenerateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            إنشاء قسائم متعددة
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة قسيمة
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="plan-filter">فلترة حسب الباقة</Label>
              <select
                id="plan-filter"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">جميع الباقات</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="status-filter">فلترة حسب الحالة</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={loadData}
                className="bg-green-600 hover:bg-green-700 w-full"
              >
                تحديث
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد قسائم</h3>
            <p className="text-gray-600 mb-4">لم يتم إنشاء أي قسائم بعد</p>
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              إضافة قسيمة جديدة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الكود
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الباقة
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الانتهاء
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عدد الاستخدامات
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الاستخدام
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{coupon.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                              {coupon.code}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(coupon.code)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.plan?.name || 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                            <StatusIcon className="h-4 w-4" />
                            {status.text}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(coupon.createdAt).toLocaleDateString('en-US')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-US') : 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {(coupon as any).maxUses ? (
                            <div className="flex items-center gap-1">
                              <span className={`font-semibold ${
                                (coupon as any).currentUses >= (coupon as any).maxUses 
                                  ? 'text-red-600' 
                                  : (coupon as any).currentUses > 0 
                                    ? 'text-orange-600' 
                                    : 'text-green-600'
                              }`}>
                                {(coupon as any).currentUses || 0}
                              </span>
                              <span className="text-gray-400">/</span>
                              <span className="text-gray-600">{(coupon as any).maxUses}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-green-600 font-semibold">
                                {(coupon as any).currentUses || 0}
                              </span>
                              <span className="text-gray-400 text-xs">غير محدود</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.usedAt ? new Date(coupon.usedAt).toLocaleDateString('en-US') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openEditModal(coupon)}
                              className="bg-blue-600 hover:bg-blue-700"
                              size="sm"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              تعديل
                            </Button>
                            <Button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="bg-red-600 hover:bg-red-700"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Coupon Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              إضافة قسيمة جديدة
            </DialogTitle>
            <DialogDescription>
              إنشاء قسيمة جديدة للاشتراك في إحدى الباقات
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div>
              <Label htmlFor="coupon-code">كود القسيمة *</Label>
              <Input
                id="coupon-code"
                placeholder="مثال: SALE2024"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="coupon-suffix">كلمة مميزة (اختياري)</Label>
              <Input
                id="coupon-suffix"
                placeholder="مثال: VIP"
                value={newCoupon.customSuffix}
                onChange={(e) => setNewCoupon({ ...newCoupon, customSuffix: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">سيتم إضافتها في آخر الكود: {newCoupon.code}{newCoupon.customSuffix ? `-${newCoupon.customSuffix}` : ''}</p>
            </div>

            <div>
              <Label htmlFor="coupon-plan">الباقة *</Label>
              <select
                id="coupon-plan"
                value={newCoupon.planId}
                onChange={(e) => setNewCoupon({ ...newCoupon, planId: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">اختر الباقة</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">نوع الخصم</Label>
              
              <div className="space-y-3">
                <Label htmlFor="discount-type">اختر النوع</Label>
                <select
                  id="discount-type"
                  value={newCoupon.discountType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">قيمة ثابتة (ريال)</option>
                  <option value="bonus_days">أيام إضافية</option>
                </select>
              </div>

              {(newCoupon.discountType === 'percentage' || newCoupon.discountType === 'fixed') && (
                <div className="mt-3">
                  <Label htmlFor="discount-value">
                    {newCoupon.discountType === 'percentage' ? 'نسبة الخصم (%)' : 'قيمة الخصم (ريال)'}
                  </Label>
                  <Input
                    id="discount-value"
                    type="number"
                    step="0.01"
                    placeholder={newCoupon.discountType === 'percentage' ? 'مثال: 20' : 'مثال: 100'}
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                  />
                </div>
              )}

              {newCoupon.discountType === 'bonus_days' && (
                <div className="mt-3">
                  <Label htmlFor="bonus-days">عدد الأيام الإضافية</Label>
                  <Input
                    id="bonus-days"
                    type="number"
                    placeholder="مثال: 7"
                    value={newCoupon.bonusDays}
                    onChange={(e) => setNewCoupon({ ...newCoupon, bonusDays: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">سيتم إضافة هذه الأيام على مدة الاشتراك</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="max-uses">الحد الأقصى للاستخدام (اختياري)</Label>
              <Input
                id="max-uses"
                type="number"
                placeholder="اتركه فارغاً للاستخدام غير المحدود"
                value={newCoupon.maxUses}
                onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">عدد المرات التي يمكن استخدام الكوبون فيها</p>
            </div>

            <div>
              <Label htmlFor="coupon-expires">تاريخ الانتهاء (اختياري)</Label>
              <Input
                id="coupon-expires"
                type="date"
                value={newCoupon.expiresAt}
                onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">كلمة الخصم الإضافية (اختياري)</Label>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="discount-keyword">كلمة الخصم</Label>
                  <Input
                    id="discount-keyword"
                    placeholder="مثال: VIP"
                    value={newCoupon.discountKeyword}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountKeyword: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">كلمة يمكن إضافتها للكوبون للحصول على خصم إضافي</p>
                </div>
                <div>
                  <Label htmlFor="discount-keyword-value">قيمة الخصم الإضافي</Label>
                  <Input
                    id="discount-keyword-value"
                    type="number"
                    step="0.01"
                    placeholder="مثال: 10"
                    value={newCoupon.discountKeywordValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountKeywordValue: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">قيمة الخصم الإضافي عند إضافة كلمة الخصم</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="coupon-notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="coupon-notes"
                placeholder="أضف ملاحظات حول هذه القسيمة..."
                value={newCoupon.notes}
                onChange={(e) => setNewCoupon({ ...newCoupon, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setCreateModalOpen(false)}
                variant="outline"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreateCoupon}
                disabled={!newCoupon.code || !newCoupon.planId}
                className="bg-green-600 hover:bg-green-700"
              >
                إنشاء القسيمة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              تعديل القسيمة
            </DialogTitle>
            <DialogDescription>
              تعديل إعدادات القسيمة: {selectedCoupon?.code}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div>
              <Label htmlFor="edit-active">الحالة</Label>
              <select
                id="edit-active"
                value={editCoupon.isActive ? 'true' : 'false'}
                onChange={(e) => setEditCoupon({ ...editCoupon, isActive: e.target.value === 'true' })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </select>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">نوع الخصم</Label>
              
              <div className="space-y-3">
                <Label htmlFor="edit-discount-type">اختر النوع</Label>
                <select
                  id="edit-discount-type"
                  value={editCoupon.discountType}
                  onChange={(e) => setEditCoupon({ ...editCoupon, discountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">قيمة ثابتة (ريال)</option>
                  <option value="bonus_days">أيام إضافية</option>
                </select>
              </div>

              {(editCoupon.discountType === 'percentage' || editCoupon.discountType === 'fixed') && (
                <div className="mt-3">
                  <Label htmlFor="edit-discount-value">
                    {editCoupon.discountType === 'percentage' ? 'نسبة الخصم (%)' : 'قيمة الخصم (ريال)'}
                  </Label>
                  <Input
                    id="edit-discount-value"
                    type="number"
                    step="0.01"
                    placeholder={editCoupon.discountType === 'percentage' ? 'مثال: 20' : 'مثال: 100'}
                    value={editCoupon.discountValue}
                    onChange={(e) => setEditCoupon({ ...editCoupon, discountValue: e.target.value })}
                  />
                </div>
              )}

              {editCoupon.discountType === 'bonus_days' && (
                <div className="mt-3">
                  <Label htmlFor="edit-bonus-days">عدد الأيام الإضافية</Label>
                  <Input
                    id="edit-bonus-days"
                    type="number"
                    placeholder="مثال: 7"
                    value={editCoupon.bonusDays}
                    onChange={(e) => setEditCoupon({ ...editCoupon, bonusDays: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="edit-max-uses">الحد الأقصى للاستخدام (اختياري)</Label>
              <Input
                id="edit-max-uses"
                type="number"
                placeholder="اتركه فارغاً للاستخدام غير المحدود"
                value={editCoupon.maxUses}
                onChange={(e) => setEditCoupon({ ...editCoupon, maxUses: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-expires">تاريخ الانتهاء (اختياري)</Label>
              <Input
                id="edit-expires"
                type="date"
                value={editCoupon.expiresAt}
                onChange={(e) => setEditCoupon({ ...editCoupon, expiresAt: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="edit-notes"
                placeholder="أضف ملاحظات حول هذه القسيمة..."
                value={editCoupon.notes}
                onChange={(e) => setEditCoupon({ ...editCoupon, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setEditModalOpen(false)}
                variant="outline"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleUpdateCoupon}
                className="bg-blue-600 hover:bg-blue-700"
              >
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Coupons Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              إنشاء قسائم متعددة
            </DialogTitle>
            <DialogDescription>
              إنشاء عدة قسائم بنفس الإعدادات
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div>
              <Label htmlFor="generate-plan">الباقة *</Label>
              <select
                id="generate-plan"
                value={generateData.planId}
                onChange={(e) => setGenerateData({ ...generateData, planId: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">اختر الباقة</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="generate-count">عدد القسائم *</Label>
              <Input
                id="generate-count"
                type="number"
                min="1"
                max="100"
                value={generateData.count}
                onChange={(e) => setGenerateData({ ...generateData, count: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <Label htmlFor="generate-prefix">بادئة الكود *</Label>
              <Input
                id="generate-prefix"
                placeholder="COUPON"
                value={generateData.prefix}
                onChange={(e) => setGenerateData({ ...generateData, prefix: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">سيتم إضافة رقم عشوائي لكل قسيمة</p>
            </div>

            <div>
              <Label htmlFor="generate-suffix">كلمة مميزة (اختياري)</Label>
              <Input
                id="generate-suffix"
                placeholder="مثال: VIP"
                value={generateData.customSuffix}
                onChange={(e) => setGenerateData({ ...generateData, customSuffix: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">ستُضاف في آخر جميع القسائم</p>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">نوع الخصم</Label>
              
              <div className="space-y-3">
                <Label htmlFor="generate-discount-type">اختر النوع</Label>
                <select
                  id="generate-discount-type"
                  value={generateData.discountType}
                  onChange={(e) => setGenerateData({ ...generateData, discountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">قيمة ثابتة (ريال)</option>
                  <option value="bonus_days">أيام إضافية</option>
                </select>
              </div>

              {(generateData.discountType === 'percentage' || generateData.discountType === 'fixed') && (
                <div className="mt-3">
                  <Label htmlFor="generate-discount-value">
                    {generateData.discountType === 'percentage' ? 'نسبة الخصم (%)' : 'قيمة الخصم (ريال)'}
                  </Label>
                  <Input
                    id="generate-discount-value"
                    type="number"
                    step="0.01"
                    placeholder={generateData.discountType === 'percentage' ? 'مثال: 20' : 'مثال: 100'}
                    value={generateData.discountValue}
                    onChange={(e) => setGenerateData({ ...generateData, discountValue: e.target.value })}
                  />
                </div>
              )}

              {generateData.discountType === 'bonus_days' && (
                <div className="mt-3">
                  <Label htmlFor="generate-bonus-days">عدد الأيام الإضافية</Label>
                  <Input
                    id="generate-bonus-days"
                    type="number"
                    placeholder="مثال: 7"
                    value={generateData.bonusDays}
                    onChange={(e) => setGenerateData({ ...generateData, bonusDays: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">سيتم إضافة هذه الأيام على مدة الاشتراك لجميع القسائم</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="generate-max-uses">الحد الأقصى للاستخدام لكل قسيمة (اختياري)</Label>
              <Input
                id="generate-max-uses"
                type="number"
                placeholder="اتركه فارغاً للاستخدام غير المحدود"
                value={generateData.maxUses}
                onChange={(e) => setGenerateData({ ...generateData, maxUses: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">عدد المرات التي يمكن استخدام كل قسيمة فيها</p>
            </div>

            <div>
              <Label htmlFor="generate-expires">تاريخ الانتهاء (اختياري)</Label>
              <Input
                id="generate-expires"
                type="date"
                value={generateData.expiresAt}
                onChange={(e) => setGenerateData({ ...generateData, expiresAt: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">كلمة الخصم الإضافية (اختياري)</Label>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="generate-discount-keyword">كلمة الخصم</Label>
                  <Input
                    id="generate-discount-keyword"
                    placeholder="مثال: VIP"
                    value={generateData.discountKeyword}
                    onChange={(e) => setGenerateData({ ...generateData, discountKeyword: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">كلمة يمكن إضافتها للكوبون للحصول على خصم إضافي</p>
                </div>
                <div>
                  <Label htmlFor="generate-discount-keyword-value">قيمة الخصم الإضافي</Label>
                  <Input
                    id="generate-discount-keyword-value"
                    type="number"
                    step="0.01"
                    placeholder="مثال: 10"
                    value={generateData.discountKeywordValue}
                    onChange={(e) => setGenerateData({ ...generateData, discountKeywordValue: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">قيمة الخصم الإضافي عند إضافة كلمة الخصم</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setGenerateModalOpen(false)}
                variant="outline"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleGenerateCoupons}
                disabled={!generateData.planId || generateData.count < 1}
                className="bg-blue-600 hover:bg-blue-700"
              >
                إنشاء {generateData.count} قسيمة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
