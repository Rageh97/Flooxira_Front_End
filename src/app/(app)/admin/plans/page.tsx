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
  createPlan,
  updatePlan,
  deletePlan,
  type Plan 
} from "@/lib/api";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Crown, 
  Settings,
  CheckCircle,
  XCircle,
  DollarSign
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function PlansAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { showSuccess, showError, showInfo } = useToast();

  // Form states
  const [newPlan, setNewPlan] = useState({
    name: '',
    priceCents: '',
    interval: 'monthly' as 'monthly' | 'yearly',
    isActive: true,
    // الصيغة المبسطة للصلاحيات
    permissions: {
      platforms: [] as string[],
      monthlyPosts: 0,
      canManageWhatsApp: false,
      whatsappMessagesPerMonth: 0,
      canManageTelegram: false,
      canSallaIntegration: false,
      canManageContent: false
    }
  });

  const [editPlan, setEditPlan] = useState({
    name: '',
    priceCents: '',
    interval: 'monthly' as 'monthly' | 'yearly',
    isActive: true,
    permissions: {
      platforms: [] as string[],
      monthlyPosts: 0,
      canManageWhatsApp: false,
      whatsappMessagesPerMonth: 0,
      canManageTelegram: false,
      canSallaIntegration: false,
      canManageContent: false
    }
  });

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    loadPlans();
  }, [token]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await listPlans(token);
      setPlans(res.plans);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await createPlan(token, {
        name: newPlan.name,
        priceCents: parseInt(newPlan.priceCents),
        interval: newPlan.interval,
        isActive: newPlan.isActive,
        permissions: newPlan.permissions
      });

      setCreateModalOpen(false);
      setNewPlan({
        name: '',
        priceCents: '',
        interval: 'monthly',
        isActive: true,
        permissions: {
          platforms: [],
          monthlyPosts: 0,
          canManageWhatsApp: false,
          whatsappMessagesPerMonth: 0,
          canManageTelegram: false,
          canSallaIntegration: false,
          canManageContent: false
        }
      });
      loadPlans();
      showSuccess('تم إنشاء الباقة بنجاح!', 'تم إنشاء الباقة الجديدة بنجاح');
    } catch (e: any) {
      showError('خطأ في إنشاء الباقة', e.message);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      await updatePlan(token, selectedPlan.id, {
        name: editPlan.name,
        priceCents: parseInt(editPlan.priceCents),
        interval: editPlan.interval,
        isActive: editPlan.isActive,
        permissions: editPlan.permissions
      });

      setEditModalOpen(false);
      setSelectedPlan(null);
      loadPlans();
      showSuccess('تم تحديث الباقة بنجاح!', 'تم تحديث الباقة بنجاح');
    } catch (e: any) {
      showError('خطأ في تحديث الباقة', e.message);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      await deletePlan(token, planId);
      loadPlans();
      showSuccess('تم حذف الباقة بنجاح!', 'تم حذف الباقة بنجاح');
    } catch (e: any) {
      showError('خطأ في حذف الباقة', e.message);
    }
  };

  const openEditModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setEditPlan({
      name: plan.name,
      priceCents: plan.priceCents.toString(),
      interval: plan.interval,
      isActive: plan.isActive,
      permissions: plan.permissions || {
        platforms: [],
        monthlyPosts: 0,
        canManageWhatsApp: false,
        whatsappMessagesPerMonth: 0,
        canManageTelegram: false,
        canSallaIntegration: false,
        canManageContent: false
      }
    });
    setEditModalOpen(true);
  };

  const formatPrice = (priceCents: number, interval: string) => {
    const price = (priceCents / 100).toFixed(2);
    const period = interval === 'yearly' ? '/year' : '/month';
    return { price: `$${price}`, period };
  };

  const availablePlatforms = [
    { key: 'facebook', name: 'Facebook', icon: '👥' },
    { key: 'instagram', name: 'Instagram', icon: '📷' },
    { key: 'twitter', name: 'Twitter', icon: '𝕏' },
    { key: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { key: 'pinterest', name: 'Pinterest', icon: '📌' },
    { key: 'tiktok', name: 'TikTok', icon: '🎵' },
    { key: 'youtube', name: 'YouTube', icon: '▶️' }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">إدارة الباقات</h1>
          <p className="text-sm text-gray-600">إدارة باقات الاشتراك والصلاحيات</p>
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
          <h1 className="text-2xl font-semibold text-gray-800">إدارة الباقات</h1>
          <p className="text-sm text-gray-600">إدارة باقات الاشتراك والصلاحيات</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          إضافة باقة جديدة
        </Button>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد باقات</h3>
            <p className="text-gray-600 mb-4">لم يتم إنشاء أي باقات بعد</p>
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              إضافة باقة جديدة
            </Button>
        </CardContent>
      </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const { price, period } = formatPrice(plan.priceCents, plan.interval);
            const permissions = plan.permissions || {};
            
            return (
              <Card key={plan.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.isActive ? 'نشط' : 'غير نشط'}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">{price}</span>
                    <span className="text-sm text-gray-600">{period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Platforms */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">المنصات الاجتماعية</h4>
                    <div className="space-y-2">
                      {/* Selected Platforms */}
                      <div className="flex flex-wrap gap-1">
                        {permissions.platforms?.map((platform) => {
                          const platformInfo = availablePlatforms.find(p => p.key === platform);
                          return (
                            <span key={platform} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {platformInfo?.icon} {platformInfo?.name}
                            </span>
                          );
                        })}
                      </div>
                      
                      {/* Unselected Platforms */}
                      {permissions.platforms && permissions.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {availablePlatforms
                            .filter(p => !permissions.platforms?.includes(p.key))
                            .map((platform) => (
                              <span key={platform.key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                {platform.icon} {platform.name}
                              </span>
                            ))}
                        </div>
                      )}
                      
                      {/* No Platforms Selected */}
                      {(!permissions.platforms || permissions.platforms.length === 0) && (
                        <div className="flex flex-wrap gap-1">
                          {availablePlatforms.map((platform) => (
                            <span key={platform.key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              {platform.icon} {platform.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">الصلاحيات والحدود</h4>
                    
                    {/* Monthly Posts */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">المنشورات الشهرية:</span>
                      <span className="text-xs font-bold text-blue-600">
                        {permissions.monthlyPosts === -1 ? 'غير محدود' : permissions.monthlyPosts || 0}
                      </span>
                    </div>

                    {/* WhatsApp Management */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">إدارة الواتساب:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canManageWhatsApp ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                            {permissions.whatsappMessagesPerMonth > 0 && (
                              <span className="text-xs text-gray-500">
                                ({permissions.whatsappMessagesPerMonth === -1 ? 'غير محدود' : permissions.whatsappMessagesPerMonth}/شهر)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Telegram Management */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">إدارة التليجرام:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canManageTelegram ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Salla Integration */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">تكامل سلة:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canSallaIntegration ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content Management */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">إدارة المحتوى:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canManageContent ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => openEditModal(plan)}
                      className="bg-blue-600 hover:bg-blue-700 flex-1"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      تعديل
                    </Button>
                    <Button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
        </CardContent>
      </Card>
            );
          })}
        </div>
      )}

      {/* Create Plan Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-green-600" />
              إضافة باقة جديدة
            </DialogTitle>
            <DialogDescription>
              إنشاء باقة جديدة مع تحديد الصلاحيات المطلوبة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-name">اسم الباقة</Label>
                <Input
                  id="plan-name"
                  placeholder="أدخل اسم الباقة"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="plan-price">السعر (بالسنت)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  placeholder="1000 = $10.00"
                  value={newPlan.priceCents}
                  onChange={(e) => setNewPlan({ ...newPlan, priceCents: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-interval">نوع الاشتراك</Label>
                <select
                  id="plan-interval"
                  value={newPlan.interval}
                  onChange={(e) => setNewPlan({ ...newPlan, interval: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="plan-active"
                  checked={newPlan.isActive}
                  onChange={(e) => setNewPlan({ ...newPlan, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="plan-active">الباقة نشطة</Label>
              </div>
            </div>

            {/* Platforms */}
            <div>
              <Label>المنصات المسموحة</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {availablePlatforms.map((platform) => (
                  <label key={platform.key} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={newPlan.permissions.platforms.includes(platform.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewPlan({
                            ...newPlan,
                            permissions: {
                              ...newPlan.permissions,
                              platforms: [...newPlan.permissions.platforms, platform.key]
                            }
                          });
                        } else {
                          setNewPlan({
                            ...newPlan,
                            permissions: {
                              ...newPlan.permissions,
                              platforms: newPlan.permissions.platforms.filter(p => p !== platform.key)
                            }
                          });
                        }
                      }}
                    />
                    <span>{platform.icon}</span>
                    <span className="text-sm">{platform.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Posting Limits */}
            <div>
              <Label htmlFor="monthly-posts">المنشورات الشهرية</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="monthly-posts"
                  type="number"
                  min="0"
                  placeholder="عدد المنشورات"
                  value={newPlan.permissions.monthlyPosts === -1 ? '' : newPlan.permissions.monthlyPosts}
                  onChange={(e) => setNewPlan({
                    ...newPlan,
                    permissions: { ...newPlan.permissions, monthlyPosts: parseInt(e.target.value) || 0 }
                  })}
                  disabled={newPlan.permissions.monthlyPosts === -1}
                />
                <Button
                  type="button"
                  variant={newPlan.permissions.monthlyPosts === -1 ? "default" : "outline"}
                  onClick={() => setNewPlan({
                    ...newPlan,
                    permissions: { ...newPlan.permissions, monthlyPosts: newPlan.permissions.monthlyPosts === -1 ? 0 : -1 }
                  })}
                  className="whitespace-nowrap"
                >
                  {newPlan.permissions.monthlyPosts === -1 ? 'غير محدود' : 'غير محدود'}
                </Button>
              </div>
              {newPlan.permissions.monthlyPosts === -1 && (
                <p className="text-xs text-gray-500 mt-1">غير محدود - يمكن النشر بدون حدود</p>
              )}
            </div>

            {/* Content Management */}
            <div>
              <Label>إدارة المحتوى</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canManageContent}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canManageContent: e.target.checked }
                    })}
                  />
                  <span>إدارة المحتوى</span>
                </label>
              </div>
            </div>

            {/* WhatsApp Management */}
            <div>
              <Label>إدارة الواتساب</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={newPlan.permissions.canManageWhatsApp}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        permissions: { ...newPlan.permissions, canManageWhatsApp: e.target.checked }
                      })}
                    />
                    <span>إدارة الواتساب</span>
                  </label>
                  {newPlan.permissions.canManageWhatsApp && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="عدد الرسائل شهرياً"
                        value={newPlan.permissions.whatsappMessagesPerMonth === -1 ? '' : newPlan.permissions.whatsappMessagesPerMonth}
                        onChange={(e) => setNewPlan({
                          ...newPlan,
                          permissions: { ...newPlan.permissions, whatsappMessagesPerMonth: parseInt(e.target.value) || 0 }
                        })}
                        disabled={newPlan.permissions.whatsappMessagesPerMonth === -1}
                      />
                      <Button
                        type="button"
                        variant={newPlan.permissions.whatsappMessagesPerMonth === -1 ? "default" : "outline"}
                        onClick={() => setNewPlan({
                          ...newPlan,
                          permissions: { ...newPlan.permissions, whatsappMessagesPerMonth: newPlan.permissions.whatsappMessagesPerMonth === -1 ? 0 : -1 }
                        })}
                        className="whitespace-nowrap"
                      >
                        {newPlan.permissions.whatsappMessagesPerMonth === -1 ? 'غير محدود' : 'غير محدود'}
                      </Button>
                    </div>
                  )}
                  {newPlan.permissions.canManageWhatsApp && newPlan.permissions.whatsappMessagesPerMonth === -1 && (
                    <p className="text-xs text-gray-500 mt-1">غير محدود - يمكن إرسال رسائل بدون حدود</p>
                  )}
                </div>
              </div>
            </div>

            {/* Telegram Management */}
            <div>
              <Label>إدارة التليجرام</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canManageTelegram}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canManageTelegram: e.target.checked }
                    })}
                  />
                  <span>إدارة التليجرام</span>
                </label>
              </div>
            </div>

            {/* Salla Integration */}
            <div>
              <Label>تكامل سلة</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canSallaIntegration}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canSallaIntegration: e.target.checked }
                    })}
                  />
                  <span>تكامل سلة</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setCreateModalOpen(false)}
                variant="outline"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreatePlan}
                disabled={!newPlan.name || !newPlan.priceCents}
                className="bg-green-600 hover:bg-green-700"
              >
                إنشاء الباقة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal - Similar structure but for editing */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              تعديل الباقة
            </DialogTitle>
            <DialogDescription>
              تعديل إعدادات الباقة: {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>

          {/* Similar form structure as create modal but with editPlan state */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plan-name">اسم الباقة</Label>
                <Input
                  id="edit-plan-name"
                  placeholder="أدخل اسم الباقة"
                  value={editPlan.name}
                  onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-plan-price">السعر (بالسنت)</Label>
                <Input
                  id="edit-plan-price"
                  type="number"
                  placeholder="1000 = $10.00"
                  value={editPlan.priceCents}
                  onChange={(e) => setEditPlan({ ...editPlan, priceCents: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plan-interval">نوع الاشتراك</Label>
                <select
                  id="edit-plan-interval"
                  value={editPlan.interval}
                  onChange={(e) => setEditPlan({ ...editPlan, interval: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-plan-active"
                  checked={editPlan.isActive}
                  onChange={(e) => setEditPlan({ ...editPlan, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-plan-active">الباقة نشطة</Label>
              </div>
            </div>

            {/* Platforms */}
            <div>
              <Label>المنصات المسموحة</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {availablePlatforms.map((platform) => (
                  <label key={platform.key} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={editPlan.permissions.platforms.includes(platform.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditPlan({
                            ...editPlan,
                            permissions: {
                              ...editPlan.permissions,
                              platforms: [...editPlan.permissions.platforms, platform.key]
                            }
                          });
                        } else {
                          setEditPlan({
                            ...editPlan,
                            permissions: {
                              ...editPlan.permissions,
                              platforms: editPlan.permissions.platforms.filter(p => p !== platform.key)
                            }
                          });
                        }
                      }}
                    />
                    <span>{platform.icon}</span>
                    <span className="text-sm">{platform.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Posting Limits */}
            <div>
              <Label htmlFor="edit-monthly-posts">المنشورات الشهرية</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="edit-monthly-posts"
                  type="number"
                  min="0"
                  placeholder="عدد المنشورات"
                  value={editPlan.permissions.monthlyPosts === -1 ? '' : editPlan.permissions.monthlyPosts}
                  onChange={(e) => setEditPlan({
                    ...editPlan,
                    permissions: { ...editPlan.permissions, monthlyPosts: parseInt(e.target.value) || 0 }
                  })}
                  disabled={editPlan.permissions.monthlyPosts === -1}
                />
                <Button
                  type="button"
                  variant={editPlan.permissions.monthlyPosts === -1 ? "default" : "outline"}
                  onClick={() => setEditPlan({
                    ...editPlan,
                    permissions: { ...editPlan.permissions, monthlyPosts: editPlan.permissions.monthlyPosts === -1 ? 0 : -1 }
                  })}
                  className="whitespace-nowrap"
                >
                  {editPlan.permissions.monthlyPosts === -1 ? 'غير محدود' : 'غير محدود'}
                </Button>
              </div>
              {editPlan.permissions.monthlyPosts === -1 && (
                <p className="text-xs text-gray-500 mt-1">غير محدود - يمكن النشر بدون حدود</p>
              )}
            </div>

            {/* Content Management */}
            <div>
              <Label>إدارة المحتوى</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canManageContent}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canManageContent: e.target.checked }
                    })}
                  />
                  <span>إدارة المحتوى</span>
                </label>
              </div>
            </div>

            {/* WhatsApp Management */}
            <div>
              <Label>إدارة الواتساب</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={editPlan.permissions.canManageWhatsApp}
                      onChange={(e) => setEditPlan({
                        ...editPlan,
                        permissions: { ...editPlan.permissions, canManageWhatsApp: e.target.checked }
                      })}
                    />
                    <span>إدارة الواتساب</span>
                  </label>
                  {editPlan.permissions.canManageWhatsApp && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="عدد الرسائل شهرياً"
                        value={editPlan.permissions.whatsappMessagesPerMonth === -1 ? '' : editPlan.permissions.whatsappMessagesPerMonth}
                        onChange={(e) => setEditPlan({
                          ...editPlan,
                          permissions: { ...editPlan.permissions, whatsappMessagesPerMonth: parseInt(e.target.value) || 0 }
                        })}
                        disabled={editPlan.permissions.whatsappMessagesPerMonth === -1}
                      />
                      <Button
                        type="button"
                        variant={editPlan.permissions.whatsappMessagesPerMonth === -1 ? "default" : "outline"}
                        onClick={() => setEditPlan({
                          ...editPlan,
                          permissions: { ...editPlan.permissions, whatsappMessagesPerMonth: editPlan.permissions.whatsappMessagesPerMonth === -1 ? 0 : -1 }
                        })}
                        className="whitespace-nowrap"
                      >
                        {editPlan.permissions.whatsappMessagesPerMonth === -1 ? 'غير محدود' : 'غير محدود'}
                      </Button>
                    </div>
                  )}
                  {editPlan.permissions.canManageWhatsApp && editPlan.permissions.whatsappMessagesPerMonth === -1 && (
                    <p className="text-xs text-gray-500 mt-1">غير محدود - يمكن إرسال رسائل بدون حدود</p>
                  )}
                </div>
              </div>
            </div>

            {/* Telegram Management */}
            <div>
              <Label>إدارة التليجرام</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canManageTelegram}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canManageTelegram: e.target.checked }
                    })}
                  />
                  <span>إدارة التليجرام</span>
                </label>
              </div>
            </div>

            {/* Salla Integration */}
            <div>
              <Label>تكامل سلة</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canSallaIntegration}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canSallaIntegration: e.target.checked }
                    })}
                  />
                  <span>تكامل سلة</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setEditModalOpen(false)}
                variant="outline"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleUpdatePlan}
                className="bg-blue-600 hover:bg-blue-700"
              >
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}