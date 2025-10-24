'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  Crown,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { getCustomer, updateCustomer, addCustomerInteraction, getCustomerInteractions } from '@/lib/api';

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  subscriptionType: 'basic' | 'premium' | 'enterprise' | 'custom';
  subscriptionStatus: 'active' | 'inactive' | 'expired' | 'suspended';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  planId?: number;
  notes?: string;
  tags: string[];
  customFields: Record<string, any>;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  isVip: boolean;
  source?: string;
  address?: string;
  socialMedia: Record<string, string>;
  plan?: {
    id: number;
    name: string;
    priceCents: number;
    interval: string;
  };
  interactions?: Array<{
    id: number;
    type: string;
    subject: string;
    description?: string;
    outcome: string;
    followUpRequired: boolean;
    followUpDate?: string;
    attachments: string[];
    createdAt: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subscriptionType: 'basic' as const,
    subscriptionStatus: 'active' as const,
    subscriptionStartDate: '',
    subscriptionEndDate: '',
    planId: '',
    notes: '',
    tags: [] as string[],
    customFields: {} as Record<string, any>,
    lastContactDate: '',
    nextFollowUpDate: '',
    isVip: false,
    source: '',
    address: '',
    socialMedia: {} as Record<string, string>
  });
  const [interactionData, setInteractionData] = useState({
    type: 'call',
    subject: '',
    description: '',
    outcome: 'neutral',
    followUpRequired: false,
    followUpDate: '',
    attachments: [] as string[]
  });

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await getCustomer(token, parseInt(customerId));
      if (response.success) {
        setCustomer(response.data);
        setFormData({
          name: response.data.name,
          email: response.data.email || '',
          phone: response.data.phone || '',
          company: response.data.company || '',
          subscriptionType: response.data.subscriptionType,
          subscriptionStatus: response.data.subscriptionStatus,
          subscriptionStartDate: response.data.subscriptionStartDate || '',
          subscriptionEndDate: response.data.subscriptionEndDate || '',
          planId: response.data.planId?.toString() || '',
          notes: response.data.notes || '',
          tags: response.data.tags,
          customFields: response.data.customFields,
          lastContactDate: response.data.lastContactDate || '',
          nextFollowUpDate: response.data.nextFollowUpDate || '',
          isVip: response.data.isVip,
          source: response.data.source || '',
          address: response.data.address || '',
          socialMedia: response.data.socialMedia
        });
        setHasAccess(true);
      } else {
        if (response.code === 'CUSTOMER_MANAGEMENT_DENIED') {
          setHasAccess(false);
        }
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('فشل في جلب بيانات العميل');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await updateCustomer(token, parseInt(customerId), formData);
      if (response.success) {
        toast.success('تم تحديث العميل بنجاح');
        setIsEditDialogOpen(false);
        fetchCustomer();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('فشل في تحديث العميل');
    }
  };

  const handleAddInteraction = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await addCustomerInteraction(token, parseInt(customerId), interactionData);
      if (response.success) {
        toast.success('تم إضافة التفاعل بنجاح');
        setIsInteractionDialogOpen(false);
        setInteractionData({
          type: 'call',
          subject: '',
          description: '',
          outcome: 'neutral',
          followUpRequired: false,
          followUpDate: '',
          attachments: []
        });
        fetchCustomer();
      }
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast.error('فشل في إضافة التفاعل');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'expired': return 'destructive';
      case 'suspended': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'basic': return 'secondary';
      case 'premium': return 'default';
      case 'enterprise': return 'destructive';
      case 'custom': return 'outline';
      default: return 'secondary';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'negative': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInteractionTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'support': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // إذا لم يكن لديه صلاحية، اعرض رسالة عدم الصلاحية
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
                variant="outline" 
                onClick={() => window.location.href = '/customers'}
                className="w-full"
              >
                العودة لإدارة العملاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">العميل غير موجود</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{customer.name}</h1>
              {customer.isVip && <Crown className="h-6 w-6 text-yellow-500" />}
            </div>
            <p className="text-muted-foreground">تفاصيل العميل وإدارة التفاعلات</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                إضافة تفاعل
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة تفاعل جديد</DialogTitle>
                <DialogDescription>
                  سجل تفاعل جديد مع العميل
                </DialogDescription>
              </DialogHeader>
              <InteractionForm 
                data={interactionData}
                setData={setInteractionData}
                onSubmit={handleAddInteraction}
                submitText="إضافة التفاعل"
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                تعديل
              </Button>
            </DialogTrigger>
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
                submitText="حفظ التغييرات"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="interactions">التفاعلات</TabsTrigger>
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  معلومات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(customer.subscriptionStatus)}>
                    {customer.subscriptionStatus === 'active' ? 'نشط' :
                     customer.subscriptionStatus === 'inactive' ? 'غير نشط' :
                     customer.subscriptionStatus === 'expired' ? 'منتهي' : 'معلق'}
                  </Badge>
                  <Badge variant={getTypeBadgeVariant(customer.subscriptionType)}>
                    {customer.subscriptionType === 'basic' ? 'أساسي' :
                     customer.subscriptionType === 'premium' ? 'مميز' :
                     customer.subscriptionType === 'enterprise' ? 'مؤسسي' : 'مخصص'}
                  </Badge>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {customer.phone}
                  </div>
                )}
                {customer.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {customer.company}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {customer.address}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  معلومات الاشتراك
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.plan && (
                  <div className="text-sm">
                    <span className="font-medium">الباقة:</span> {customer.plan.name}
                  </div>
                )}
                {customer.subscriptionStartDate && (
                  <div className="text-sm">
                    <span className="font-medium">تاريخ البداية:</span> {new Date(customer.subscriptionStartDate).toLocaleDateString('ar-SA')}
                  </div>
                )}
                {customer.subscriptionEndDate && (
                  <div className="text-sm">
                    <span className="font-medium">تاريخ الانتهاء:</span> {new Date(customer.subscriptionEndDate).toLocaleDateString('ar-SA')}
                  </div>
                )}
                {customer.source && (
                  <div className="text-sm">
                    <span className="font-medium">المصدر:</span> {customer.source}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  معلومات التواصل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.lastContactDate && (
                  <div className="text-sm">
                    <span className="font-medium">آخر تواصل:</span> {new Date(customer.lastContactDate).toLocaleDateString('ar-SA')}
                  </div>
                )}
                {customer.nextFollowUpDate && (
                  <div className="text-sm">
                    <span className="font-medium">متابعة قادمة:</span> {new Date(customer.nextFollowUpDate).toLocaleDateString('ar-SA')}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">تاريخ الإنشاء:</span> {new Date(customer.createdAt).toLocaleDateString('ar-SA')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل التفاعلات</CardTitle>
              <CardDescription>
                جميع التفاعلات مع العميل
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.interactions && customer.interactions.length > 0 ? (
                <div className="space-y-4">
                  {customer.interactions.map((interaction) => (
                    <div key={interaction.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getInteractionTypeIcon(interaction.type)}
                          <h4 className="font-medium">{interaction.subject}</h4>
                          {getOutcomeIcon(interaction.outcome)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(interaction.createdAt).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                      {interaction.description && (
                        <p className="text-sm text-muted-foreground mb-2">{interaction.description}</p>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-4">
                          <span>النوع: {interaction.type}</span>
                          <span>النتيجة: {interaction.outcome}</span>
                          {interaction.followUpRequired && (
                            <Badge variant="outline">متابعة مطلوبة</Badge>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          بواسطة: {interaction.user.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد تفاعلات مسجلة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.tags && customer.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">العلامات</h4>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {Object.keys(customer.customFields).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">حقول مخصصة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(customer.customFields).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(customer.socialMedia).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">وسائل التواصل الاجتماعي</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(customer.socialMedia).map(([platform, handle]) => (
                      <div key={platform} className="text-sm">
                        <span className="font-medium">{platform}:</span> {handle}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Customer Form Component
function CustomerForm({ formData, setFormData, onSubmit, submitText }: {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  submitText: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">الاسم *</Label>
          <Input
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
          <Label htmlFor="company">الشركة</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="اسم الشركة"
          />
        </div>
        <div>
          <Label htmlFor="subscriptionType">نوع الاشتراك</Label>
          <Select value={formData.subscriptionType} onValueChange={(value) => setFormData({ ...formData, subscriptionType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">أساسي</SelectItem>
              <SelectItem value="premium">مميز</SelectItem>
              <SelectItem value="enterprise">مؤسسي</SelectItem>
              <SelectItem value="custom">مخصص</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subscriptionStatus">حالة الاشتراك</Label>
          <Select value={formData.subscriptionStatus} onValueChange={(value) => setFormData({ ...formData, subscriptionStatus: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
              <SelectItem value="expired">منتهي</SelectItem>
              <SelectItem value="suspended">معلق</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="ملاحظات إضافية"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => {}}>
          إلغاء
        </Button>
        <Button onClick={onSubmit}>
          {submitText}
        </Button>
      </div>
    </div>
  );
}

// Interaction Form Component
function InteractionForm({ data, setData, onSubmit, submitText }: {
  data: any;
  setData: (data: any) => void;
  onSubmit: () => void;
  submitText: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">نوع التفاعل</Label>
          <Select value={data.type} onValueChange={(value) => setData({ ...data, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">مكالمة</SelectItem>
              <SelectItem value="email">بريد إلكتروني</SelectItem>
              <SelectItem value="meeting">اجتماع</SelectItem>
              <SelectItem value="message">رسالة</SelectItem>
              <SelectItem value="support">دعم فني</SelectItem>
              <SelectItem value="other">أخرى</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="outcome">النتيجة</Label>
          <Select value={data.outcome} onValueChange={(value) => setData({ ...data, outcome: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="positive">إيجابية</SelectItem>
              <SelectItem value="neutral">محايدة</SelectItem>
              <SelectItem value="negative">سلبية</SelectItem>
              <SelectItem value="pending">معلقة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="subject">الموضوع *</Label>
        <Input
          id="subject"
          value={data.subject}
          onChange={(e) => setData({ ...data, subject: e.target.value })}
          placeholder="موضوع التفاعل"
        />
      </div>
      <div>
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder="وصف التفاعل"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => {}}>
          إلغاء
        </Button>
        <Button onClick={onSubmit}>
          {submitText}
        </Button>
      </div>
    </div>
  );
}



