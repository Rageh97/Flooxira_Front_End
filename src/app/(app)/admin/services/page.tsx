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
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

interface Service {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  purchaseLink: string | null;
  image: string | null;
  category: string | null;
  tags: string[] | null;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  viewsCount: number;
  clicksCount: number;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    setCurrentPage(1); // Reset to page 1 when filter changes
  }, [token, filter]);

  useEffect(() => {
    if (!token) return;
    loadServices();
  }, [token, filter, currentPage]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/services?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("فشل في جلب الخدمات");

      const data = await response.json();
      setServices(data.services || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error: any) {
      showError("خطأ", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (serviceId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${serviceId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("فشل في الموافقة على الخدمة");

      showSuccess("تمت الموافقة على الخدمة بنجاح!");
      loadServices();
      loadStatistics(); // Refresh statistics
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedService) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${selectedService.id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (!response.ok) throw new Error("فشل في رفض الخدمة");

      showSuccess("تم رفض الخدمة");
      setRejectModalOpen(false);
      setSelectedService(null);
      setRejectionReason("");
      loadServices();
      loadStatistics(); // Refresh statistics
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const openRejectModal = (service: Service) => {
    setSelectedService(service);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const [allStats, setAllStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  // Load statistics
  useEffect(() => {
    if (!token) return;
    loadStatistics();
  }, [token]);

  const loadStatistics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/services`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const allServices = data.services || [];
      setAllStats({
        pending: allServices.filter((s: Service) => s.approvalStatus === 'pending').length,
        approved: allServices.filter((s: Service) => s.approvalStatus === 'approved').length,
        rejected: allServices.filter((s: Service) => s.approvalStatus === 'rejected').length,
        total: allServices.length,
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            قيد المراجعة
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            موافق عليها
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            مرفوضة
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">إدارة الخدمات</h1>
          <p className="text-sm text-green-600">الموافقة على الخدمات أو رفضها</p>
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
        <h1 className="text-2xl font-semibold text-white">إدارة الخدمات</h1>
        <p className="text-sm text-green-600">الموافقة على الخدمات أو رفضها</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div onClick={() => setFilter('all')} className="cursor-pointer">
          <Card className="gradient-border hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold text-white">جميع الخدمات</CardTitle>
              <Package className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{allStats.total}</div>
            </CardContent>
          </Card>
        </div>

        <div onClick={() => setFilter('pending')} className="cursor-pointer">
          <Card className="gradient-border hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold text-white">قيد المراجعة</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600">{allStats.pending}</div>
            </CardContent>
          </Card>
        </div>

        <div onClick={() => setFilter('approved')} className="cursor-pointer">
          <Card className="gradient-border hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold text-white">موافق عليها</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{allStats.approved}</div>
            </CardContent>
          </Card>
        </div>

        <div onClick={() => setFilter('rejected')} className="cursor-pointer">
          <Card className="gradient-border hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold text-white">مرفوضة</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{allStats.rejected}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="gradient-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'secondary'}
                className={filter === 'all' ? 'primary-button' : ''}
              >
                الكل
              </Button>
              <Button
                onClick={() => setFilter('pending')}
                variant={filter === 'pending' ? 'default' : 'secondary'}
                className={filter === 'pending' ? 'primary-button' : ''}
              >
                قيد المراجعة
              </Button>
              <Button
                onClick={() => setFilter('approved')}
                variant={filter === 'approved' ? 'default' : 'secondary'}
                className={filter === 'approved' ? 'primary-button' : ''}
              >
                موافق عليها
              </Button>
              <Button
                onClick={() => setFilter('rejected')}
                variant={filter === 'rejected' ? 'default' : 'secondary'}
                className={filter === 'rejected' ? 'primary-button' : ''}
              >
                مرفوضة
              </Button>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ابحث بالعنوان أو اسم المستخدم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="gradient-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">الخدمات</CardTitle>
            <span className="text-sm text-gray-400">
              عرض {filteredServices.length} من {totalCount} خدمة
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد خدمات</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#011910] text-white border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">
                        الصورة
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">
                        العنوان
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">
                        المستخدم
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">
                        السعر
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">
                        التصنيف
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">
                        المشاهدات
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">
                        الحالة
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-secondry divide-y divide-gray-200">
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="hover:bg-[#022015]">
                        {/* Image */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {service.image ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${service.image}`}
                              alt={service.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </td>

                        {/* Title & Description */}
                        <td className="px-4 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-white truncate">
                              {service.title}
                            </div>
                            {service.description && (
                              <div className="text-xs text-gray-400 truncate">
                                {service.description}
                              </div>
                            )}
                            {service.rejectionReason && (
                              <div className="text-xs text-red-400 mt-1 truncate">
                                سبب الرفض: {service.rejectionReason}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-4 py-4">
                          <div className="text-sm text-white">{service.user.name}</div>
                          <div className="text-xs text-gray-400">{service.user.email}</div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {parseFloat(service.price.toString()).toFixed(2)} {service.currency}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {service.category || '-'}
                          </div>
                        </td>

                        {/* Views */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Eye className="h-4 w-4" />
                            {service.clicksCount}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(service.approvalStatus)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {service.approvalStatus === 'pending' ? (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(service.id)}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => openRejectModal(service)}
                                variant="secondary"
                                size="sm"
                                className="border-red-300 text-red-600 bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    صفحة {currentPage} من {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">رفض الخدمة</DialogTitle>
            <DialogDescription className="text-gray-300">
              يرجى تحديد سبب رفض الخدمة "{selectedService?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">سبب الرفض *</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اكتب سبب الرفض..."
                rows={4}
                className="bg-[#011910]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedService(null);
                  setRejectionReason("");
                }}
                className="primary-button after:bg-gray-600"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="primary-button after:bg-red-600"
              >
                رفض الخدمة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

