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
    planId: '',
    expiresAt: '',
    notes: ''
  });

  const [editCoupon, setEditCoupon] = useState({
    isActive: true,
    expiresAt: '',
    notes: ''
  });

  const [generateData, setGenerateData] = useState({
    planId: '',
    count: 1,
    prefix: 'COUPON',
    expiresAt: ''
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
        planId: parseInt(newCoupon.planId),
        expiresAt: newCoupon.expiresAt || undefined,
        notes: newCoupon.notes || undefined
      });

      setCreateModalOpen(false);
      setNewCoupon({ code: '', planId: '', expiresAt: '', notes: '' });
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdateCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      await updateCoupon(token, selectedCoupon.id, {
        isActive: editCoupon.isActive,
        expiresAt: editCoupon.expiresAt || undefined,
        notes: editCoupon.notes || undefined
      });

      setEditModalOpen(false);
      setSelectedCoupon(null);
      loadData();
    } catch (e: any) {
      setError(e.message);
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
        expiresAt: generateData.expiresAt || undefined
      });

      setGenerateModalOpen(false);
      setGenerateData({ planId: '', count: 1, prefix: 'COUPON', expiresAt: '' });
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setEditCoupon({
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
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
    if (coupon.usedAt) return { text: 'مستخدم', color: 'text-blue-600 bg-blue-100', icon: CheckCircle };
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) return { text: 'منتهي', color: 'text-red-600 bg-red-100', icon: XCircle };
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
                          {new Date(coupon.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.usedAt ? new Date(coupon.usedAt).toLocaleDateString('ar-SA') : '-'}
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

          <div className="space-y-4">
            <div>
              <Label htmlFor="coupon-code">كود القسيمة</Label>
              <Input
                id="coupon-code"
                placeholder="أدخل كود القسيمة"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="coupon-plan">الباقة</Label>
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

            <div>
              <Label htmlFor="coupon-expires">تاريخ الانتهاء (اختياري)</Label>
              <Input
                id="coupon-expires"
                type="date"
                value={newCoupon.expiresAt}
                onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
              />
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

          <div className="space-y-4">
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

          <div className="space-y-4">
            <div>
              <Label htmlFor="generate-plan">الباقة</Label>
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
              <Label htmlFor="generate-count">عدد القسائم</Label>
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
              <Label htmlFor="generate-prefix">بادئة الكود</Label>
              <Input
                id="generate-prefix"
                placeholder="COUPON"
                value={generateData.prefix}
                onChange={(e) => setGenerateData({ ...generateData, prefix: e.target.value })}
              />
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
