'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Users, 
  UserCheck, 
  Crown, 
  TrendingUp,
  Edit,
  Trash2,
  BarChart3,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Tag,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Settings,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerStats, getCategories, getCustomFields, createCustomField, updateCustomField, deleteCustomField } from '@/lib/api';
import { usePermissions } from '@/lib/permissions';
import * as XLSX from 'xlsx';

interface CustomField {
  id: number;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  categoryId?: number;
  productName?: string;
  subscriptionType?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionStatus?: string;
  tags: string[];
  customFields: Record<string, any>;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  address?: string;
  socialMedia: Record<string, string>;
  storeName?: string;
  category?: {
    id: number;
    name: string;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  customersByType: Array<{ subscriptionType: string; count: number }>;
  customersByStatus: Array<{ subscriptionStatus: string; count: number }>;
  recentCustomers: Customer[];
}

interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const { canManageCustomers, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isCustomFieldsDialogOpen, setIsCustomFieldsDialogOpen] = useState(false);
  const [editingCustomField, setEditingCustomField] = useState<CustomField | null>(null);
  const [newCustomField, setNewCustomField] = useState<Partial<CustomField>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    product: '',
    subscriptionStatus: 'all', // all, active, expired, inactive
    storeName: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteCustomerDialogOpen, setIsDeleteCustomerDialogOpen] = useState(false);
  const [isDeleteFieldDialogOpen, setIsDeleteFieldDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<CustomField | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    categoryName: '',
    productName: '',
    subscriptionType: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
    subscriptionStatus: 'active', // active, inactive
    tags: [] as string[],
    customFields: {} as Record<string, any>,
    purchasePrice: '',
    salePrice: '',
    socialMedia: {} as Record<string, string>,
    storeName: ''
  });
  
  // Invoice image state
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null);
  const [invoiceImagePreview, setInvoiceImagePreview] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
    fetchStats();
    fetchCategories();
    loadCustomFields();
  }, [pagination.page, filters, searchTerm]);

  const loadCustomFields = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found in loadCustomFields');
        return;
      }

      console.log('Loading custom fields...');
      const response = await getCustomFields(token);
      console.log('Custom fields response:', response);
      
      if (response.success) {
      console.log('Loaded custom fields:', response.data.length);
        setCustomFields(response.data);
      } else {
        console.error('Failed to load custom fields:', (response as any).message);
      }
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };


  const handleAddCustomField = async () => {
    if ( !newCustomField.label) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found in handleAddCustomField');
        return;
      }

      const fieldData = {
        name: newCustomField.label?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        label: newCustomField.label,
        type: newCustomField.type || 'text',
        required: newCustomField.required || false,
        options: newCustomField.type === 'select' ? [] : undefined,
        placeholder: newCustomField.placeholder || ''
      };

      console.log('Creating custom field with data:', fieldData);
      const response = await createCustomField(token, fieldData);
      console.log('Create field response:', response);
      
      if (response.success) {
        console.log('Field created successfully, reloading fields...');
        await loadCustomFields(); // Reload fields from API
        setNewCustomField({ name: '', label: '', type: 'text', required: false, placeholder: '' });
        setIsCustomFieldsDialogOpen(false);
        toast.success('تم إضافة الحقل بنجاح');
      } else {
        console.error('Failed to create field:', (response as any).message);
        toast.error((response as any).message || 'فشل في إضافة الحقل');
      }
    } catch (error) {
      console.error('Error adding custom field:', error);
      toast.error('فشل في إضافة الحقل');
    }
  };

  const handleEditCustomField = (field: CustomField) => {
    setEditingCustomField(field);
  };

  const handleUpdateCustomField = async () => {
    if (!editingCustomField) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const fieldData = {
        name: editingCustomField.name,
        label: editingCustomField.label,
        type: editingCustomField.type,
        required: editingCustomField.required,
        options: editingCustomField.options,
        placeholder: editingCustomField.placeholder
      };

      const response = await updateCustomField(token, editingCustomField.id, fieldData);
      
      if (response.success) {
        await loadCustomFields(); // Reload fields from API
        setEditingCustomField(null);
        toast.success('تم تحديث الحقل بنجاح');
      } else {
        toast.error(response.message || 'فشل في تحديث الحقل');
      }
    } catch (error) {
      console.error('Error updating custom field:', error);
      toast.error('فشل في تحديث الحقل');
    }
  };

  const handleDeleteCustomField = async (fieldId: number) => {
    console.log('Attempting to delete custom field with ID:', fieldId);
    
    // استخدام نموذج حذف بدلاً من confirm
    const field = customFields.find(f => f.id === fieldId);
    if (field) {
      setFieldToDelete(field);
      setIsDeleteFieldDialogOpen(true);
    }
  };

  const confirmDeleteField = async () => {
    if (!fieldToDelete) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      console.log('Sending delete request for field ID:', fieldToDelete.id);
      const response = await deleteCustomField(token, fieldToDelete.id);
      console.log('Delete response:', response);
      
      if (response.success) {
        console.log('Field deleted successfully, reloading fields...');
        await loadCustomFields(); // Reload fields from API
        toast.success('تم حذف الحقل بنجاح');
        setIsDeleteFieldDialogOpen(false);
        setFieldToDelete(null);
      } else {
        console.error('Delete failed:', response.message);
        toast.error(response.message || 'فشل في حذف الحقل');
      }
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast.error('فشل في حذف الحقل');
    }
  };

  // Export contacts function - فقط الأرقام
  const handleExportContacts = () => {
    try {
      // تصدير الأرقام فقط
      const phoneNumbers = customers
        .filter(customer => customer.phone && customer.phone.trim() !== '')
        .map(customer => ({
          'الاسم': customer.name,
          'رقم الهاتف': customer.phone
        }));

      if (phoneNumbers.length === 0) {
        toast.error('لا توجد أرقام هواتف للتصدير');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(phoneNumbers);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'أرقام الهواتف');
      
      const fileName = `أرقام_الهواتف_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`تم تصدير ${phoneNumbers.length} رقم هاتف بنجاح`);
    } catch (error) {
      console.error('Error exporting contacts:', error);
      toast.error('فشل في تصدير أرقام الهواتف');
    }
  };

  // Handle invoice image upload
  const handleInvoiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setInvoiceImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearInvoiceImage = () => {
    setInvoiceImage(null);
    setInvoiceImagePreview(null);
  };

  const showImage = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await getCustomers(token, pagination.page, pagination.limit, {
        search: searchTerm,
        category: filters.category,
        product: filters.product,
        subscriptionStatus: filters.subscriptionStatus,
        storeName: filters.storeName
      });

      if (response.success) {
        setCustomers(response.data.customers);
        setPagination(response.data.pagination);
        setHasAccess(true);
      } else {
        if ((response as any).code === 'CUSTOMER_MANAGEMENT_DENIED') {
          setHasAccess(false);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('فشل في جلب العملاء');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await getCustomerStats(token);
      if (response.success) {
        setStats(response.data);
      } else {
        if ((response as any).code === 'CUSTOMER_MANAGEMENT_DENIED') {
          setHasAccess(false);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await getCategories(token);
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      // Add invoice image to formData
      const customerData = {
        ...formData,
        invoiceImage: invoiceImage
      };
      
      console.log('Creating customer with customFields:', formData.customFields);
      console.log('Available custom fields:', customFields.map(f => ({ id: f.id, name: f.name, label: f.label })));
      const response = await createCustomer(token, customerData);
      if (response.success) {
        toast.success('تم إنشاء العميل بنجاح');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchCustomers();
        fetchStats();
        fetchCategories(); // تحديث قائمة التصنيفات
      } else {
        if ((response as any).code === 'CUSTOMER_MANAGEMENT_DENIED') {
          toast.error('ليس لديك اشتراك نشط');
        } else {
          toast.error(response.message || 'فشل في إنشاء العميل');
        }
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('فشل في إنشاء العميل');
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Add invoice image to formData
      const customerData = {
        ...formData,
        invoiceImage: invoiceImage
      };

      console.log('Updating customer with data:', customerData);
      const response = await updateCustomer(token, selectedCustomer.id, customerData);
      if (response.success) {
        toast.success('تم تحديث العميل بنجاح');
        setIsEditDialogOpen(false);
        resetForm();
        fetchCustomers();
        fetchStats();
        fetchCategories(); // تحديث قائمة التصنيفات
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('فشل في تحديث العميل');
    }
  };

  const handleDeleteCustomer = async (customerId: number) => {
    // استخدام نموذج حذف بدلاً من confirm
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setCustomerToDelete(customer);
      setIsDeleteCustomerDialogOpen(true);
    }
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await deleteCustomer(token, customerToDelete.id);
      if (response.success) {
        toast.success('تم حذف العميل بنجاح');
        fetchCustomers();
        fetchStats();
        setIsDeleteCustomerDialogOpen(false);
        setCustomerToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('فشل في حذف العميل');
    }
  };

  const handleExportToExcel = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // جلب جميع العملاء بدون pagination
      const response = await getCustomers(token, 1, 10000, {
        search: filters.search,
        category: filters.category,
        product: filters.product,
        subscriptionStatus: filters.subscriptionStatus,
        storeName: filters.storeName
      });

      if (!response.success) {
        toast.error('فشل في جلب البيانات للتصدير');
        return;
      }

      const customers = response.data.customers;
      
      // تحضير البيانات للتصدير - كل البيانات
      const exportData = customers.map(customer => {
        const baseData = {
          'الاسم': customer.name,
          'البريد الإلكتروني': customer.email || '',
          'رقم الهاتف': customer.phone || '',
          'التصنيف': customer.category?.name || '',
          'اسم المنتج': customer.productName || '',
          'اسم المتجر': customer.storeName || '',
          'نوع الاشتراك': customer.subscriptionType || '',
          'تاريخ بداية الاشتراك': customer.subscriptionStartDate ? new Date(customer.subscriptionStartDate).toLocaleDateString('en-US') : '',
          'تاريخ انتهاء الاشتراك': customer.subscriptionEndDate ? new Date(customer.subscriptionEndDate).toLocaleDateString('en-US') : '',
          'حالة الاشتراك': getSubscriptionStatus(customer) === 'active' ? 'نشط' : getSubscriptionStatus(customer) === 'expired' ? 'منتهي' : 'غير نشط',
          'العنوان': customer.address || '',
          'سعر الشراء': (customer as any).purchasePrice || 0,
          'سعر البيع': (customer as any).salePrice || 0,
          'الربح': ((customer as any).salePrice || 0) - ((customer as any).purchasePrice || 0),
          'العلامات': customer.tags.join(', '),
          'وسائل التواصل': Object.entries(customer.socialMedia)
            .map(([platform, handle]) => `${platform}: ${handle}`)
            .join(', '),
          'تاريخ آخر اتصال': customer.lastContactDate ? new Date(customer.lastContactDate).toLocaleDateString('en-US') : '',
          'تاريخ المتابعة التالية': customer.nextFollowUpDate ? new Date(customer.nextFollowUpDate).toLocaleDateString('en-US') : '',
          'تاريخ الإنشاء': new Date(customer.createdAt).toLocaleDateString('en-US'),
          'صورة الفاتورة': (customer as any).invoiceImage || ''
        };

        // إضافة الحقول المخصصة
        const customFieldsData = {};
        customFields.forEach(field => {
          const value = customer.customFields?.[field.name];
          customFieldsData[field.label] = value || '';
        });

        return { ...baseData, ...customFieldsData };
      });

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'العملاء');

      // تصدير الملف
      const fileName = `customers_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('تم تصدير البيانات بنجاح');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('فشل في تصدير البيانات');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      categoryName: '',
      productName: '',
      subscriptionType: '',
      subscriptionStartDate: '',
      subscriptionEndDate: '',
      subscriptionStatus: 'active',
      tags: [],
      customFields: {},
      purchasePrice: '',
      salePrice: '',
      socialMedia: {},
      storeName: ''
    });
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      categoryName: customer.category?.name || '',
      productName: customer.productName || '',
      subscriptionType: customer.subscriptionType || '',
      subscriptionStartDate: customer.subscriptionStartDate || '',
      subscriptionEndDate: customer.subscriptionEndDate || '',
      subscriptionStatus: getSubscriptionStatus(customer),
      tags: customer.tags,
      customFields: customer.customFields || {},
      purchasePrice: (customer as any).purchasePrice || '',
      salePrice: (customer as any).salePrice || '',
      socialMedia: customer.socialMedia,
      storeName: customer.storeName || ''
    });
    setIsEditDialogOpen(true);
  };

  const getSubscriptionStatus = (customer: Customer): string => {
    // إذا كان هناك subscriptionStatus محدد في قاعدة البيانات، استخدمه
    if (customer.subscriptionStatus) {
      return customer.subscriptionStatus;
    }
    
    // وإلا احسب الحالة بناءً على تاريخ الانتهاء
    if (!customer.subscriptionEndDate) return 'inactive';
    
    const endDate = new Date(customer.subscriptionEndDate);
    const now = new Date();
    
    if (endDate > now) {
      return 'active';
    } else {
      return 'expired';
    }
  };

  const getSubscriptionStatusBadge = (customer: Customer) => {
    const status = getSubscriptionStatus(customer);
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />نشط</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />منتهي</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" />غير نشط</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filterByCategory = (categoryName: string) => {
    setFilters(prev => ({ ...prev, category: categoryName }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      product: '',
      subscriptionStatus: 'all',
      storeName: ''
    });
    setSearchTerm('');
  };

  // Check permissions loading state
  if (permissionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">إدارة العملاء</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Check if user has active subscription
  if (!hasActiveSubscription) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">إدارة العملاء</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا يوجد اشتراك نشط</h3>
            <p className="text-gray-600 mb-4">تحتاج إلى اشتراك نشط للوصول إلى إدارة العملاء</p>
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              تصفح الباقات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has customers management permission
  if (!canManageCustomers()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">إدارة العملاء</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ليس لديك صلاحية إدارة العملاء</h3>
            <p className="text-gray-600 mb-4">باقتك الحالية لا تشمل إدارة العملاء</p>
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              ترقية الباقة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ليس لديك اشتراك نشط</h2>
              <p className="text-gray-600 mb-6">
                تحتاج إلى اشتراك نشط في باقة تدعم ميزة إدارة العملاء للوصول إلى هذه الصفحة
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/plans'}
                className="w-full"
              >
                عرض الباقات المتاحة
              </Button>
              <Button 
                    variant="secondary"
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                العودة للوحة التحكم
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">إدارة العملاء</h1>
          <p className="text-gray-300">إدارة قاعدة بيانات العملاء واشتراكاتهم</p>
        </div>
        <div className="flex gap-2">
          <Button className='primary-button after:bg-[#011910]' variant="secondary" onClick={() => window.location.href = '/customers/analytics'}>
              
            الإحصائيات
          </Button>
          <Button className='primary-button after:bg-[#011910]' variant="secondary" onClick={handleExportToExcel}>
            
            تصدير Excel
          </Button>
          <Button className='primary-button after:bg-[#011910]' variant="secondary" onClick={handleExportContacts}>
            تصدير جهات الاتصال
          </Button>
          <Button variant="secondary" className='primary-button after:bg-[#011910]' onClick={() => setIsCustomFieldsDialogOpen(true)}>
            
            إدارة الحقول
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className='primary-button'>
               
                إضافة عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                {/* <DialogTitle>إضافة عميل جديد</DialogTitle>
                <DialogDescription>
                  أدخل معلومات العميل الجديد
                </DialogDescription> */}
              </DialogHeader>
              <CustomerForm 
                formData={formData} 
                setFormData={setFormData} 
                onSubmit={handleCreateCustomer}
                onCancel={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
                invoiceImage={invoiceImage}
                invoiceImagePreview={invoiceImagePreview}
                handleInvoiceImageChange={handleInvoiceImageChange}
                clearInvoiceImage={clearInvoiceImage}
                submitText="إنشاء العميل"
                customFields={customFields}
                categories={categories}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">إجمالي العملاء</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats.totalCustomers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">العملاء النشطين</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats.activeCustomers}</p>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">عملاء VIP</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats.vipCustomers}</p>
              </div>
            </CardContent>
          </Card> */}

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">معدل النمو</p>
                </div>
                <p className="text-4xl font-bold text-white">+12%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Stats Cards */}
      {stats && (stats as any).financial && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">رأس المال الكلي</p>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any).financial.totalCapital} ر.س</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">الإيرادات الكلية</p>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any).financial.totalRevenue} ر.س</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">صافي الربح</p>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any).financial.netProfit} ر.س</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className='gradient-border'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="w-4 h-4" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
           <div className="flex items-center gap-2">
             {/* Search */}
             <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white" />
              <Input
                placeholder="البحث بالاسم، البريد الإلكتروني، الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
               {/* Product Filter */}
               <div className="w-full">
                {/* <Label className="text-white">المنتج</Label> */}
                <Input
                  placeholder="فلترة بالمنتج"
                  value={filters.product}
                  onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
                />
              </div>
           </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
           

           

              {/* Subscription Status Filter */}
              <div className="flex-1">
                <Label className="text-white">حالة الاشتراك</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    variant={filters.subscriptionStatus === 'all' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, subscriptionStatus: 'all' }))}
                  >
                    جميع الحالات
                  </Button>
                  <Button
                    variant={filters.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, subscriptionStatus: 'active' }))}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    نشط
                  </Button>
                  <Button
                    variant={filters.subscriptionStatus === 'expired' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, subscriptionStatus: 'expired' }))}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    منتهي
                  </Button>
                  <Button
                    variant={filters.subscriptionStatus === 'inactive' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, subscriptionStatus: 'inactive' }))}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    غير نشط
                  </Button>
                </div>
              </div>
            </div>

            {/* Category Quick Filters */}
            {categories.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block text-white">فلترة سريعة بالتصنيفات:</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.category === '' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => filterByCategory('')}
                  >
                    الكل
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={filters.category === category.name ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => filterByCategory(category.name)}
                      style={{ 
                        backgroundColor: filters.category === category.name ? category.color : undefined,
                        color: filters.category === category.name ? 'white' : undefined
                      }}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Store Name Quick Filters */}
            {customers.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block text-white">فلترة سريعة بأسماء المتاجر:</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.storeName === '' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, storeName: '' }))}
                  >
                    الكل
                  </Button>
                  {Array.from(new Set(customers.map(c => c.storeName).filter(Boolean))).map((storeName) => (
                    <Button
                      key={storeName}
                      // variant={filters.storeName === storeName ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, storeName: storeName || '' }))}
                      className={`${filters.storeName === storeName ? 'bg-blue-500 inner-shadow text-white' : 'bg-gray-600 text-black '}`}
                    >
                      {storeName}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className='bg-transparent border-none'>
        <CardHeader className='bg-[#011910]  border-none'>
          <CardTitle className='text-white'>قائمة العملاء</CardTitle>
          <CardDescription className='text-primary'>
            عرض {customers.length} من أصل {pagination.total} عميل
          </CardDescription>
        </CardHeader>
        <CardContent className='bg-[#011910] border-none '>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-green-200 shadow-lg bg-transparent">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-[#011910] text-white">
                  <tr className="border-b border-green-200">
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">الاسم</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">معلومات الاتصال</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">اسم المتجر</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">التصنيف</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">المنتج</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">سعر الشراء</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">سعر البيع</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">الربح</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">صورة الفاتورة</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">نوع الاشتراك</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">فترة الاشتراك</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">حالة الاشتراك</th>
                    {customFields.map((field) => (
                      <th key={field.id} className="text-right p-4 font-semibold text-white border-r border-green-200">{field.label}</th>
                    ))}
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">تاريخ الإنشاء</th>
                    <th className="text-right p-4 font-semibold text-white border-r border-green-300">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {customers.map((customer, index) => (
                    <tr key={customer.id} className={`border-b text-white border-green-100 bg-light-custom transition-all duration-200 ${index % 2 === 0 ? 'bg-green-25' : 'bg-white'} group`}>
                      <td className="p-4 border-r border-green-100">
                        <div className="font-medium">{customer.name}</div>
                        {customer.tags && Array.isArray(customer.tags) && customer.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {customer.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="w-2 h-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 border-r border-green-100">
                        <div className="space-y-1 text-sm">
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-white" />
                              <span className="text-white">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-white" />
                              <span className="text-white">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r border-green-100">
                        {customer.storeName ? (
                          <div className="flex items-center gap-1">
                            <span className="text-white">{customer.storeName}</span>
                          </div>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-green-100">
                        {customer.category ? (
                          <Badge style={{ backgroundColor: customer.category.color, color: 'white' }} className="shadow-sm">
                            {customer.category.name}
                          </Badge>
                        ) : (
                          <span className="text-green-400">-</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-green-100">
                        {customer.productName ? (
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-white" />
                            <span className="text-white">{customer.productName}</span>
                          </div>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </td>
                    
                      <td className="p-4 border-r border-green-100">
                        {(customer as any).purchasePrice !== null && (customer as any).purchasePrice !== undefined ? (
                          <span className="text-sm font-medium text-white  px-2 py-1 rounded">
                            {parseFloat((customer as any).purchasePrice || 0)} ر.س
                          </span>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-green-100">
                        {(customer as any).salePrice !== null && (customer as any).salePrice !== undefined ? (
                          <span className="text-sm font-medium text-white  px-2 py-1 rounded">
                            {parseFloat((customer as any).salePrice || 0).toFixed(2)} ر.س
                          </span>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-green-100">
                        {((customer as any).purchasePrice !== null && (customer as any).purchasePrice !== undefined) || 
                         ((customer as any).salePrice !== null && (customer as any).salePrice !== undefined) ? (
                          <span className={`text-sm font-bold px-2 py-1 rounded ${
                            (parseFloat((customer as any).salePrice || 0) - parseFloat((customer as any).purchasePrice || 0)) >= 0 
                              ? 'text-white ' 
                              : 'text-white '
                          }`}>
                            {(parseFloat((customer as any).salePrice || 0) - parseFloat((customer as any).purchasePrice || 0))} ر.س
                          </span>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-green-100">
                        {(() => {
                          const invoiceImage = (customer as any).invoiceImage;
                          console.log('Customer:', customer.name, 'Invoice Image:', invoiceImage);
                          console.log('Invoice Image type:', typeof invoiceImage);
                          console.log('Invoice Image length:', invoiceImage?.length);
                          
                          if (invoiceImage && invoiceImage.trim() !== '') {
                            return (
                              <div className="flex items-center gap-2">
                                <img
                                  src={invoiceImage}
                                  alt="صورة الفاتورة"
                                  className="w-12 h-12 object-cover rounded  cursor-pointer hover:opacity-80"
                                  onClick={() => showImage(invoiceImage)}
                                  onError={(e) => {
                                    console.error('Error loading invoice image:', invoiceImage);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(invoiceImage, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          } else {
                            return <span className="text-muted-foreground">-</span>;
                          }
                        })()}
                      </td>
                      <td className="p-4 border-r border-green-100">
                        {customer.subscriptionType ? (
                          <span className="text-green-700 bg-green-50 px-2 py-1 rounded text-sm">{customer.subscriptionType}</span>
                        ) : (
                          <span className="text-green-400">-</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-green-100">
                        <div className="text-sm">
                          {customer.subscriptionStartDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-white" />
                              <span className="text-white">من: {formatDate(customer.subscriptionStartDate)}</span>
                            </div>
                          )}
                          {customer.subscriptionEndDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-white" />
                              <span className="text-white">إلى: {formatDate(customer.subscriptionEndDate)}</span>
                            </div>
                          )}
                          {!customer.subscriptionStartDate && !customer.subscriptionEndDate && (
                            <span className="text-green-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r border-green-100">
                        {getSubscriptionStatusBadge(customer)}
                      </td>
                      {customFields.map((field) => {
                        const value = customer.customFields?.[field.name];
                        return (
                          <td key={field.id} className="p-4 border-r border-green-100">
                            <div className="text-sm">
                              {value ? (
                                <span className="text-green-700">{value}</span>
                              ) : (
                                <span className="text-green-400">-</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-4 border-r border-green-100">
                        <div className="text-sm text-white">
                          {formatDate(customer.createdAt)}
                        </div>
                      </td>
                      <td className="p-4 border-r border-green-100">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditDialog(customer)}
                            className="hover:bg-green-100 hover:text-green-700 text-green-400"
                          >
                            <Edit className="h-6 w-6" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="hover:bg-red-100 text-red-400"
                          >
                            <Trash2 className="h-6 w-6" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل العميل</DialogTitle>
            <DialogDescription>
              تعديل معلومات العميل
            </DialogDescription>
          </DialogHeader>
          <CustomerForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleUpdateCustomer}
            onCancel={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}
            invoiceImage={invoiceImage}
            invoiceImagePreview={invoiceImagePreview}
            handleInvoiceImageChange={handleInvoiceImageChange}
            clearInvoiceImage={clearInvoiceImage}
            submitText="حفظ التغييرات"
            customFields={customFields}
            categories={categories}
          />
        </DialogContent>
      </Dialog>

      {/* Custom Fields Management Dialog */}
      <CustomFieldsDialog
        isOpen={isCustomFieldsDialogOpen}
        onClose={() => setIsCustomFieldsDialogOpen(false)}
        customFields={customFields}
        onAddField={handleAddCustomField}
        onEditField={handleEditCustomField}
        onUpdateField={handleUpdateCustomField}
        onDeleteField={handleDeleteCustomField}
        editingField={editingCustomField}
        setEditingField={setEditingCustomField}
        newField={newCustomField}
        setNewField={setNewCustomField}
      />

      {/* Delete Customer Dialog */}
      <DeleteCustomerDialog
        isOpen={isDeleteCustomerDialogOpen}
        onClose={() => {
          setIsDeleteCustomerDialogOpen(false);
          setCustomerToDelete(null);
        }}
        customer={customerToDelete}
        onConfirm={confirmDeleteCustomer}
      />

      {/* Delete Field Dialog */}
      <DeleteFieldDialog
        isOpen={isDeleteFieldDialogOpen}
        onClose={() => {
          setIsDeleteFieldDialogOpen(false);
          setFieldToDelete(null);
        }}
        field={fieldToDelete}
        onConfirm={confirmDeleteField}
      />

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">صورة الفاتورة</h3>
              <Button
                variant="ghost"
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex justify-center">
              <img
                src={selectedImageUrl}
                alt="صورة الفاتورة"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button
                onClick={() => window.open(selectedImageUrl, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                فتح في نافذة جديدة
              </Button>
              <Button
                onClick={() => setShowImageModal(false)}
                variant="secondary"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Customer Form Component
function CustomerForm({ formData, setFormData, onSubmit, onCancel, submitText, customFields = [], categories = [], invoiceImage, invoiceImagePreview, handleInvoiceImageChange, clearInvoiceImage }: {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitText: string;
  customFields?: CustomField[];
  categories?: Category[];
  invoiceImage?: File | null;
  invoiceImagePreview?: string | null;
  handleInvoiceImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearInvoiceImage?: () => void;
}) {
  const renderCustomField = (field: CustomField) => {
    const fieldValue = formData.customFields?.[field.name] || '';
    
    const handleFieldChange = (value: string) => {
      console.log('Field change:', field.name, 'value:', value);
      const newCustomFields = { ...formData.customFields, [field.name]: value };
      console.log('New custom fields:', newCustomFields);
      setFormData({
        ...formData,
        customFields: newCustomFields
      });
    };
    
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
      case 'select':
        return (
          <Combobox
            options={field.options?.map(option => ({ value: option, label: option })) || []}
            value={fieldValue}
            onValueChange={handleFieldChange}
            placeholder={field.placeholder}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
          />
        );
      default:
        return (
          <Input
            type={field.type === 'email' ? 'email' : 'text'}
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">الاسم *</Label>
          <Input
          className='placeholder-white/60'
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="اسم العميل"
          />
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="example@email.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+966501234567"
          />
        </div>
        <div>
          <Label htmlFor="categoryName">التصنيف</Label>
          <Input
            id="categoryName"
            value={formData.categoryName}
            onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
            placeholder="اختر من القائمة أو أدخل تصنيف جديد"
            list="categories-list"
          />
          <datalist id="categories-list">
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="productName">اسم المنتج</Label>
          <Input
            id="productName"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="اسم المنتج أو الخدمة"
          />
        </div>
        <div>
          <Label htmlFor="storeName">اسم المتجر</Label>
          <Input
            id="storeName"
            value={formData.storeName}
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
            placeholder="اسم المتجر أو المحل"
          />
        </div>
        <div>
          <Label htmlFor="subscriptionType">نوع الاشتراك</Label>
          <Input
            id="subscriptionType"
            value={formData.subscriptionType}
            onChange={(e) => setFormData({ ...formData, subscriptionType: e.target.value })}
            placeholder="نوع الاشتراك"
          />
        </div>
        <div>
          <Label htmlFor="subscriptionStartDate">تاريخ بداية الاشتراك</Label>
          <Input
            id="subscriptionStartDate"
            type="date"
            value={formData.subscriptionStartDate}
            onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="subscriptionEndDate">تاريخ انتهاء الاشتراك</Label>
          <Input
            id="subscriptionEndDate"
            type="date"
            value={formData.subscriptionEndDate}
            onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="subscriptionStatus">حالة الاشتراك</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="subscriptionStatus"
              checked={formData.subscriptionStatus === 'active'}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                subscriptionStatus: checked ? 'active' : 'inactive' 
              })}
            />
            <Label htmlFor="subscriptionStatus">
              {formData.subscriptionStatus === 'active' ? 'نشط' : 'غير نشط'}
            </Label>
          </div>
        </div>
        <div>
          <Label htmlFor="purchasePrice">سعر الشراء</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="1"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="salePrice">سعر البيع</Label>
          <Input
            id="salePrice"
            type="number"
            step="1"
            value={formData.salePrice}
            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>
      
      {/* Invoice Image Upload */}
      <div className="space-y-4">
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">صورة الفاتورة (اختياري)</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoiceImage">رفع صورة الفاتورة</Label>
              <Input
                id="invoiceImage"
                type="file"
                accept="image/*"
                onChange={handleInvoiceImageChange}
                className="mt-1"
              />
           
            </div>
            
            {invoiceImagePreview && (
              <div className="space-y-2">
                <Label>معاينة الصورة:</Label>
                <div className="relative inline-block">
                  <img
                    src={invoiceImagePreview}
                    alt="معاينة الفاتورة"
                    className="max-w-xs max-h-48 rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={clearInvoiceImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Custom Fields Section */}
      {customFields.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">الحقول المخصصة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customFields.map((field) => (
                <div key={field.id}>
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderCustomField(field)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2">
        <Button className='primary-button after:bg-red-500' onClick={onCancel}>
          إلغاء
        </Button>
        <Button className='primary-button' onClick={onSubmit}>
          {submitText}
        </Button>
      </div>
    </div>
  );
}

// Custom Fields Management Dialog
function CustomFieldsDialog({ 
  isOpen, 
  onClose, 
  customFields, 
  onAddField, 
  onEditField, 
  onUpdateField, 
  onDeleteField, 
  editingField, 
  setEditingField, 
  newField, 
  setNewField 
}: {
  isOpen: boolean;
  onClose: () => void;
  customFields: CustomField[];
  onAddField: () => void;
  onEditField: (field: CustomField) => void;
  onUpdateField: () => void;
  onDeleteField: (fieldId: number) => void;
  editingField: CustomField | null;
  setEditingField: (field: CustomField | null) => void;
  newField: Partial<CustomField>;
  setNewField: (field: Partial<CustomField>) => void;
}) {
  const getFieldTypeLabel = (type: string) => {
    const types = {
      text: 'نص',
      number: 'رقم',
      date: 'تاريخ',
      email: 'بريد إلكتروني',
      phone: 'هاتف',
      select: 'قائمة منسدلة',
      textarea: 'نص طويل'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إدارة الحقول المخصصة</DialogTitle>
          <DialogDescription>
            إضافة وتعديل الحقول المخصصة للعملاء
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Field Form */}
          <Card className='gradient-border'>
            <CardHeader>
              <CardTitle className="text-lg">إضافة حقل جديد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* <div>
                  <Label htmlFor="fieldName">اسم الحقل (بالإنجليزية)</Label>
                  <Input
                    id="fieldName"      
                    value={newField.name || ''}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    placeholder="fieldName"
                  />
                </div> */}
                <div>
                  <Label htmlFor="fieldLabel">اسم الحقل </Label>
                  <Input
                    id="fieldLabel"
                    value={newField.label || ''}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="اسم الحقل"
                  />
                </div>
                {/* <div>
                  <Label htmlFor="fieldType">نوع الحقل</Label>
                  <Combobox
                    options={[
                      { value: 'text', label: 'نص' },
                      { value: 'number', label: 'رقم' },
                      { value: 'date', label: 'تاريخ' },
                      { value: 'email', label: 'بريد إلكتروني' },
                      { value: 'phone', label: 'هاتف' },
                      { value: 'select', label: 'قائمة منسدلة' },
                      { value: 'textarea', label: 'نص طويل' }
                    ]}
                    value={newField.type || 'text'}
                    onValueChange={(value) => setNewField({ ...newField, type: value as any })}
                    placeholder="اختر نوع الحقل"
                  />
                </div> */}
                <div>
                  <Label htmlFor="fieldPlaceholder">النص التوضيحي</Label>
                  <Input
                    id="fieldPlaceholder"
                    value={newField.placeholder || ''}
                    onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                    placeholder="النص الذي يظهر في الحقل"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fieldRequired"
                  checked={newField.required || false}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                />
                <Label htmlFor="fieldRequired">حقل مطلوب</Label>
              </div>
              <div className="flex justify-end">
                <Button className='primary-button' onClick={onAddField}>
                  
                  إضافة الحقل
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Fields List */}
          <Card className='gradient-border'>
            <CardHeader>
              <CardTitle className="text-lg">الحقول الموجودة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{field.label}</h4>
                        {field.required && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {field.name} • {getFieldTypeLabel(field.type)}
                        {field.placeholder && ` • ${field.placeholder}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditField(field)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteField(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {customFields.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد حقول مخصصة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Delete Customer Confirmation Dialog
function DeleteCustomerDialog({ 
  isOpen, 
  onClose, 
  customer, 
  onConfirm 
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogDescription className="text-white">
            هل أنت متأكد من حذف العميل "{customer?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            حذف
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Delete Field Confirmation Dialog
function DeleteFieldDialog({ 
  isOpen, 
  onClose, 
  field, 
  onConfirm 
}: {
  isOpen: boolean;
  onClose: () => void;
  field: CustomField | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف الحقل "{field?.label}"؟ هذا الإجراء لا يمكن التراجع عنه.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            حذف
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}