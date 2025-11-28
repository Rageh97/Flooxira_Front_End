"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Checkbox 
} from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  UserX,
  Lock,
  Mail,
  Phone,
  Calendar,
  Shield,
  MessageSquare,
  Ticket,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users2,
  Megaphone
} from "lucide-react";
import { usePermissions } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import NoActiveSubscription from "@/components/NoActiveSubscription";
import { useToast } from "@/components/ui/toast-provider";


interface Employee {
  id: number;
  email: string;
  name: string;
  phone?: string;
  permissions: EmployeePermissions;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface EmployeePermissions {
  platforms: string[];
  canManageWhatsApp: boolean;
  whatsappMessagesPerMonth: number;
  canManageTelegram: boolean;
  canSallaIntegration: boolean;
  canManageContent: boolean;
  canManageCustomers: boolean;
  canMarketServices: boolean;
  maxServices: number;
  canManageEmployees: boolean;
  maxEmployees: number;
  canManageTickets: boolean;
}

interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
}

const PLATFORMS = [
  { value: 'facebook', label: 'فيسبوك' },
  { value: 'instagram', label: 'إنستغرام' },
  { value: 'twitter', label: 'تويتر' },
  { value: 'linkedin', label: 'لينكد إن' },
  // { value: 'pinterest', label: 'بينتيريست' },
  // { value: 'tiktok', label: 'تيك توك' },
  { value: 'youtube', label: 'يوتيوب' }
];

