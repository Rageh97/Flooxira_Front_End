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
import { useToast } from "@/components/ui/toast-provider";
import { useTutorials } from "@/hooks/useTutorials";
import { TutorialVideoModal } from "@/components/TutorialVideoModal";
import { Tutorial } from "@/types/tutorial";
import { BookOpen, Calendar1Icon } from "lucide-react";
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
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerStats, getCategories, createCategory, getCustomFields, createCustomField, updateCustomField, deleteCustomField, getStores, createStore, getPlatforms, createPlatform } from '@/lib/api';
import { usePermissions } from '@/lib/permissions';
import * as XLSX from 'xlsx';
import Loader from '@/components/Loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import NoActiveSubscription from '@/components/NoActiveSubscription';
import AnimatedTutorialButton from '@/components/YoutubeButton';

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
  const { showSuccess, showError } = useToast();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<{ id: number; name: string }[]>([]);
  const [platforms, setPlatforms] = useState<{ id: number; name: string }[]>([]);
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
    storeName: '',
    platformName: ''
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
  const [isAddEntityDialogOpen, setIsAddEntityDialogOpen] = useState(false);
  const [entityType, setEntityType] = useState<'category' | 'store' | 'platform'>('category');
  const [entityName, setEntityName] = useState('');
  const [isSavingEntity, setIsSavingEntity] = useState(false);
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
    storeName: '',
    platformName: ''
  });
  
  // Invoice image state
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null);
  const [invoiceImagePreview, setInvoiceImagePreview] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  
  // Loading states for operations
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  const [isDeletingField, setIsDeletingField] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const { tutorials, getTutorialByCategory, incrementViews } = useTutorials();
  const handleShowTutorial = () => {
    const customersTutorial = 
      getTutorialByCategory('Customers') || 
      getTutorialByCategory('عملاء') || 
      getTutorialByCategory('Customers') || 
      getTutorialByCategory('عملاء') ||
      tutorials.find(t => 
        t.title.toLowerCase().includes('عملاء') ||
        t.title.toLowerCase().includes('Customers') ||
        t.category.toLowerCase().includes('عملاء') ||
        t.category.toLowerCase().includes('Customers')
      ) || null;
    
    if (customersTutorial) {
      setSelectedTutorial(customersTutorial);
      incrementViews(customersTutorial.id);
    } else {
      showError("لم يتم العثور على شرح خاص بالعملاء");
    }
  };
