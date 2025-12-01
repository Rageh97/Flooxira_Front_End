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
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import Loader from "@/components/Loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import NoActiveSubscription from "@/components/NoActiveSubscription";
import { useTutorials } from "@/hooks/useTutorials";
import { TutorialVideoModal } from "@/components/TutorialVideoModal";
import { Tutorial } from "@/types/tutorial";
import { BookOpen } from "lucide-react";
import { resolveServiceImageUrl } from "@/lib/media";

interface ServiceWithApproval extends Service {
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceWithApproval[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const { tutorials, getTutorialByCategory, incrementViews } = useTutorials();
  const handleShowTutorial = () => {
    const servicesTutorial = 
      getTutorialByCategory('Services') || 
      getTutorialByCategory('خدمات') || 
      getTutorialByCategory('Services') ||
      getTutorialByCategory('خدمات') ||
      tutorials.find(t => 
        t.title.toLowerCase().includes('خدمات') ||
        t.title.toLowerCase().includes('Services') ||
        t.category.toLowerCase().includes('خدمات') ||
        t.category.toLowerCase().includes('Services')
      ) || null;
    
    if (servicesTutorial) {
      setSelectedTutorial(servicesTutorial);
      incrementViews(servicesTutorial.id);
    } else {
      showError("لم يتم العثور على شرح خاص بالخدمات");
    }
  };
  const {
    canMarketServices,
    getMaxServices,
    hasActiveSubscription,
    loading: permissionsLoading,
  } = usePermissions();

  useEffect(() => {
    if (!permissionsLoading && !hasActiveSubscription) {
      showError("لا يوجد اشتراك نشط");
    }
  }, [hasActiveSubscription, permissionsLoading]);

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
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadServices();
    loadCategories();
  }, [token]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await getUserServices(token);
      setServices(res.services);
      setStats(res.stats);
    } catch (e: any) {
      setError(e.message);
      // showError("خطأ", e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/service-categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCreateService = async () => {
    try {
      setIsSubmitting(true);
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
      showSuccess("تم إنشاء الخدمة بنجاح! الخدمة الآن قيد الانتظار للموافقة من الإدارة.");
    } catch (e: any) {
      showError("خطأ في إنشاء الخدمة", e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;

    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
        
        <Loader text="جاري التحقق من الصلاحيات..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }



  if (hasActiveSubscription && !canMarketServices()) {
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
      {/* {!hasActiveSubscription && (
        <NoActiveSubscription 
          heading="إدارة الخدمات"
          featureName="إدارة الخدمات"
          className="space-y-8"
        />
      )} */}
      <div className={!hasActiveSubscription ? "opacity-50 pointer-events-none select-none grayscale-[0.5] space-y-8" : "space-y-8"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-white">إدارة الخدمات</h1>
          <p className="text-sm text-primary mt-2">سوّق خدماتك للعملاء</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleShowTutorial} 
            variant="secondary"
            className="flex items-center gap-2 primary-button">
            <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <p> شرح الميزة</p>
            </div>
          </Button>
        
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
            <div className="text-4xl font-bold text-primary">
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
              <p className="text-yellow-500 text-lg mb-2">لا توجد خدمات بعد</p>
              <p className="text-primary text-sm mb-4">ابدأ بإضافة خدمتك الأولى!</p>
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
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead >
                      الخدمة
                    </TableHead>
                    <TableHead >
                      السعر
                    </TableHead>
                    <TableHead >
                      رابط الخدمة
                    </TableHead>
                    <TableHead >
                      الحالة
                    </TableHead>
                    <TableHead >
                      المشاهدات
                    </TableHead>
                    <TableHead >
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody >
                  {services.map((service) => {
                    const imageUrl = resolveServiceImageUrl(service.image);
                    return (
                      <TableRow key={service.id} className="">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {imageUrl && (
                            <img
                              src={imageUrl}
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
                            {service.rejectionReason && (
                              <div className="text-xs text-red-400 mt-1">
                                سبب الرفض: {service.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-primary">
                          {parseFloat(service.price.toString()).toFixed(2)} {service.currency}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        {service.purchaseLink ? (
                          <a
                            href={service.purchaseLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            رابط
                          </a>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-4 whitespace-nowrap">
                        <div className="flex flex-col  gap-1">
                          {/* Show approval status first */}
                          {service.approvalStatus === 'pending' && (
                            <span className="px-2 py-1 text-xs w-fit font-medium rounded-full bg-yellow-100 text-yellow-800">
                              قيد الانتظار
                            </span>
                          )}
                          {service.approvalStatus === 'approved' && (
                            <>
                              {service.isActive ? (
                                <span className="px-2 py-1 w-fit text-xs  font-medium rounded-full bg-green-100 text-green-800">
                                  نشط
                                </span>
                              ) : (
                                <span className="px-2 py-1 w-fit text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  غير نشط
                                </span>
                              )}
                            </>
                          )}
                          {service.approvalStatus === 'rejected' && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              مرفوضة
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-white">
                          <Eye className="h-4 w-4" />
                          {/* {service.viewsCount || 0} */}
                          {service.clicksCount || 0}
                        </div>
                      </TableCell>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MousePointerClick className="h-4 w-4" />
                          {service.clicksCount || 0}
                        </div>
                      </td> */}
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {service.approvalStatus !== 'approved' && (
                            <Button
                              onClick={() => openEditModal(service)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteService(service.id)}
                            size="sm"
                            variant="secondary"
                            className="border-red-300 text-red-600 bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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

          {/* Notice about approval */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">ملاحظة هامة:</p>
              <p>الخدمة ستكون قيد الانتظار حتى يتم الموافقة عليها .</p>
            </div>
          </div>

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

            {/* <div>
              <Label htmlFor="description">وصف الخدمة</Label>
              <Textarea
              className="bg-[#011910]"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="اكتب وصفاً تفصيلياً للخدمة..."
                rows={4}
              />
            </div> */}

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
              <Label htmlFor="category">التصنيف *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#011910] text-white appearance-none"
              >
                <option value="">اختر تصنيفاً</option>
                {categories.length === 0 ? (
                  <option value="" disabled>لا توجد تصنيفات متاحة</option>
                ) : (
                  categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))
                )}
              </select>
            </div>

            {/* <div>
              <Label htmlFor="tags">الوسوم (افصل بفواصل)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="مثال: تصميم, جرافيك, شعار"
              />
            </div> */}

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
                disabled={!formData.title || !formData.price || !formData.category || isSubmitting}
                className="primary-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  "إنشاء الخدمة"
                )}
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

            {/* <div>
              <Label htmlFor="edit-description">وصف الخدمة</Label>
              <Textarea
              className="bg-[#011910]"
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div> */}

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
              <Label htmlFor="edit-category">التصنيف *</Label>
              <select
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#011910] text-white appearance-none"
              >
                <option value="">اختر تصنيفاً</option>
                {categories.length === 0 ? (
                  <option value="" disabled>لا توجد تصنيفات متاحة</option>
                ) : (
                  categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))
                )}
              </select>
            </div>

            {/* <div>
              <Label htmlFor="edit-tags">الوسوم (افصل بفواصل)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div> */}

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
                disabled={!formData.title || !formData.price || isSubmitting}
                className="primary-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ التعديلات"
                )}
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
      <TutorialVideoModal
        tutorial={selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
        onViewIncrement={incrementViews}
      />
    </div>
  );
}
