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
  createService,
  getUserServices,
  updateService,
  deleteService,
  type Service,
} from "@/lib/api";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MousePointerClick,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { showSuccess, showError } = useToast();
  
  const {
    canMarketServices,
    getMaxServices,
    hasActiveSubscription,
    loading: permissionsLoading,
  } = usePermissions();

  const [stats, setStats] = useState({
    currentCount: 0,
    maxServices: 0,
    canMarketServices: false,
    canCreateMore: false,
  });

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "SAR",
    purchaseLink: "",
    category: "",
    tags: "",
    isActive: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadServices();
  }, [token]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await getUserServices(token);
      setServices(res.services);
      setStats(res.stats);
    } catch (e: any) {
      setError(e.message);
      showError("خطأ", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("currency", formData.currency);
      formDataToSend.append("purchaseLink", formData.purchaseLink);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("isActive", formData.isActive.toString());
      
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim());
        formDataToSend.append("tags", JSON.stringify(tagsArray));
      }

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      await createService(token, formDataToSend);

      setCreateModalOpen(false);
      resetForm();
      loadServices();
      showSuccess("تم إنشاء الخدمة بنجاح!");
    } catch (e: any) {
      showError("خطأ في إنشاء الخدمة", e.message);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("currency", formData.currency);
      formDataToSend.append("purchaseLink", formData.purchaseLink);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("isActive", formData.isActive.toString());
      
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim());
        formDataToSend.append("tags", JSON.stringify(tagsArray));
      }

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      await updateService(token, selectedService.id, formDataToSend);

      setEditModalOpen(false);
      setSelectedService(null);
      resetForm();
      loadServices();
      showSuccess("تم تحديث الخدمة بنجاح!");
    } catch (e: any) {
      showError("خطأ في تحديث الخدمة", e.message);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setServiceToDelete(service);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService(token, serviceToDelete.id);
      loadServices();
      showSuccess("تم حذف الخدمة بنجاح!");
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
    } catch (e: any) {
      showError("خطأ في حذف الخدمة", e.message);
    }
  };

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setFormData({
      title: service.title,
      description: service.description || "",
      price: service.price.toString(),
      currency: service.currency,
      purchaseLink: service.purchaseLink || "",
      category: service.category || "",
      tags: service.tags ? service.tags.join(', ') : "",
      isActive: service.isActive,
    });
    setImageFile(null);
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      currency: "SAR",
      purchaseLink: "",
      category: "",
      tags: "",
      isActive: true,
    });
    setImageFile(null);
  };

  // Check permissions
  if (permissionsLoading || loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">إدارة الخدمات</h1>
          <p className="text-sm text-green-600">سوّق خدماتك للعملاء</p>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">إدارة الخدمات</h1>
          <p className="text-sm text-green-600">سوّق خدماتك للعملاء</p>
        </div>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 text-orange-800">
              <AlertCircle className="h-6 w-6" />
              <p className="text-lg font-medium">ليس لديك اشتراك نشط</p>
            </div>
            <p className="text-center text-orange-600 mt-2">
              للوصول إلى هذه الميزة، يرجى الاشتراك في إحدى باقاتنا.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canMarketServices()) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">إدارة الخدمات</h1>
          <p className="text-sm text-green-600">سوّق خدماتك للعملاء</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 text-red-800">
              <XCircle className="h-6 w-6" />
              <p className="text-lg font-medium">ليس لديك صلاحية لتسويق الخدمات</p>
            </div>
            <p className="text-center text-red-600 mt-2">
              هذه الميزة غير متوفرة في باقتك الحالية. يرجى ترقية باقتك للوصول إلى تسويق الخدمات.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">إدارة الخدمات</h1>
          <p className="text-sm text-green-600">سوّق خدماتك للعملاء</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
          className="primary-button"
          disabled={!stats.canCreateMore && stats.maxServices > 0}
        >
          {/* <Plus className="h-4 w-4 mr-1" /> */}
          إضافة خدمة جديدة
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold text-white">الخدمات الحالية</CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {stats.currentCount}
              {stats.maxServices > 0 && ` / ${stats.maxServices}`}
            </div>
            <p className="text-xs text-white">
              {stats.maxServices === 0 ? 'غير محدود' : `من ${stats.maxServices} متاحة`}
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold text-white">الخدمات النشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {services.filter(s => s.isActive).length}
            </div>
            <p className="text-xs text-white">جاهزة للعرض</p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold text-white">المشاهدات الكلية</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">
              {/* {services.reduce((sum, s) => sum + (s.viewsCount || 0), 0)} */}
              {services.reduce((sum, s) => sum + (s.clicksCount || 0), 0)}
            </div>
            <p className="text-xs text-white">عبر جميع الخدمات</p>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Package className="h-5 w-5 text-white" />
            خدماتي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">لا توجد خدمات بعد</p>
              <p className="text-gray-400 text-sm mb-4">ابدأ بإضافة خدمتك الأولى!</p>
              <Button
                onClick={() => {
                  resetForm();
                  setCreateModalOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                إضافة خدمة
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#011910] text-white border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">
                      الخدمة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">
                      السعر
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">
                      المشاهدات
                    </th>
                    {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      النقرات
                    </th> */}
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-secondry divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {service.image && (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${service.image}`}
                              alt={service.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {service.title}
                            </div>
                            {service.category && (
                              <div className="text-xs text-white">
                                {service.category}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {parseFloat(service.price.toString()).toFixed(2)} {service.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {service.isActive ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            نشط
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            غير نشط
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-white">
                          <Eye className="h-4 w-4" />
                          {/* {service.viewsCount || 0} */}
                          {service.clicksCount || 0}
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MousePointerClick className="h-4 w-4" />
                          {service.clicksCount || 0}
                        </div>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openEditModal(service)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteService(service.id)}
                            size="sm"
                            variant="secondary"
                            className="border-red-300 text-red-600 bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Create Service Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة خدمة جديدة</DialogTitle>
            <DialogDescription className="text-white">
              أضف تفاصيل الخدمة التي تريد تسويقها
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">عنوان الخدمة *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: تصميم شعار احترافي"
              />
            </div>

            <div>
              <Label htmlFor="description">وصف الخدمة</Label>
              <Textarea
              className="bg-[#011910]"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="اكتب وصفاً تفصيلياً للخدمة..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">السعر *</Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="currency">العملة</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#011910] appearance-none"
                >
                  <option value="SAR">ر.س (SAR)</option>
                  <option value="USD">$ (USD)</option>
                  <option value="EUR">€ (EUR)</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="purchaseLink">رابط الشراء</Label>
              <Input
                id="purchaseLink"
                type="url"
                value={formData.purchaseLink}
                onChange={(e) => setFormData({ ...formData, purchaseLink: e.target.value })}
                placeholder="https://example.com/buy"
              />
            </div>

            <div>
              <Label htmlFor="category">التصنيف</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="مثال: تصميم، برمجة، كتابة"
              />
            </div>

            <div>
              <Label htmlFor="tags">الوسوم (افصل بفواصل)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="مثال: تصميم, جرافيك, شعار"
              />
            </div>

            <div>
              <Label htmlFor="image">صورة الخدمة</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                نشط (سيتم عرض الخدمة مباشرة)
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                className="primary-button after:bg-red-600"
                onClick={() => setCreateModalOpen(false)}
                variant="secondary"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreateService}
                disabled={!formData.title || !formData.price}
                className="primary-button"
              >
                إنشاء الخدمة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Service Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الخدمة</DialogTitle>
            <DialogDescription className="text-white">
              قم بتحديث تفاصيل الخدمة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">عنوان الخدمة *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">وصف الخدمة</Label>
              <Textarea
              className="bg-[#011910]"
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">السعر *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-currency">العملة</Label>
                <select
                  id="edit-currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#011910] appearance-none"
                >
                  <option value="SAR">ر.س (SAR)</option>
                  <option value="USD">$ (USD)</option>
                  <option value="EUR">€ (EUR)</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-purchaseLink">رابط الشراء</Label>
              <Input
                id="edit-purchaseLink"
                type="url"
                value={formData.purchaseLink}
                onChange={(e) => setFormData({ ...formData, purchaseLink: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">التصنيف</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-tags">الوسوم (افصل بفواصل)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-image">صورة الخدمة (اختياري - لتحديث الصورة)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="edit-isActive" className="cursor-pointer">
                نشط (سيتم عرض الخدمة مباشرة)
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setEditModalOpen(false)}
                className="primary-button after:bg-red-600"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleUpdateService}
                disabled={!formData.title || !formData.price}
                className="primary-button"
              >
                حفظ التعديلات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Service Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">تأكيد الحذف</DialogTitle>
            <DialogDescription className="text-gray-300">
              هل أنت متأكد من حذف الخدمة "{serviceToDelete?.title}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setServiceToDelete(null);
              }}
              className="primary-button after:bg-gray-600"
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmDeleteService}
              className="primary-button after:bg-red-600"
            >
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