useEffect(() => {
    if (!permissionsLoading && !hasActiveSubscription) {
      showError("لا يوجد اشتراك نشط");
    }
  }, [hasActiveSubscription, permissionsLoading]);
  useEffect(() => {
    fetchCustomers();
    fetchStats();
    fetchCategories();
    fetchStores();
    fetchPlatforms();
    loadCustomFields();
  }, [pagination.page, filters, searchTerm]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filters, searchTerm]);

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
      setIsAddingField(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found in handleAddCustomField');
        setIsAddingField(false);
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
    } finally {
      setIsAddingField(false);
    }
  };

  const handleEditCustomField = (field: CustomField) => {
    setEditingCustomField(field);
  };

  const handleUpdateCustomField = async () => {
    if (!editingCustomField) return;

    try {
      setIsUpdatingField(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsUpdatingField(false);
        return;
      }

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
    } finally {
      setIsUpdatingField(false);
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
      setIsDeletingField(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        setIsDeletingField(false);
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
    } finally {
      setIsDeletingField(false);
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
        storeName: filters.storeName,
        platformName: filters.platformName
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

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const response = await getStores(token);
      if (response.success) {
        setStores(response.data);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const response = await getPlatforms(token);
      if (response.success) {
        setPlatforms(response.data);
      }
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  const handleSaveEntity = async () => {
    if (!entityName.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }
    try {
      setIsSavingEntity(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      if (entityType === 'category') {
        const resp = await createCategory(token, { name: entityName.trim(), description: `تصنيف ${entityName.trim()}` });
        if (resp.success) { toast.success('تم إضافة التصنيف'); await fetchCategories(); }
        else { toast.error(resp.message || 'فشل في إضافة التصنيف'); }
      } else if (entityType === 'store') {
        const resp = await createStore(token, { name: entityName.trim() });
        if (resp.success) { toast.success('تم إضافة المتجر'); await fetchStores(); }
        else { toast.error(resp.message || 'فشل في إضافة المتجر'); }
      } else if (entityType === 'platform') {
        const resp = await createPlatform(token, { name: entityName.trim() });
        if (resp.success) { toast.success('تم إضافة المنصة'); await fetchPlatforms(); }
        else { toast.error(resp.message || 'فشل في إضافة المنصة'); }
      }
      setIsAddEntityDialogOpen(false);
      setEntityName('');
    } catch (e) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSavingEntity(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      setIsCreatingCustomer(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsCreatingCustomer(false);
        return;
      }
      
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
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      setIsUpdatingCustomer(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsUpdatingCustomer(false);
        return;
      }

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
    } finally {
      setIsUpdatingCustomer(false);
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
      setIsDeletingCustomer(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsDeletingCustomer(false);
        return;
      }

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
    } finally {
      setIsDeletingCustomer(false);
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
          'سعر التكلفة': (customer as any).purchasePrice || 0,
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
        const customFieldsData: Record<string, any> = {};
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
      storeName: '',
      platformName: ''
    });
    setInvoiceImage(null);
    setInvoiceImagePreview(null);
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
      storeName: customer.storeName || '',
      platformName: (customer as any).platformName || ''
    });
    
    // Load existing invoice image if available
    const existingInvoiceImage = (customer as any).invoiceImage;
    if (existingInvoiceImage) {
      // Build proper image URL for preview
      let imageUrl = existingInvoiceImage;
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        if (imageUrl.startsWith('/uploads/')) {
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${imageUrl}`;
        } else if (!imageUrl.includes('/')) {
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/customers/${imageUrl}`;
        } else {
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
      }
      setInvoiceImagePreview(imageUrl);
    } else {
      setInvoiceImagePreview(null);
    }
    setInvoiceImage(null); // Clear file input - user needs to re-upload if they want to change
    
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
      storeName: '',
      platformName: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Show fullscreen loader during operations
  if (isCreatingCustomer || isUpdatingCustomer || isAddingField || isUpdatingField || isDeletingField || isDeletingCustomer) {
    let loaderText = "جاري المعالجة...";
    if (isCreatingCustomer) loaderText = "جاري إنشاء العميل...";
    else if (isUpdatingCustomer) loaderText = "جاري تحديث العميل...";
    else if (isAddingField) loaderText = "جاري إضافة الحقل...";
    else if (isUpdatingField) loaderText = "جاري تحديث الحقل...";
    else if (isDeletingField) loaderText = "جاري حذف الحقل...";
    else if (isDeletingCustomer) loaderText = "جاري حذف العميل...";
    
    return (
      <Loader 
        text={loaderText} 
        size="lg" 
        variant="success"
        showDots
        fullScreen
      />
    );
  }

  // Check permissions loading state
  if (permissionsLoading) {
    return (
      <div className="container mx-auto p-6">
       
        <Loader text="جاري التحقق من الصلاحيات..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }

  const showBlurOverlay = !hasActiveSubscription;
  const hasInadequatePlan = hasActiveSubscription && (!canManageCustomers() || !hasAccess);

  const handleRestrictedAction = (action: () => void) => {
    if (hasInadequatePlan) {
      showError("هذه الميزة غير متاحة في الباقة الحالية، يرجى ترقية الباقة");
      return;
    }
    action();
  };

  return (
    <div className="w-full space-y-3 relative">
      {showBlurOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-start pt-20 flex-col bg-black/5">
          {/* <NoActiveSubscription 
            heading=" "
            featureName="إدارة العملاء"
            cardTitle="لا يوجد اشتراك نشط"
            description="تحتاج إلى اشتراك نشط للوصول إلى إدارة العملاء."
            className="w-full max-w-2xl px-4"
          /> */}
        </div>
      )}
      <div className={showBlurOverlay ? "opacity-60 pointer-events-none select-none grayscale-[0.3] blur-[2px] space-y-3" : "space-y-3"}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start mx-2 md:mx-0 md:items-center gap-3">
        <div >
          <h1 className="text-3xl font-bold text-white ">إدارة العملاء</h1>
          <p className="text-gray-300">إدارة قاعدة بيانات العملاء واشتراكاتهم</p>
          <AnimatedTutorialButton onClick={handleShowTutorial} text1="شرح الميزة" text2="شاهد" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className='primary-button after:bg-[#03132c]' variant="secondary" onClick={() => handleRestrictedAction(() => { setEntityType('category'); setEntityName(''); setIsAddEntityDialogOpen(true); })}>
            أضف تصنيف
          </Button>
          <Button className='primary-button after:bg-[#03132c]' variant="secondary" onClick={() => handleRestrictedAction(() => { setEntityType('store'); setEntityName(''); setIsAddEntityDialogOpen(true); })}>
            أضف متجر
          </Button>
          <Button className='primary-button after:bg-[#03132c]' variant="secondary" onClick={() => handleRestrictedAction(() => { setEntityType('platform'); setEntityName(''); setIsAddEntityDialogOpen(true); })}>
            أضف منصة
          </Button>
          <Button className='primary-button after:bg-[#03132c]' variant="secondary" onClick={() => handleRestrictedAction(() => window.location.href = '/customers/analytics')}>
              
            الإحصائيات
          </Button>
          <Button className='primary-button after:bg-[#03132c]' variant="secondary" onClick={() => handleRestrictedAction(handleExportToExcel)}>
            
            تصدير Excel
          </Button>
          <Button className='primary-button after:bg-[#03132c]' variant="secondary" onClick={() => handleRestrictedAction(handleExportContacts)}>
            تصدير جهات الاتصال
          </Button>
          <Button variant="secondary" className='primary-button after:bg-[#03132c]' onClick={() => handleRestrictedAction(() => setIsCustomFieldsDialogOpen(true))}>
            
            إدارة الحقول
          </Button>
          <Button className='primary-button' onClick={() => handleRestrictedAction(() => setIsCreateDialogOpen(true))}>
            إضافة عميل جديد
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                stores={stores}
                platforms={platforms}
              />
            </DialogContent>
          </Dialog>
          {/* Add Entity Dialog */}
          <Dialog open={isAddEntityDialogOpen} onOpenChange={setIsAddEntityDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {entityType === 'category' ? 'إضافة تصنيف' : entityType === 'store' ? 'إضافة متجر' : 'إضافة منصة'}
                </DialogTitle>
             
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="entityName">الاسم</Label>
                  <Input id="entityName" value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder={entityType === 'category' ? 'اسم التصنيف' : entityType === 'store' ? 'اسم المتجر' : 'اسم المنصة'} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setIsAddEntityDialogOpen(false)}>إلغاء</Button>
                  <Button className='primary-button' onClick={handleSaveEntity} disabled={isSavingEntity}>
                    {isSavingEntity ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12  rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-gray-200 text-sm md:text-lg font-bold">إجمالي العملاء</p>
                </div>
                <p className="md:text-4xl text-lg font-bold text-white">{stats.totalCustomers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12  rounded-lg flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-gray-200 text-sm md:text-lg font-bold">العملاء النشطين</p>
                </div>
                <p className="md:text-4xl text-lg font-bold text-white">{stats.activeCustomers}</p>
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
                  <p className="text-gray-200 text-sm md:text-lg font-bold">عملاء VIP</p>
                </div>
                <p className="md:text-4xl text-lg font-bold text-white">{stats.vipCustomers}</p>
              </div>
            </CardContent>
          </Card> */}

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12  rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-gray-200 text-sm md:text-lg font-bold">معدل النمو</p>
                </div>
                <p className="md:text-4xl text-lg font-bold text-white">+12%</p>
              </div>
            </CardContent>
          </Card>
          {/* Financial Stats Cards */}
      {stats && (stats as any).financial && (
        <> 
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> */}
          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12  rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-gray-200 text-sm md:text-lg font-bold">رأس المال الكلي</p>
                </div>
                <p className="md:text-2xl text-lg font-bold text-white">{(stats as any).financial.totalCapital} ر.س</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12  rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-gray-200 text-sm md:text-lg font-bold">الإيرادات الكلية</p>
                </div>
                <p className="md:text-2xl text-lg font-bold text-white">{(stats as any).financial.totalRevenue} ر.س</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12  rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-gray-200 text-sm md:text-lg font-bold">صافي الربح</p>
                </div>
                <p className="md:text-2xl text-lg font-bold text-white">{(stats as any).financial.netProfit} ر.س</p>
              </div>
            </CardContent>
          </Card>
        {/* </div> */}
        </>
      )}
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
              {/* Store Filter */}
              <div className="flex-1">
                <Label className="text-white">المتجر</Label>
                <select
                  className="w-full p-2 mt-2 text-white rounded-md border border-blue-300 bg-[#01191040]"
                  value={filters.storeName}
                  onChange={(e) => setFilters(prev => ({ ...prev, storeName: e.target.value }))}
                >
                  <option className="text-white" value="">كل المتاجر</option>
                  {stores.map((s: { id: number; name: string }) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Platform Filter */}
              <div className="flex-1">
                <Label className="text-white">المنصة</Label>
                <select
                  className="w-full p-2 mt-2 text-white rounded-md border border-blue-300 bg-[#01191040]"
                  value={filters.platformName}
                  onChange={(e) => setFilters(prev => ({ ...prev, platformName: e.target.value }))}
                >
                  <option className="text-white" value="">كل المنصات</option>
                  {platforms.map((p: { id: number; name: string }) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Subscription Status Filter */}
              <div className="flex-1">
                <Label className="text-white">حالة الاشتراك</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    variant={filters.subscriptionStatus === 'all' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, subscriptionStatus: 'all' }))}
                    className="bg-blue-600 "
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
                    className="bg-yellow-600 text-white"
                  >
                    غير نشط
                  </Button>
                   {/* Clear Filters */}
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>
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
                    className="bg-blue-600 "
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
                    className="bg-blue-600 "
                  >
                    الكل
                  </Button>
                  {stores.map((s: { id: number; name: string }) => s.name).map((storeName) => (
                    <Button
                      key={storeName}
                      // variant={filters.storeName === storeName ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, storeName: storeName || '' }))}
                      className={`${filters.storeName === storeName ? 'bg-blue-500  ' : 'bg-gray-600 text-black '}`}
                    >
                      {storeName}
                    </Button>
                  ))}
                </div>
              </div>
            )}

           
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className='gradient-border border-none'>
        <CardHeader className=' border-none'>
          <CardTitle className='text-white'>قائمة العملاء</CardTitle>
          <CardDescription className='text-primary flex items-center justify-between'>
            عرض {customers.length} من أصل {pagination.total} عميل
              {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 px-4 py-3 ">
              
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="bg-transparent border border-green-400 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={
                          pagination.page === pageNum
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-transparent border border-green-400 text-white hover:bg-green-600"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="bg-transparent border border-green-400 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          </CardDescription>
          
        </CardHeader>
        <CardContent className=' border-none '>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-green-200 shadow-lg">
              <Table className="w-full ">
                <TableHeader>
                  <TableRow>
                    <TableHead className='border-r '>الاسم</TableHead>
                    <TableHead className='border-r '>معلومات الاتصال</TableHead>
                    <TableHead className='border-r '>اسم المتجر</TableHead>
                    <TableHead className='border-r '>اسم المنصة</TableHead>
                    <TableHead className='border-r '>التصنيف</TableHead>
                    <TableHead className='border-r '>المنتج</TableHead>
                    <TableHead className='border-r '>سعر التكلفة</TableHead>
                    <TableHead className='border-r '>سعر البيع</TableHead>
                    <TableHead className='border-r '>الربح</TableHead>
                    <TableHead className='border-r '>صورة الفاتورة</TableHead>
                    <TableHead className='border-r '>نوع الاشتراك</TableHead>
                    <TableHead className='border-r '>فترة الاشتراك</TableHead>
                    <TableHead className='border-r '>حالة الاشتراك</TableHead>
                    {customFields.map((field) => (
                      <TableHead className='border-r' key={field.id} >{field.label}</TableHead>
                    ))}
                    <TableHead className='border-r' >تاريخ الإنشاء</TableHead>
                    <TableHead className='border-r' >الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody >
                  {customers.map((customer, index) => (
                    <TableRow key={customer.id} className={`border-b text-white border-green-100  transition-all duration-200 ${index % 2 === 0 ? '' : ''} group`}>
                      <TableCell className="p-4 border-r border-green-100">
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
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
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
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
                        {customer.storeName ? (
                          <div className="flex items-center gap-1">
                            <span className="text-white">{customer.storeName}</span>
                          </div>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
                        {(customer as any).platformName ? (
                          <div className="flex items-center gap-1">
                            <span className="text-white">{(customer as any).platformName}</span>
                          </div>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
                        {customer.category ? (
                          <Badge style={{ backgroundColor: customer.category.color, color: 'white' }} className="shadow-sm">
                            {customer.category.name}
                          </Badge>
                        ) : (
                          <span className="text-green-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
                        {customer.productName ? (
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-white" />
                            <span className="text-white">{customer.productName}</span>
                          </div>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </TableCell>
                    
                      <TableCell className="p-4 border-r border-green-100">
                        {(customer as any).purchasePrice !== null && (customer as any).purchasePrice !== undefined ? (
                          <span className="text-sm font-medium text-white  px-2 py-1 rounded">
                            {parseFloat((customer as any).purchasePrice || 0)} ر.س
                          </span>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
                        {(customer as any).salePrice !== null && (customer as any).salePrice !== undefined ? (
                          <span className="text-sm font-medium text-white  px-2 py-1 rounded">
                            {parseFloat((customer as any).salePrice || 0).toFixed(2)} ر.س
                          </span>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
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
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
                        {(() => {
                          const invoiceImage = (customer as any).invoiceImage;
                          console.log('Customer:', customer.name, 'Invoice Image:', invoiceImage);
                          console.log('Invoice Image type:', typeof invoiceImage);
                          console.log('Invoice Image length:', invoiceImage?.length);
                          
                          if (invoiceImage && invoiceImage.trim() !== '') {
                            // Build proper image URL
                            let imageUrl = invoiceImage;
                            
                            // If it's a relative path or just a filename, prepend API URL
                            if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                              // If it starts with /uploads/, just prepend API URL
                              if (imageUrl.startsWith('/uploads/')) {
                                imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${imageUrl}`;
                              } 
                              // If it's just a filename (no /), it's in customers folder
                              else if (!imageUrl.includes('/')) {
                                imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/customers/${imageUrl}`;
                              }
                              // If it has a path but no protocol, prepend API URL
                              else {
                                imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                              }
                            }
                            
                            console.log('Final image URL:', imageUrl);
                            
                            return (
                              <div className="flex items-center ">
                                <img
                                  src={imageUrl}
                                  alt="صورة الفاتورة"
                                  className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                                  crossOrigin="anonymous"
                                  onClick={() => showImage(imageUrl)}
                                  onError={(e) => {
                                    console.error('Error loading invoice image:', imageUrl);
                                    console.error('Error details:', e);
                                    // Try to show fallback
                                    e.currentTarget.onerror = null; // Prevent infinite loop
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  onLoad={() => {
                                    console.log('Image loaded successfully:', imageUrl);
                                  }}
                                />
                                <Button
                                  variant="none"
                                  size="sm"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          } else {
                            return <span className="text-muted-foreground">-</span>;
                          }
                        })()}
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
                        {customer.subscriptionType ? (
                          <span className="text-green-700 bg-green-50 px-2 py-1 rounded text-sm">{customer.subscriptionType}</span>
                        ) : (
                          <span className="text-green-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
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
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
                        {getSubscriptionStatusBadge(customer)}
                      </TableCell>
                      {customFields.map((field) => {
                        const value = customer.customFields?.[field.name];
                        return (
                          <TableCell key={field.id} className="p-4 border-r border-green-100">
                            <div className="text-sm">
                              {value ? (
                                <span className="text-white">{value}</span>
                              ) : (
                                <span className="text-green-400">-</span>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="p-4 border-r border-green-100">
                        <div className="text-sm text-white">
                          {formatDate(customer.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="p-4 border-r border-green-100">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="none" 
                            size="sm" 
                            onClick={() => handleRestrictedAction(() => openEditDialog(customer))}
                            className=" text-green-400"
                          >
                            <Edit className="h-6 w-6" />
                          </Button>
                          <Button 
                            variant="none" 
                            size="sm" 
                            onClick={() => handleRestrictedAction(() => handleDeleteCustomer(customer.id))}
                            className=" text-red-400"
                          >
                            <Trash2 className="h-6 w-6" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

        
        </CardContent>
        <TutorialVideoModal
        tutorial={selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
        onViewIncrement={incrementViews}
      />
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
            stores={stores}
            platforms={platforms}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm   flex items-center justify-center z-50">
          <div className="gradient-border rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-semibold">صورة الفاتورة</h3>
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
    </div>
  );
}

// Customer Form Component
function CustomerForm({ formData, setFormData, onSubmit, onCancel, submitText, customFields = [], categories = [], stores = [], platforms = [], invoiceImage, invoiceImagePreview, handleInvoiceImageChange, clearInvoiceImage }: {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitText: string;
  customFields?: CustomField[];
  categories?: Category[];
  stores?: { id: number; name: string }[];
  platforms?: { id: number; name: string }[];
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
          <select
            id="categoryName"
            className="w-full p-2 rounded-md border border-blue-300 bg-[#01191040]"
            value={formData.categoryName}
            onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
          >
            <option value="">اختر التصنيف</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
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
          <select
            id="storeName"
            className="w-full p-2 rounded-md border border-blue-300 bg-[#01191040]"
            value={formData.storeName}
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
          >
            <option value="">اختر المتجر</option>
            {stores.map((s: { id: number; name: string }) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="platformName">اسم المنصة</Label>
          <select
            id="platformName"
            className="w-full p-2 rounded-md border border-blue-300 bg-[#01191040]"
            value={formData.platformName}
            onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
          >
            <option value="">اختر المنصة</option>
            {platforms.map((p: { id: number; name: string }) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
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
          <div className="relative">
          <Input
            id="subscriptionStartDate"
            type="date"
            value={formData.subscriptionStartDate}
            onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
          />
          <Calendar1Icon 
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none z-10"
                          />
          </div>
        </div>
        <div>
          <Label htmlFor="subscriptionEndDate">تاريخ انتهاء الاشتراك</Label>
          <div className="relative">
          <Input
            id="subscriptionEndDate"
            type="date"
            value={formData.subscriptionEndDate}
            onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
          />
           <Calendar1Icon 
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none z-10"
                          />
          </div>
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
        <div>
          <Label htmlFor="purchasePrice">سعر التكلفة</Label>
         
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
      </div>
      
      {/* Invoice Image Upload */}
      <div className="space-y-4">
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">صورة الفاتورة (اختياري)</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoiceImage">رفع صورة الفاتورة</Label>
              <label htmlFor="invoiceImage" className="container cursor-pointer block">
                <div className="header"> 
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                    <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> 
                  <p className="text-white text-sm font-medium">اختر صورة الفاتورة</p>
                </div> 
                <div className="footer"> 
                  <svg fill="#ffffff" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z" fill="white"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z" fill="white"></path></g></svg> 
                  <p className="text-white text-sm font-medium">
                    {invoiceImagePreview ? 'تم اختيار صورة' : "لا يوجد ملف محدد"}
                  </p> 
                  {invoiceImagePreview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (clearInvoiceImage) {
                          clearInvoiceImage();
                        }
                        const fileInput = document.getElementById('invoiceImage') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="cursor-pointer hover:opacity-80 flex items-center justify-center"
                      style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white', height: '130%', fill: 'royalblue', backgroundColor: 'rgba(70, 66, 66, 0.103)', borderRadius: '50%', padding: '2px', cursor: 'pointer', boxShadow: '0 2px 30px rgba(0, 0, 0, 0.205)' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="white" strokeWidth="2"></path> <path d="M19.5 5H4.5" stroke="white" strokeWidth="2" strokeLinecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="white" strokeWidth="2"></path> </g></svg>
                    </button>
                  )}
                </div> 
                <input
                  id="invoiceImage"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleInvoiceImageChange}
                />
              </label>
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
          <DialogDescription className='text-primary'>
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
                {/* <div>
                  <Label htmlFor="fieldPlaceholder">النص التوضيحي</Label>
                  <Input
                    id="fieldPlaceholder"
                    value={newField.placeholder || ''}
                    onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                    placeholder="النص الذي يظهر في الحقل"
                  />
                </div> */}
              </div>
              {/* <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fieldRequired"
                  checked={newField.required || false}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                />
                <Label htmlFor="fieldRequired">حقل مطلوب</Label>
              </div> */}
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
                  <div key={field.id} className="flex items-center justify-between bg-secondry p-4 border border-blue-300 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{field.label}</h4>
                        {field.required && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </div>
                      <p className="text-sm text-primary">
                        {field.name} • {getFieldTypeLabel(field.type)}
                        {field.placeholder && ` • ${field.placeholder}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditField(field)}
                      >
                        <Edit className="h-6 w-6 text-blue-500" />
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteField(field.id)}
                      >
                        <Trash2 className="h-6 w-6 text-red-300" />
                      </Button>
                    </div>
                  </div>
                ))}
                {customFields.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    لا توجد حقول مخصصة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="destructive" onClick={onClose}>
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
          <DialogDescription className='text-primary'>
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