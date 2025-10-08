"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  listContentCategories, 
  createContentCategory, 
  deleteContentCategory, 
  listContentItems,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  scheduleContentItem,
  generateAIContent,
  ContentCategory,
  ContentItem,
  checkPlatformConnections
} from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Image, 
  Video, 
  FileText, 
  Clock, 
  Send,
  Sparkles,
  Copy,
  Save,
  Upload
} from "lucide-react";

type Platform = 'facebook' | 'instagram' | 'linkedin' | 'pinterest' | 'tiktok' | 'youtube' | 'twitter';

export default function ContentHomePage() {
  const router = useRouter();
  const { canManageContent, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
  
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGeneratedContent, setAiGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ContentCategory | null>(null);
  
  // Item creation form
  const [itemTitle, setItemTitle] = useState("");
  const [itemBody, setItemBody] = useState("");
  const [itemAttachments, setItemAttachments] = useState<ContentItem['attachments']>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [connections, setConnections] = useState<{[k in Platform]?: boolean}>({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const token = typeof window !== 'undefined' ? (localStorage.getItem("auth_token") || "") : "";

  const loadCategories = async () => {
    try {
      const res = await listContentCategories(token);
      setCategories(res.categories);
      if (res.categories.length > 0 && !selectedCategory) {
        setSelectedCategory(res.categories[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (categoryId: number) => {
    try {
      setItemsLoading(true);
      const res = await listContentItems(token, categoryId);
      setItems(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => { 
    loadCategories();
    (async () => {
      try {
        const { connections } = await checkPlatformConnections(token);
        setConnections(connections as any);
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadItems(selectedCategory.id);
    }
  }, [selectedCategory]);

  // Check permissions after all hooks
  if (permissionsLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">إدارة المحتوى</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription()) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">إدارة المحتوى</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا يوجد اشتراك نشط</h3>
            <p className="text-gray-600 mb-4">تحتاج إلى اشتراك نشط للوصول إلى إدارة المحتوى</p>
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

  if (!canManageContent()) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">إدارة المحتوى</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ليس لديك صلاحية إدارة المحتوى</h3>
            <p className="text-gray-600 mb-4">باقتك الحالية لا تشمل إدارة المحتوى</p>
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

  const onCreateCategory = async () => {
    if (!name.trim()) return;
    await createContentCategory(token, { name, description });
    setName("");
    setDescription("");
    setShowCreateCategory(false);
    await loadCategories();
  };

  const onDeleteCategory = async (id: number) => {
    const category = categories.find(c => c.id === id);
    if (category) {
      setCategoryToDelete(category);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteContentCategory(token, categoryToDelete.id);
      await loadCategories();
      if (selectedCategory?.id === categoryToDelete.id) {
        setSelectedCategory(categories.find(c => c.id !== categoryToDelete.id) || null);
      }
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('حدث خطأ أثناء حذف التصنيف');
    }
  };

  const onDeleteItem = async (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setItemToDelete(item);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      await deleteContentItem(token, itemToDelete.id);
      if (selectedCategory) {
        await loadItems(selectedCategory.id);
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('حدث خطأ أثناء حذف العنصر');
    }
  };

  const onCreateItem = async () => {
    if (!itemTitle.trim() || !selectedCategory) return;
    await createContentItem(token, selectedCategory.id, { 
      title: itemTitle, 
      body: itemBody, 
      attachments: itemAttachments 
    });
    setItemTitle("");
    setItemBody("");
    setItemAttachments([]);
    setSelectedPlatforms([]);
    setScheduledAt("");
    setShowCreateItem(false);
    await loadItems(selectedCategory.id);
  };

  const onScheduleItem = async () => {
    if (!itemTitle.trim() || !selectedCategory) {
      alert('يرجى إدخال عنوان العنصر');
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      alert('يرجى اختيار منصة واحدة على الأقل للنشر');
      return;
    }
    
    // Check if platforms are connected
    const disconnectedPlatforms = selectedPlatforms.filter((p) => connections[p] !== true);
    if (disconnectedPlatforms.length > 0) {
      alert(`المنصات التالية غير متصلة: ${disconnectedPlatforms.join(', ')}. يرجى ربطها أولاً من صفحة المنصات.`);
      return;
    }

    if (!scheduledAt) {
      alert('يرجى تحديد تاريخ ووقت الجدولة');
      return;
    }

    try {
      // Create the content item first
      const itemRes = await createContentItem(token, selectedCategory.id, { 
        title: itemTitle, 
        body: itemBody, 
        attachments: itemAttachments 
      });

      // Schedule it
      await scheduleContentItem(token, itemRes.item.id, {
        platforms: selectedPlatforms as string[],
        format: 'feed',
        scheduledAt: new Date(scheduledAt).toISOString()
      });
      
      alert(`تم جدولة العنصر بنجاح على المنصات التالية: ${selectedPlatforms.join(', ')}. تحقق من صفحة الجدولة.`);
      router.push('/schedule');

      // Reset form
      setItemTitle("");
      setItemBody("");
      setItemAttachments([]);
      setSelectedPlatforms([]);
      setScheduledAt("");
      setShowCreateItem(false);
      await loadItems(selectedCategory.id);
    } catch (error) {
      console.error('Error creating/scheduling item:', error);
      alert('حدث خطأ أثناء إنشاء/جدولة العنصر. تأكد من اتصال المنصات المحددة.');
    }
  };

  const uploadFile = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.flooxira.com'}/api/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    const type: any = (file.type.startsWith('video') ? 'video' : (file.type.startsWith('image') ? 'image' : 'file'));
    return { url: data.url, type } as { url: string; type: 'image' | 'video' | 'file' };
  };

  const handleFileUpload = async (files: FileList) => {
    const arr = Array.from(files);
    const uploaded = await Promise.all(arr.map(uploadFile));
    setItemAttachments(prev => [...prev, ...uploaded]);
  };

  const removeAttachment = (idx: number) => {
    setItemAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const generateAIContentHandler = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await generateAIContent(token, {
        prompt: aiPrompt,
        platform: selectedPlatforms[0] || 'facebook',
        tone: 'professional',
        length: 'medium'
      });
      setAiGeneratedContent(response.content);
    } catch (e) {
      console.error('AI generation failed:', e);
      alert('فشل في إنشاء المحتوى بالذكاء الاصطناعي');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAIContent = () => {
    setItemBody(aiGeneratedContent);
    setShowAIModal(false);
    setAiPrompt("");
    setAiGeneratedContent("");
  };

  const onEditItem = (item: ContentItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemBody(item.body || "");
    setItemAttachments(item.attachments || []);
    setSelectedPlatforms(item.platforms as Platform[] || []);
    setScheduledAt(item.scheduledAt ? item.scheduledAt.slice(0,16) : "");
    setShowEditItem(true);
  };

  const onUpdateItem = async () => {
    if (!editingItem || !itemTitle.trim()) return;
    
    try {
      await updateContentItem(token, editingItem.id, {
        title: itemTitle,
        body: itemBody,
        attachments: itemAttachments,
        platforms: selectedPlatforms,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null
      });
      
      setShowEditItem(false);
      setEditingItem(null);
      setItemTitle("");
      setItemBody("");
      setItemAttachments([]);
      setSelectedPlatforms([]);
      setScheduledAt("");
      
      if (selectedCategory) {
        await loadItems(selectedCategory.id);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('حدث خطأ أثناء تحديث العنصر');
    }
  };

  const onScheduleEditedItem = async () => {
    if (!editingItem || !itemTitle.trim()) {
      alert('يرجى إدخال عنوان العنصر');
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      alert('يرجى اختيار منصة واحدة على الأقل للنشر');
      return;
    }
    
    // Check if platforms are connected
    const disconnectedPlatforms = selectedPlatforms.filter((p) => connections[p] !== true);
    if (disconnectedPlatforms.length > 0) {
      alert(`المنصات التالية غير متصلة: ${disconnectedPlatforms.join(', ')}. يرجى ربطها أولاً من صفحة المنصات.`);
      return;
    }

    if (!scheduledAt) {
      alert('يرجى تحديد تاريخ ووقت الجدولة');
      return;
    }

    try {
      // Update the content item first
      await updateContentItem(token, editingItem.id, {
        title: itemTitle,
        body: itemBody,
        attachments: itemAttachments,
        platforms: selectedPlatforms,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null
      });

      // Schedule it
      await scheduleContentItem(token, editingItem.id, {
        platforms: selectedPlatforms as string[],
        format: 'feed',
        scheduledAt: new Date(scheduledAt).toISOString()
      });
      
      alert(`تم جدولة العنصر بنجاح على المنصات التالية: ${selectedPlatforms.join(', ')}. تحقق من صفحة الجدولة.`);
      router.push('/schedule');

      // Reset form
      setShowEditItem(false);
      setEditingItem(null);
      setItemTitle("");
      setItemBody("");
      setItemAttachments([]);
      setSelectedPlatforms([]);
      setScheduledAt("");
      
      if (selectedCategory) {
        await loadItems(selectedCategory.id);
      }
    } catch (error) {
      console.error('Error updating/scheduling item:', error);
      alert('حدث خطأ أثناء تحديث/جدولة العنصر. تأكد من اتصال المنصات المحددة.');
    }
  };

  const togglePlatform = (p: Platform) => {
    // Check if platform is connected before allowing selection
    if (connections[p] !== true) {
      alert(`المنصة ${p} غير متصلة. يرجى ربطها أولاً من صفحة المنصات.`);
      return;
    }
    
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getItemsForDay = (day: number) => {
    return items.filter(item => {
      if (!item.scheduledAt) return false;
      const itemDate = new Date(item.scheduledAt);
      return itemDate.getDate() === day && 
             itemDate.getMonth() + 1 === currentMonth && 
             itemDate.getFullYear() === currentYear;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const currentDate = new Date();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  return (
    <div className="min-h-screen bg-gradient-custom">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Content Management</h1>
          <p className="text-gray-300 text-lg">إدارة المحتوى الاحترافية للمنصات الاجتماعية</p>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-card border-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{categories.length}</p>
                    <p className="text-gray-400 text-sm">التصنيفات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

      <Card className="bg-card border-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{items.length}</p>
                    <p className="text-gray-400 text-sm">العناصر</p>
                  </div>
                </div>
        </CardContent>
      </Card>

            <Card className="bg-card border-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{items.filter(item => item.scheduledAt).length}</p>
                    <p className="text-gray-400 text-sm">مجدولة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Categories Tabs */}
        <Card className="bg-card border-none mb-6">
          <CardHeader className="border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">التصنيفات</h2>
              <Button 
                onClick={() => setShowCreateCategory(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة تصنيف
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
        {loading ? (
              <div className="p-6 text-center text-gray-400">جاري التحميل...</div>
        ) : categories.length === 0 ? (
              <div className="p-6 text-center text-gray-400">لا توجد تصنيفات بعد</div>
            ) : (
              <div className="flex flex-wrap gap-2 p-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      selectedCategory?.id === category.id
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <span>{category.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCategory(category.id);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Area */}
        {selectedCategory && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <Card className="bg-card border-none">
                <CardHeader className="border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {monthNames[currentMonth - 1]} {currentYear}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => navigateMonth('prev')}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        ← السابق
                      </Button>
                      <Button 
                        onClick={() => navigateMonth('next')}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        التالي →
                      </Button>
                      <Button 
                        onClick={() => setShowCreateItem(true)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة عنصر
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {itemsLoading ? (
                    <div className="text-center py-8 text-gray-400">جاري تحميل العناصر...</div>
                  ) : (
                    <div className="grid grid-cols-7 gap-2">
                      {/* Day headers */}
                      {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                        <div key={day} className="p-3 text-center font-semibold text-green-400 bg-gray-800 rounded-lg">
                          {day}
                        </div>
                      ))}
                      
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: firstDay }).map((_, index) => (
                        <div key={`empty-${index}`} className="p-3 h-20 bg-gray-800 rounded-lg"></div>
                      ))}
                      
                      {/* Days of the month */}
                      {Array.from({ length: daysInMonth }, (_, index) => {
                        const day = index + 1;
                        const dayItems = getItemsForDay(day);
                        const isToday = day === currentDate.getDate() && 
                                       currentMonth === currentDate.getMonth() + 1 && 
                                       currentYear === currentDate.getFullYear();
                        const isPast = new Date(currentYear, currentMonth - 1, day) < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                        const isFuture = new Date(currentYear, currentMonth - 1, day) > new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                        
                        return (
                          <div
                            key={day}
                            className={`p-2 h-20 rounded-lg cursor-pointer transition-all duration-200 ${
                              isToday 
                                ? 'bg-green-600 text-white shadow-lg' 
                                : isPast
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : isFuture
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200'
                                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}
                          >
                            <div className="text-sm font-semibold mb-1">
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayItems.slice(0, 2).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs bg-green-500 text-white px-1 py-0.5 rounded truncate cursor-pointer hover:bg-green-600"
                                  title={item.title}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditItem(item);
                                  }}
                                >
                                  {item.title}
                                </div>
                              ))}
                              {dayItems.length > 2 && (
                                <div className="text-xs bg-gray-600 text-white px-1 py-0.5 rounded">
                                  +{dayItems.length - 2}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Items List */}
            <div className="lg:col-span-1">
              <Card className="bg-card border-none">
                <CardHeader className="border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white">العناصر</h3>
                </CardHeader>
                <CardContent className="p-4">
                  {itemsLoading ? (
                    <div className="text-center py-4 text-gray-400">جاري التحميل...</div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                      <p>لا توجد عناصر بعد</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer content-card"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-medium text-sm mb-1">{item.title}</h4>
                              <p className="text-gray-400 text-xs mb-2 line-clamp-2">{item.body}</p>
                              <div className="flex items-center gap-2">
                                {item.attachments.map((att, idx) => (
                                  <div key={idx} className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                    {att.type === 'image' ? <Image className="w-3 h-3 inline mr-1" /> : 
                                     att.type === 'video' ? <Video className="w-3 h-3 inline mr-1" /> : 
                                     <FileText className="w-3 h-3 inline mr-1" />}
                                    {att.type}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button 
                                onClick={() => onEditItem(item)}
                                className="text-green-400 hover:text-green-300"
                                title="تحرير"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => onDeleteItem(item.id)}
                                className="text-red-400 hover:text-red-300"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Create Category Modal */}
        {showCreateCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">إضافة تصنيف جديد</h3>
              <div className="space-y-4">
                <Input 
                  placeholder="اسم التصنيف" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Textarea 
                  placeholder="وصف التصنيف (اختياري)" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <div className="flex gap-2">
                  <Button onClick={onCreateCategory} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                    إنشاء
                  </Button>
                  <Button 
                    onClick={() => setShowCreateCategory(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Item Modal */}
        {showCreateItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">إضافة عنصر جديد</h3>
              <div className="space-y-4">
                <Input 
                  placeholder="عنوان العنصر" 
                  value={itemTitle} 
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm">المحتوى</label>
                    <Button
                      onClick={() => setShowAIModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      إنشاء بالذكاء الاصطناعي
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="اكتب المحتوى..." 
                    value={itemBody} 
                    onChange={(e) => setItemBody(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm">المرفقات</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  />
                  <div className="flex flex-wrap gap-2">
                    {itemAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded">
                        <span className="text-white text-sm">{att.type}</span>
                        <button 
                          onClick={() => removeAttachment(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm">المنصات</label>
                    <div className="text-xs text-gray-400">
                      المنصات غير المتصلة معطلة ❌
                      <button 
                        onClick={() => router.push('/platforms')}
                        className="text-green-400 hover:text-green-300 underline ml-1"
                      >
                        ربط المنصات
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['facebook','instagram','linkedin','pinterest','tiktok','youtube','twitter'] as Platform[]).map((p) => {
                      const selected = selectedPlatforms.includes(p);
                      const connected = connections[p] === true;
                      return (
                        <button
                          key={p}
                          onClick={() => togglePlatform(p)}
                          disabled={!connected}
                          className={`px-3 py-1 rounded flex items-center gap-2 text-sm transition-all ${
                            !connected 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                              : selected 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          title={connected ? `متصل - ${p}` : `غير متصل - ${p}. يرجى ربط المنصة أولاً`}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                          {p}
                          {!connected && <span className="text-xs">❌</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm">الجدولة</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={onCreateItem} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    حفظ
                  </Button>
                  <Button 
                    onClick={onScheduleItem}
                    disabled={selectedPlatforms.length === 0 || selectedPlatforms.some(p => connections[p] !== true) || !scheduledAt}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    title={
                      selectedPlatforms.length === 0 
                        ? 'اختر منصة واحدة على الأقل' 
                        : selectedPlatforms.some(p => connections[p] !== true)
                        ? 'تأكد من اتصال جميع المنصات المحددة'
                        : !scheduledAt
                        ? 'حدد تاريخ ووقت الجدولة'
                        : 'جدولة العنصر'
                    }
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    جدولة
                  </Button>
                  <Button 
                    onClick={() => setShowCreateItem(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {showEditItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">تحرير العنصر</h3>
              <div className="space-y-4">
                <Input 
                  placeholder="عنوان العنصر" 
                  value={itemTitle} 
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm">المحتوى</label>
                    <Button
                      onClick={() => setShowAIModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      إنشاء بالذكاء الاصطناعي
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="اكتب المحتوى..." 
                    value={itemBody} 
                    onChange={(e) => setItemBody(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm">المرفقات</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  />
                  <div className="flex flex-wrap gap-2">
                    {itemAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded">
                        <span className="text-white text-sm">{att.type}</span>
                        <button 
                          onClick={() => removeAttachment(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm">المنصات</label>
                    <div className="text-xs text-gray-400">
                      المنصات غير المتصلة معطلة ❌
                      <button 
                        onClick={() => router.push('/platforms')}
                        className="text-green-400 hover:text-green-300 underline ml-1"
                      >
                        ربط المنصات
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['facebook','instagram','linkedin','pinterest','tiktok','youtube','twitter'] as Platform[]).map((p) => {
                      const selected = selectedPlatforms.includes(p);
                      const connected = connections[p] === true;
                      return (
                        <button
                          key={p}
                          onClick={() => togglePlatform(p)}
                          disabled={!connected}
                          className={`px-3 py-1 rounded flex items-center gap-2 text-sm transition-all ${
                            !connected 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                              : selected 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          title={connected ? `متصل - ${p}` : `غير متصل - ${p}. يرجى ربط المنصة أولاً`}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                          {p}
                          {!connected && <span className="text-xs">❌</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm">الجدولة</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={onUpdateItem} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    تحديث
                  </Button>
                  <Button 
                    onClick={onScheduleEditedItem}
                    disabled={selectedPlatforms.length === 0 || selectedPlatforms.some(p => connections[p] !== true) || !scheduledAt}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    title={
                      selectedPlatforms.length === 0 
                        ? 'اختر منصة واحدة على الأقل' 
                        : selectedPlatforms.some(p => connections[p] !== true)
                        ? 'تأكد من اتصال جميع المنصات المحددة'
                        : !scheduledAt
                        ? 'حدد تاريخ ووقت الجدولة'
                        : 'جدولة العنصر'
                    }
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    جدولة
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowEditItem(false);
                      setEditingItem(null);
                      setItemTitle("");
                      setItemBody("");
                      setItemAttachments([]);
                      setSelectedPlatforms([]);
                      setScheduledAt("");
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Content Generator Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">إنشاء المحتوى بالذكاء الاصطناعي</h3>
              <div className="space-y-4">
                <Textarea 
                  placeholder="اكتب البروميت الخاص بك..." 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                />
                
                {aiGeneratedContent && (
                  <div className="space-y-2">
                    <label className="text-white text-sm">المحتوى المُولد:</label>
                    <div className="bg-gray-800 border border-gray-700 rounded p-3 text-white text-sm">
                      {aiGeneratedContent}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={generateAIContentHandler} 
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                  >
                    {isGenerating ? 'جاري الإنشاء...' : 'إنشاء المحتوى'}
                  </Button>
                  {aiGeneratedContent && (
                    <Button 
                      onClick={copyAIContent}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      نسخ
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      setShowAIModal(false);
                      setAiPrompt("");
                      setAiGeneratedContent("");
                    }}
                    variant="secondary"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">تأكيد الحذف</h3>
              <div className="space-y-4">
                {categoryToDelete && (
                  <div>
                    <p className="text-gray-300 mb-2">هل أنت متأكد من حذف التصنيف:</p>
                    <p className="text-white font-medium">{categoryToDelete.name}</p>
                    <p className="text-red-400 text-sm mt-2">⚠️ سيتم حذف جميع العناصر في هذا التصنيف أيضاً</p>
                  </div>
                )}
                
                {itemToDelete && (
                  <div>
                    <p className="text-gray-300 mb-2">هل أنت متأكد من حذف العنصر:</p>
                    <p className="text-white font-medium">{itemToDelete.title}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (categoryToDelete) {
                        confirmDeleteCategory();
                      } else if (itemToDelete) {
                        confirmDeleteItem();
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    حذف
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCategoryToDelete(null);
                      setItemToDelete(null);
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