export default function EmployeesPage() {
  const { permissions, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
  const { getToken } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showSuccess, showError } = useToast();
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    permissions: {
      platforms: [] as string[],
      canManageWhatsApp: false,
      whatsappMessagesPerMonth: 0,
      canManageTelegram: false,
      canSallaIntegration: false,
      canManageContent: false,
      canManageCustomers: false,
      canMarketServices: false,
      maxServices: 0,
      canManageEmployees: false,
      maxEmployees: 0,
      canManageTickets: false
    }
  });

  // Check permissions
  const canManageEmployees = permissions?.canManageEmployees || false;
  const maxEmployees = permissions?.maxEmployees || 0;
  const canCreateMore = maxEmployees === 0 || (stats?.totalEmployees || 0) < maxEmployees;
  useEffect(() => {
    if (!permissionsLoading && !hasActiveSubscription) {
      showError("لا يوجد اشتراك نشط");
    }
  }, [hasActiveSubscription, permissionsLoading]);
  const loadEmployees = useCallback(async () => {
    if (!hasActiveSubscription || !canManageEmployees) return;
    
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      
      const response = await apiFetch<{ success: boolean; employees: any[]; pagination: any }>(`/api/employees?page=${currentPage}&search=${searchTerm}`, { authToken: token });
      if (response.success) {
        setEmployees(response.employees);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('خطأ في جلب الموظفين');
    } finally {
      setLoading(false);
    }
  }, [hasActiveSubscription, canManageEmployees, currentPage, searchTerm, getToken]);

  const loadStats = useCallback(async () => {
    if (!hasActiveSubscription || !canManageEmployees) return;
    
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await apiFetch<{ success: boolean; stats: any }>('/api/employees/stats', { authToken: token });
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [hasActiveSubscription, canManageEmployees, getToken]);

  const handleCreateEmployee = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await apiFetch<{ success: boolean; message?: string; employee?: any }>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(formData),
        authToken: token
      });

      if (response.success) {
        toast.success('تم إنشاء الموظف بنجاح');
        setIsCreateDialogOpen(false);
        resetForm();
        loadEmployees();
        loadStats();
      } else {
        toast.error(response.message || 'خطأ في إنشاء الموظف');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('خطأ في إنشاء الموظف');
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    try {
      const token = getToken();
      if (!token) return;
      
      const response = await apiFetch<{ success: boolean; message?: string; employee?: any }>(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          permissions: formData.permissions
        }),
        authToken: token
      });

      if (response.success) {
        toast.success('تم تحديث الموظف بنجاح');
        setIsEditDialogOpen(false);
        setEditingEmployee(null);
        resetForm();
        loadEmployees();
      } else {
        toast.error(response.message || 'خطأ في تحديث الموظف');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('خطأ في تحديث الموظف');
    }
  };

  const openDeleteDialog = (employee: Employee) => {
    setDeletingEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;

    try {
      const token = getToken();
      if (!token) return;
      
      const response = await apiFetch<{ success: boolean; message?: string }>(`/api/employees/${deletingEmployee.id}`, {
        method: 'DELETE',
        authToken: token
      });

      if (response.success) {
        toast.success('تم حذف الموظف بنجاح');
        setIsDeleteDialogOpen(false);
        setDeletingEmployee(null);
        loadEmployees();
        loadStats();
      } else {
        toast.error(response.message || 'خطأ في حذف الموظف');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('خطأ في حذف الموظف');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      permissions: {
        platforms: [],
        canManageWhatsApp: false,
        whatsappMessagesPerMonth: 0,
        canManageTelegram: false,
        canSallaIntegration: false,
        canManageContent: false,
        canManageCustomers: false,
        canMarketServices: false,
        maxServices: 0,
        canManageEmployees: false,
        maxEmployees: 0,
        canManageTickets: false
      }
    });
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      password: "",
      permissions: employee.permissions
    });
    setIsEditDialogOpen(true);
  };

  const handlePermissionChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        platforms: prev.permissions.platforms.includes(platform)
          ? prev.permissions.platforms.filter(p => p !== platform)
          : [...prev.permissions.platforms, platform]
      }
    }));
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (!hasActiveSubscription || !canManageEmployees) return;
    loadStats();
  }, [hasActiveSubscription, canManageEmployees, loadStats]);

  useEffect(() => {
    if (!hasActiveSubscription || !canManageEmployees) return;
    loadEmployees();
  }, [hasActiveSubscription, canManageEmployees, loadEmployees]);

  // Permission checks
  useEffect(() => {
    if (!hasActiveSubscription) {
      toast.error('تحتاج إلى اشتراك نشط للوصول إلى هذه الميزة');
      return;
    }

    if (!canManageEmployees) {
      toast.error('ليس لديك صلاحية إدارة الموظفين. يرجى الترقية إلى باقة تدعم هذه الميزة.');
      return;
    }
  }, [hasActiveSubscription, canManageEmployees]);

  // Show loading or redirect if no permissions


  if (hasActiveSubscription && !canManageEmployees) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="text-white text-lg">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* {!hasActiveSubscription && (
        <NoActiveSubscription 
          heading="إدارة الموظفين"
          featureName="إدارة الموظفين"
          className="container mx-auto p-6"
        />
      )} */}
      <div className={!hasActiveSubscription ? "opacity-50 pointer-events-none select-none grayscale-[0.5] space-y-6" : "space-y-6"}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">إدارة الموظفين</h1>
          <p className="text-gray-300 mt-2">إدارة موظفيك وصلاحياتهم</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={!canCreateMore}
              className="primary-button "
            >
              {/* <Plus className="w-4 h-4 mr-2" /> */}
              إضافة موظف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="اسم الموظف"
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="employee@example.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+966501234567"
                  />
                </div>
                <div>
                  <Label htmlFor="password">كلمة المرور *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="كلمة مرور قوية"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  الصلاحيات
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Communication & Support */}
                  <Card className="bg-fixed-40 border-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        التواصل والدعم
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="whatsapp"
                          checked={formData.permissions.canManageWhatsApp}
                          onCheckedChange={(checked) => handlePermissionChange('canManageWhatsApp', checked)}
                        />
                        <Label htmlFor="whatsapp" className="cursor-pointer">إدارة الواتساب</Label>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="telegram"
                          checked={formData.permissions.canManageTelegram}
                          onCheckedChange={(checked) => handlePermissionChange('canManageTelegram', checked)}
                        />
                        <Label htmlFor="telegram" className="cursor-pointer">إدارة التليجرام</Label>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="tickets"
                          checked={formData.permissions.canManageTickets}
                          onCheckedChange={(checked) => handlePermissionChange('canManageTickets', checked)}
                        />
                        <Label htmlFor="tickets" className="cursor-pointer">المحادثة المباشرة والتذاكر</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Management & Operations */}
                  <Card className="bg-fixed-40 border-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        الإدارة والعمليات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="salla"
                          checked={formData.permissions.canSallaIntegration}
                          onCheckedChange={(checked) => handlePermissionChange('canSallaIntegration', checked)}
                        />
                        <Label htmlFor="salla" className="cursor-pointer">تكامل سلة</Label>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="content"
                          checked={formData.permissions.canManageContent}
                          onCheckedChange={(checked) => handlePermissionChange('canManageContent', checked)}
                        />
                        <Label htmlFor="content" className="cursor-pointer">إدارة المحتوى</Label>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="customers"
                          checked={formData.permissions.canManageCustomers}
                          onCheckedChange={(checked) => handlePermissionChange('canManageCustomers', checked)}
                        />
                        <Label htmlFor="customers" className="cursor-pointer">إدارة العملاء</Label>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="services"
                          checked={formData.permissions.canMarketServices}
                          onCheckedChange={(checked) => handlePermissionChange('canMarketServices', checked)}
                        />
                        <Label htmlFor="services" className="cursor-pointer">تسويق الخدمات</Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Platforms */}
                <Card className="bg-fixed-40 border-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                      <Megaphone className="w-4 h-4" />
                      المنصات الاجتماعية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PLATFORMS.map(platform => (
                        <div key={platform.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Checkbox
                            id={platform.value}
                            checked={formData.permissions.platforms.includes(platform.value)}
                            onCheckedChange={() => handlePlatformToggle(platform.value)}
                          />
                          <Label htmlFor={platform.value} className="text-sm cursor-pointer">
                            {platform.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsCreateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateEmployee}>
                  إنشاء الموظف
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-border border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg text-white font-medium">إجمالي الموظفين</CardTitle>
              <Users className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl text-white font-bold">{stats.totalEmployees}</div>
              {maxEmployees > 0 && (
                <p className="text-xs text-text-primary">
                  من أصل {maxEmployees}
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card className="gradient-border border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg text-white font-medium">نشط</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-500">{stats.activeEmployees}</div>
              <p className="text-xs text-text-primary">آخر 7 أيام</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-border border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg text-white font-medium">غير نشط</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-500">{stats.inactiveEmployees}</div>
              <p className="text-xs text-text-primary">أكثر من 7 أيام</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="البحث في الموظفين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        {/* <Button onClick={loadEmployees} variant="secondary">
          بحث
        </Button> */}
      </div>

      {/* Employees Table */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="text-lg text-white font-medium">قائمة الموظفين</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              لا يوجد موظفين
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الصلاحيات</TableHead>
                  <TableHead>آخر دخول</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow className="" key={employee.id}>
                    <TableCell className="font-medium text-white">{employee.name}</TableCell>
                    <TableCell className="text-text-primary font-medium">{employee.email}</TableCell>
                    <TableCell className="text-white">{employee.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/* Social Media Platforms */}
                        {employee.permissions.platforms.map(platform => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {PLATFORMS.find(p => p.value === platform)?.label || platform}
                          </Badge>
                        ))}
                        
                        {/* Tickets & Live Chat */}
                        {employee.permissions.canManageTickets && (
                          <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">محادثة وتذاكر</Badge>
                        )}

                        {/* WhatsApp */}
                        {employee.permissions.canManageWhatsApp && (
                          <Badge variant="secondary" className="text-xs">واتساب</Badge>
                        )}
                        
                        {/* Telegram */}
                        {employee.permissions.canManageTelegram && (
                          <Badge variant="secondary" className="text-xs">تليجرام</Badge>
                        )}
                        
                        {/* Salla Integration */}
                        {employee.permissions.canSallaIntegration && (
                          <Badge variant="secondary" className="text-xs">سلة</Badge>
                        )}
                        
                        {/* Content Management */}
                        {employee.permissions.canManageContent && (
                          <Badge variant="secondary" className="text-xs">محتوى</Badge>
                        )}
                        
                        {/* Customer Management */}
                        {employee.permissions.canManageCustomers && (
                          <Badge variant="secondary" className="text-xs">عملاء</Badge>
                        )}
                        
                        {/* Services Marketing */}
                        {employee.permissions.canMarketServices && (
                          <Badge variant="secondary" className="text-xs">خدمات</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-text-primary font-medium">
                      {employee.lastLoginAt 
                        ? new Date(employee.lastLoginAt).toLocaleDateString('en-US')
                        : 'لم يسجل دخول'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? "default" : "destructive"}>
                        {employee.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(employee)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            السابق
          </Button>
          <span className="flex items-center px-4">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الموظف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">الاسم *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                الصلاحيات
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Communication & Support */}
                <Card className="bg-fixed-40 border-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      التواصل والدعم
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="edit-whatsapp"
                        checked={formData.permissions.canManageWhatsApp}
                        onCheckedChange={(checked) => handlePermissionChange('canManageWhatsApp', checked)}
                      />
                      <Label htmlFor="edit-whatsapp" className="cursor-pointer">إدارة الواتساب</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="edit-telegram"
                        checked={formData.permissions.canManageTelegram}
                        onCheckedChange={(checked) => handlePermissionChange('canManageTelegram', checked)}
                      />
                      <Label htmlFor="edit-telegram" className="cursor-pointer">إدارة التليجرام</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="edit-tickets"
                        checked={formData.permissions.canManageTickets}
                        onCheckedChange={(checked) => handlePermissionChange('canManageTickets', checked)}
                      />
                      <Label htmlFor="edit-tickets" className="cursor-pointer">المحادثة المباشرة والتذاكر</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Management & Operations */}
                <Card className="bg-fixed-40 border-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      الإدارة والعمليات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="edit-salla"
                        checked={formData.permissions.canSallaIntegration}
                        onCheckedChange={(checked) => handlePermissionChange('canSallaIntegration', checked)}
                      />
                      <Label htmlFor="edit-salla" className="cursor-pointer">تكامل سلة</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="edit-content"
                        checked={formData.permissions.canManageContent}
                        onCheckedChange={(checked) => handlePermissionChange('canManageContent', checked)}
                      />
                      <Label htmlFor="edit-content" className="cursor-pointer">إدارة المحتوى</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="edit-customers"
                        checked={formData.permissions.canManageCustomers}
                        onCheckedChange={(checked) => handlePermissionChange('canManageCustomers', checked)}
                      />
                      <Label htmlFor="edit-customers" className="cursor-pointer">إدارة العملاء</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="edit-services"
                        checked={formData.permissions.canMarketServices}
                        onCheckedChange={(checked) => handlePermissionChange('canMarketServices', checked)}
                      />
                      <Label htmlFor="edit-services" className="cursor-pointer">تسويق الخدمات</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Platforms */}
              <Card className="bg-fixed-40 border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    المنصات الاجتماعية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PLATFORMS.map(platform => (
                      <div key={platform.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id={`edit-${platform.value}`}
                          checked={formData.permissions.platforms.includes(platform.value)}
                          onCheckedChange={() => handlePlatformToggle(platform.value)}
                        />
                        <Label htmlFor={`edit-${platform.value}`} className="text-sm cursor-pointer">
                          {platform.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleUpdateEmployee}>
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-text-primary">
              هل أنت متأكد من حذف الموظف <strong>{deletingEmployee?.name}</strong>؟
            </p>
            <p className="text-sm text-red-600">
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex gap-2 justify-end space-x-2">
              <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button variant="destructive" onClick={handleDeleteEmployee}>
                حذف الموظف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
