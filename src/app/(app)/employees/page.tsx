"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Checkbox 
} from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Trash2, 
  Users, 
  UserCheck, 
  UserX,
  Shield,
  MessageSquare,
  LayoutDashboard,
  Megaphone,
  Clock,
  Briefcase,
  DollarSign,
  Coffee,
  Trophy
} from "lucide-react";
import { usePermissions } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import NoActiveSubscription from "@/components/NoActiveSubscription";
import { useToast } from "@/components/ui/toast-provider";
import { useTutorials } from "@/hooks/useTutorials";
import { TutorialVideoModal } from "@/components/TutorialVideoModal";
import { Tutorial } from "@/types/tutorial";
import AnimatedTutorialButton from "@/components/YoutubeButton";
import EmployeeDashboard from "@/components/employees/EmployeeDashboard";
import AttendanceManagement from "@/components/employees/AttendanceManagement";
import SalaryManagement from "@/components/employees/SalaryManagement";
import LeaveManagement from "@/components/employees/LeaveManagement";
import PointsSystem from "@/components/employees/PointsSystem";

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
  canUseEventsPlugin: boolean;
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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);
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
      canManageTickets: false,
      canUseEventsPlugin: false
    }
  });

  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const { tutorials, getTutorialByCategory, incrementViews } = useTutorials();
  
  const handleShowTutorial = () => {
    const employeesTutorial = 
      getTutorialByCategory('Employees') || 
      getTutorialByCategory('موظفين') || 
      tutorials.find(t => 
        t.title.toLowerCase().includes('موظفين') ||
        t.title.toLowerCase().includes('Employees')
      ) || null;
    
    if (employeesTutorial) {
      setSelectedTutorial(employeesTutorial);
      incrementViews(employeesTutorial.id);
    } else {
      showError("لم يتم العثور على شرح خاص بالموظفين");
    }
  };

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

  const validateForm = () => {
    // التحقق من الاسم
    if (!formData.name || formData.name.trim().length < 2) {
      showError('يجب إدخال اسم صحيح (حرفين على الأقل)');
      return false;
    }

    // التحقق من البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      showError('يجب إدخال بريد إلكتروني صحيح');
      return false;
    }

    // التحقق من كلمة المرور (فقط عند الإنشاء)
    if (!editingEmployee && (!formData.password || formData.password.length < 8)) {
      showError('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
      return false;
    }

    // التحقق من رقم الهاتف (اختياري ولكن إذا تم إدخاله يجب أن يكون صحيحاً)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone) || formData.phone.length < 10) {
        showError('يجب إدخال رقم هاتف صحيح (10 أرقام على الأقل)');
        return false;
      }
    }

    return true;
  };

  const handleCreateEmployee = async () => {
    if (!validateForm()) return;

    try {
      const token = getToken();
      if (!token) return;
      
      const response = await apiFetch<{ success: boolean; message?: string; employee?: any }>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(formData),
        authToken: token
      });

      if (response.success) {
        showSuccess('تم إنشاء الموظف بنجاح');
        setIsCreateDialogOpen(false);
        resetForm();
        loadEmployees();
        loadStats();
      } else {
        showError(response.message || 'خطأ في إنشاء الموظف');
      }
    } catch (error: any) {
      console.error('Error creating employee:', error);
      showError(error.message || 'خطأ في إنشاء الموظف');
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
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(error.message || 'خطأ في تحديث الموظف');
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
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast.error(error.message || 'خطأ في حذف الموظف');
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
        canManageTickets: false,
        canUseEventsPlugin: false
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

  useEffect(() => {
    if (!hasActiveSubscription || !canManageEmployees) return;
    loadStats();
    loadEmployees();
  }, [hasActiveSubscription, canManageEmployees, loadEmployees, loadStats]);

  if (hasActiveSubscription && !canManageEmployees) {
    return (
      <NoActiveSubscription
      heading="" 
        featureName="إدارة الموظفين"
        className="container mx-auto p-6"
      />
    );
  }

  return (
    <div  className={`w-full space-y-6 ${!hasActiveSubscription ? "opacity-50 pointer-events-none select-none grayscale-[0.5]" : ""}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-2 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">إدارة الموظفين</h1>
          <Badge className="bg-yellow-500/20 text-white">سيتوفر المزيد من المميزات القوية داخل نظام ادارة الموظفين قريبا...</Badge>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedTutorialButton onClick={handleShowTutorial} text1="شرح الميزة" text2="شاهد" />
        </div>
      </div>

      <Tabs dir="rtl" defaultValue="employees" className="space-y-6">
        <TabsList className="bg-secondry p-1 rounded-xl w-full flex-wrap h-auto justify-start gap-2">
          {/* <TabsTrigger value="dashboard" className="data-[state=active]:bg-text-primary text-white data-[state=active]:text-black gap-2">
            <LayoutDashboard className="h-4 w-4" />
            الرئيسية
          </TabsTrigger> */}
          <TabsTrigger value="employees" className="data-[state=active]:bg-text-primary text-white data-[state=active]:text-black gap-2">
            <Users className="h-4 w-4" />
            الموظفين
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-text-primary text-white data-[state=active]:text-black gap-2">
            <Clock className="h-4 w-4" />
            الحضور والانصراف
          </TabsTrigger>
          {/* <TabsTrigger value="salary" className="data-[state=active]:bg-text-primary text-white data-[state=active]:text-black gap-2">
            <DollarSign className="h-4 w-4" />
            الرواتب
          </TabsTrigger>
          <TabsTrigger value="leaves" className="data-[state=active]:bg-text-primary text-white data-[state=active]:text-black gap-2">
            <Coffee className="h-4 w-4" />
            الإجازات
          </TabsTrigger>
          <TabsTrigger value="points" className="data-[state=active]:bg-text-primary text-white data-[state=active]:text-black gap-2">
            <Trophy className="h-4 w-4" />
            نقاط التحفيز
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <EmployeeDashboard />
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="flex justify-between items-center">
            
            <div className="relative flex-1 max-w-sm ml-4">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في الموظفين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-10"
              />
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canCreateMore} className="primary-button">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 ml-2" />
                  إضافة موظف جديد
                  </div>
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
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Checkbox
                              id="events-plugin"
                              checked={formData.permissions.canUseEventsPlugin}
                              onCheckedChange={(checked) => handlePermissionChange('canUseEventsPlugin', checked)}
                            />
                            <Label htmlFor="events-plugin" className="cursor-pointer">الربط البرمجي (Webhook + API)</Label>
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
                          {/* <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Checkbox
                              id="salla"
                              checked={formData.permissions.canSallaIntegration}
                              onCheckedChange={(checked) => handlePermissionChange('canSallaIntegration', checked)}
                            />
                            <Label htmlFor="salla" className="cursor-pointer">تكامل سلة</Label>
                          </div> */}
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
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Checkbox
                                id="employees"
                                checked={formData.permissions.canManageEmployees}
                                onCheckedChange={(checked) => handlePermissionChange('canManageEmployees', checked)}
                              />
                              <Label htmlFor="employees" className="cursor-pointer">إدارة الموظفين</Label>
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

                  <div className="flex justify-end gap-2">
                    <Button className="primary-button after:bg-red-500" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button className="primary-button" onClick={handleCreateEmployee}>
                      إنشاء الموظف
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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
                      <TableHead className="hidden md:table-cell">الهاتف</TableHead>
                      <TableHead className="hidden md:table-cell">الصلاحيات</TableHead>
                      <TableHead className="hidden md:table-cell">آخر دخول</TableHead>
                      <TableHead className="hidden md:table-cell">الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium text-white">{employee.name}</TableCell>
                        <TableCell className="text-text-primary font-medium">{employee.email}</TableCell>
                        <TableCell className="text-white hidden md:table-cell">{employee.phone || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {employee.permissions.platforms.slice(0, 2).map(platform => (
                              <Badge key={platform} variant="secondary" className="text-[10px] px-1 h-5">
                                {PLATFORMS.find(p => p.value === platform)?.label || platform}
                              </Badge>
                            ))}
                            {employee.permissions.platforms.length > 2 && (
                              <Badge variant="secondary" className="text-[10px] px-1 h-5">+{employee.permissions.platforms.length - 2}</Badge>
                            )}
                            {employee.permissions.canManageWhatsApp && <Badge variant="secondary" className="text-[10px] px-1 h-5 ">واتساب</Badge>}
                            {employee.permissions.canManageTelegram && <Badge variant="secondary" className="text-[10px] px-1 h-5 ">تليجرام</Badge>}
                            {employee.permissions.canManageTickets && <Badge variant="secondary" className="text-[10px] px-1 h-5 ">تذاكر</Badge>}
                            {employee.permissions.canManageContent && <Badge variant="secondary" className="text-[10px] px-1 h-5 ">محتوى</Badge>}
                            {employee.permissions.canManageCustomers && <Badge variant="secondary" className="text-[10px] px-1 h-5 ">عملاء</Badge>}
                            {employee.permissions.canMarketServices && <Badge variant="secondary" className="text-[10px] px-1 h-5 ">خدمات</Badge>}
                            {employee.permissions.canSallaIntegration && <Badge variant="secondary" className="text-[10px] px-1 h-5 ">سلة</Badge>}
                            {employee.permissions.canManageEmployees && <Badge variant="secondary" className="text-[10px] px-1 h-5 ">إدارة</Badge>}
                            {employee.permissions.canUseEventsPlugin && <Badge variant="secondary" className="text-[10px] px-1 h-5 ">Webhook</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-text-primary font-medium hidden md:table-cell">
                          {employee.lastLoginAt 
                            ? new Date(employee.lastLoginAt).toLocaleDateString('ar-SA')
                            : 'لم يسجل دخول'
                          }
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={employee.isActive ? "default" : "destructive"}>
                            {employee.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="md:hidden"
                              onClick={() => {
                                setEmployeeToView(employee);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                            </Button>
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
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceManagement />
        </TabsContent>

        <TabsContent value="salary">
          <SalaryManagement />
        </TabsContent>

        <TabsContent value="leaves">
          <LeaveManagement />
        </TabsContent>

        <TabsContent value="points">
          <PointsSystem />
        </TabsContent>
      </Tabs>

      <TutorialVideoModal
        tutorial={selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
        onViewIncrement={incrementViews}
      />
      
      {/* Edit & Delete Dialogs remain similar but simplified here for brevity as they are mainly for the basic CRUD */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">الاسم *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="اسم الموظف"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">رقم الهاتف</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+966501234567"
                  />
                </div>
              </div>

              {/* Permissions Section Re-used for Edit */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  تعديل الصلاحيات
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
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="edit-events-plugin"
                          checked={formData.permissions.canUseEventsPlugin}
                          onCheckedChange={(checked) => handlePermissionChange('canUseEventsPlugin', checked)}
                        />
                        <Label htmlFor="edit-events-plugin" className="cursor-pointer">الربط البرمجي (Webhook + API)</Label>
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
                      {/* <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="edit-salla"
                          checked={formData.permissions.canSallaIntegration}
                          onCheckedChange={(checked) => handlePermissionChange('canSallaIntegration', checked)}
                        />
                        <Label htmlFor="edit-salla" className="cursor-pointer">تكامل سلة</Label>
                      </div> */}
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
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id="edit-employees"
                          checked={formData.permissions.canManageEmployees}
                          onCheckedChange={(checked) => handlePermissionChange('canManageEmployees', checked)}
                        />
                        <Label htmlFor="edit-employees" className="cursor-pointer">إدارة الموظفين</Label>
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

              <div className="flex justify-end gap-2 pt-4">
                <Button className="primary-button after:bg-red-500" variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
                <Button className="primary-button" onClick={handleUpdateEmployee}>حفظ التغييرات</Button>
              </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p>هل أنت متأكد من رغبتك في حذف الموظف {deletingEmployee?.name}؟</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button className="primary-button after:bg-red-500" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDeleteEmployee}>حذف</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Employee Details Dialog */}
      <ViewEmployeeDialog
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setEmployeeToView(null);
        }}
        employee={employeeToView}
      />
    </div>
  );
}

// View Employee Details Dialog Component
function ViewEmployeeDialog({ 
  isOpen, 
  onClose, 
  employee 
}: {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}) {
  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">تفاصيل الموظف</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b border-white/10 pb-2 text-primary">المعلومات الأساسية</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-400">الاسم:</span>
              <span className="text-white font-medium">{employee.name}</span>
              
              <span className="text-gray-400">البريد الإلكتروني:</span>
              <span className="text-white">{employee.email}</span>
              
              <span className="text-gray-400">رقم الهاتف:</span>
              <span className="text-white">{employee.phone || '-'}</span>

              <span className="text-gray-400">الحالة:</span>
              <Badge variant={employee.isActive ? "default" : "destructive"} className="w-fit">
                {employee.isActive ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b border-white/10 pb-2 text-primary">تاريخ الدخول والعمل</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-400">تاريخ الإنشاء:</span>
              <span className="text-white font-medium">{new Date(employee.createdAt).toLocaleDateString('ar-SA')}</span>
              
              <span className="text-gray-400">آخر ظهور:</span>
              <span className="text-white">
                {employee.lastLoginAt 
                  ? new Date(employee.lastLoginAt).toLocaleString('ar-SA')
                  : 'لم يسجل دخول'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="font-bold text-lg border-b border-white/10 pb-2 text-primary flex items-center gap-2">
            <Shield className="w-5 h-5" />
            الصلاحيات الممنوحة
          </h3>
          <div className="flex flex-wrap gap-2">
            {employee.permissions.canManageWhatsApp && <Badge variant="secondary">إدارة الواتساب</Badge>}
            {employee.permissions.canManageTelegram && <Badge variant="secondary">إدارة التليجرام</Badge>}
            {employee.permissions.canManageTickets && <Badge variant="secondary">المحادثة والتذاكر</Badge>}
            {employee.permissions.canManageContent && <Badge variant="secondary">إدارة المحتوى</Badge>}
            {employee.permissions.canManageCustomers && <Badge variant="secondary">إدارة العملاء</Badge>}
            {employee.permissions.canMarketServices && <Badge variant="secondary">تسويق الخدمات</Badge>}
            {employee.permissions.canManageEmployees && <Badge variant="secondary">إدارة الموظفين</Badge>}
            {employee.permissions.canUseEventsPlugin && <Badge variant="secondary">الربط البرمجي</Badge>}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">منصات التواصل الاجتماعي:</h4>
            <div className="flex flex-wrap gap-2">
              {employee.permissions.platforms.length > 0 ? (
                employee.permissions.platforms.map(p => (
                  <Badge key={p} className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                    {p}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-500">لا يوجد منصات محددة</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} className="primary-button">إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

