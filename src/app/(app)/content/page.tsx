"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { useTutorials } from "@/hooks/useTutorials";
import { TutorialVideoModal } from "@/components/TutorialVideoModal";
import { Tutorial } from "@/types/tutorial";
import { BookOpen } from "lucide-react";

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
import { toast } from "sonner";
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
import Loader from "@/components/Loader";
import NoActiveSubscription from "@/components/NoActiveSubscription";
import AnimatedTutorialButton from "@/components/YoutubeButton";

type Platform = 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'twitter';

export default function ContentHomePage() {
  // Add style for datetime-local calendar icon
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const router = useRouter();
  const { canManageContent, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
    const { showSuccess, showError } = useToast();

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
  
  // Reminder system
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderWhatsApp, setReminderWhatsApp] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [itemToRemind, setItemToRemind] = useState<ContentItem | null>(null);
  const [whatsappSessionPhone, setWhatsappSessionPhone] = useState<string>("");
  const [activeReminders, setActiveReminders] = useState<Set<number>>(new Set());
  
  // Message modals
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  // Item creation form
  const [itemTitle, setItemTitle] = useState("");
  const [itemBody, setItemBody] = useState("");
  const [itemAttachments, setItemAttachments] = useState<ContentItem['attachments']>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [connections, setConnections] = useState<{[k in Platform]?: boolean}>({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [createdItemId, setCreatedItemId] = useState<number | null>(null); // Track newly created item ID
  
  const token = typeof window !== 'undefined' ? (localStorage.getItem("auth_token") || "") : "";

  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const { tutorials, getTutorialByCategory, incrementViews } = useTutorials();
  const handleShowTutorial = () => {
    const contentTutorial = 
      getTutorialByCategory('Content') || 
      getTutorialByCategory('محتوى') || 
      getTutorialByCategory('Content') || 
      getTutorialByCategory('محتوى') ||
      getTutorialByCategory('Content') || 
      getTutorialByCategory('محتوى') ||
      tutorials.find(t => 
        t.title.toLowerCase().includes('محتوى') ||
        t.title.toLowerCase().includes('Content') ||
        t.category.toLowerCase().includes('محتوى') ||
        t.category.toLowerCase().includes('Content')
      ) || null;
    
    if (contentTutorial) {
      setSelectedTutorial(contentTutorial);
      incrementViews(contentTutorial.id);
    } else {
      showError("لم يتم العثور على شرح خاص بالمحتوى");
    }
  };

  useEffect(() => {
    if (!permissionsLoading && !hasActiveSubscription) {
      showError("لا يوجد اشتراك نشط");
    }
  }, [hasActiveSubscription, permissionsLoading]);
  
  // Helper function to convert local datetime to ISO string without timezone conversion
  const localDateTimeToISO = (localDateTime: string): string => {
    if (!localDateTime) return '';
    // The datetime-local input gives us a string like "2024-10-13T03:08" (no timezone)
    // When we create a Date from it, the browser interprets it as LOCAL time
    // For example: in GMT+3, "2024-10-13T03:08" becomes 2024-10-13 03:08 local = 00:08 UTC
    // We want to store the USER'S CHOSEN TIME, which means we need to preserve the local interpretation
    const date = new Date(localDateTime);
    // date.toISOString() will give us the correct UTC equivalent
    // Example: User in GMT+3 picks 03:08 local → stored as 00:08 UTC → displays as 03:08 when shown in GMT+3
    return date.toISOString();
  };
 

  // Show message modal
  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessageText(text);
    setMessageType(type);
    setShowMessageModal(true);
  };

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
      // Also load active reminders when loading items
      loadActiveReminders();
    } catch (e) {
      console.error(e);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadActiveReminders = async () => {
    try {
      console.log('[Content] Loading active reminders...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/reminder`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Content] Reminders response:', data);
        if (data.success) {
          const activeReminderIds = new Set<number>(data.reminders.map((r: any) => Number(r.contentItemId)));
          console.log('[Content] Active reminder IDs:', Array.from(activeReminderIds));
          setActiveReminders(activeReminderIds);
        }
      } else {
        console.error('[Content] Failed to load reminders:', response.status);
      }
    } catch (error) {
      console.error('Error loading active reminders:', error);
    }
  };

  useEffect(() => { 
    loadCategories();
    loadActiveReminders();
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
        <Loader text="جاري التحقق من الصلاحيات..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }



  if (hasActiveSubscription && !canManageContent()) {
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
      showMessage('حدث خطأ أثناء حذف التصنيف', 'error');
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
      console.log('Deleting item:', itemToDelete.id);
      await deleteContentItem(token, itemToDelete.id);
      console.log('Item deleted successfully');
      if (selectedCategory) {
        await loadItems(selectedCategory.id);
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
      showMessage('تم حذف العنصر بنجاح', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showMessage('حدث خطأ أثناء حذف العنصر', 'error');
    }
  };

  const onCreateItem = async () => {
    if (!itemTitle.trim() || !selectedCategory) return;
    
    try {
      // Create the content item first (only if not already created)
      let itemId = createdItemId;
      
      if (!itemId) {
        const itemRes = await createContentItem(token, selectedCategory.id, { 
          title: itemTitle, 
          body: itemBody, 
          attachments: itemAttachments,
          scheduledAt: scheduledAt ? localDateTimeToISO(scheduledAt) : null
        });
        itemId = itemRes.item.id;
        setCreatedItemId(itemId);
      }
      
      // Update the item with platforms if they are selected
      if (selectedPlatforms.length > 0 || scheduledAt) {
        await updateContentItem(token, itemId, {
          title: itemTitle,
          body: itemBody,
          attachments: itemAttachments,
          platforms: selectedPlatforms,
          scheduledAt: scheduledAt ? localDateTimeToISO(scheduledAt) : null
        });
      }

      // If scheduling is enabled and platforms are selected, schedule the item
      if (scheduledAt && selectedPlatforms.length > 0) {
        // Check if platforms are connected
        const disconnectedPlatforms = selectedPlatforms.filter((p) => connections[p] !== true);
        if (disconnectedPlatforms.length > 0) {
          showMessage(`المنصات التالية غير متصلة: ${disconnectedPlatforms.join(', ')}. يرجى ربطها أولاً من صفحة المنصات.`, 'error');
          // Reset created item ID since we're not finishing the process
          setCreatedItemId(null);
          return;
        }

        // Schedule the item
        await scheduleContentItem(token, itemId, {
          platforms: selectedPlatforms as string[],
          format: 'feed',
          scheduledAt: localDateTimeToISO(scheduledAt)
        });
        
        showMessage(`تم إنشاء وجدولة العنصر بنجاح على المنصات التالية: ${selectedPlatforms.join(', ')}. تحقق من صفحة الجدولة.`, 'success');
        router.push('/schedule');
      } else if (scheduledAt && selectedPlatforms.length === 0) {
        // Scheduled time but no platforms selected
        showMessage('⚠️ تم إنشاء العنصر مع تاريخ جدولة، لكن لم يتم جدولته لعدم اختيار منصات. اختر منصات واضغط "جدولة" للنشر.', 'info');
      } else {
        showMessage('تم إنشاء العنصر بنجاح', 'success');
      }

      // Reset form
      setItemTitle("");
      setItemBody("");
      setItemAttachments([]);
      setSelectedPlatforms([]);
      setScheduledAt("");
      setCreatedItemId(null);
      setShowCreateItem(false);
      await loadItems(selectedCategory.id);
    } catch (error) {
      console.error('Error creating/scheduling item:', error);
      showMessage('حدث خطأ أثناء إنشاء/جدولة العنصر. تأكد من اتصال المنصات المحددة.', 'error');
      // Reset created item ID on error
      setCreatedItemId(null);
    }
  };

  const onScheduleItem = async () => {
    if (!itemTitle.trim() || !selectedCategory) {
      showMessage('يرجى إدخال عنوان العنصر', 'error');
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      showMessage('يرجى اختيار منصة واحدة على الأقل للنشر', 'error');
      return;
    }
    
    // Check if platforms are connected
    const disconnectedPlatforms = selectedPlatforms.filter((p) => connections[p] !== true);
    if (disconnectedPlatforms.length > 0) {
      showMessage(`المنصات التالية غير متصلة: ${disconnectedPlatforms.join(', ')}. يرجى ربطها أولاً من صفحة المنصات.`, 'error');
      return;
    }

    if (!scheduledAt) {
      showMessage('يرجى تحديد تاريخ ووقت الجدولة', 'error');
      return;
    }

    try {
      // Create the content item first (only if not already created)
      let itemId = createdItemId;
      
      if (!itemId) {
        const itemRes = await createContentItem(token, selectedCategory.id, { 
          title: itemTitle, 
          body: itemBody, 
          attachments: itemAttachments,
          scheduledAt: localDateTimeToISO(scheduledAt)
        });
        itemId = itemRes.item.id;
        setCreatedItemId(itemId);
      }
      
      // Update the item with platforms and schedule info
      await updateContentItem(token, itemId, {
        title: itemTitle,
        body: itemBody,
        attachments: itemAttachments,
        platforms: selectedPlatforms,
        scheduledAt: localDateTimeToISO(scheduledAt)
      });

      // Schedule it
      await scheduleContentItem(token, itemId, {
        platforms: selectedPlatforms as string[],
        format: 'feed',
        scheduledAt: localDateTimeToISO(scheduledAt)
      });
      
      showMessage(`تم جدولة العنصر بنجاح على المنصات التالية: ${selectedPlatforms.join(', ')}. تحقق من صفحة الجدولة.`, 'success');
      router.push('/schedule');

      // Reset form
      setItemTitle("");
      setItemBody("");
      setItemAttachments([]);
      setSelectedPlatforms([]);
      setScheduledAt("");
      setCreatedItemId(null);
      setShowCreateItem(false);
      await loadItems(selectedCategory.id);
    } catch (error) {
      console.error('Error creating/scheduling item:', error);
      showMessage('حدث خطأ أثناء إنشاء/جدولة العنصر. تأكد من اتصال المنصات المحددة.', 'error');
      // Reset created item ID on error
      setCreatedItemId(null);
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
      showMessage('فشل في إنشاء المحتوى بالذكاء الاصطناعي', 'error');
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
        scheduledAt: scheduledAt ? localDateTimeToISO(scheduledAt) : null
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
      showMessage('حدث خطأ أثناء تحديث العنصر', 'error');
    }
  };

  const onScheduleEditedItem = async () => {
    if (!editingItem || !itemTitle.trim()) {
      showMessage('يرجى إدخال عنوان العنصر', 'error');
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      showMessage('يرجى اختيار منصة واحدة على الأقل للنشر', 'error');
      return;
    }
    
    // Check if platforms are connected
    const disconnectedPlatforms = selectedPlatforms.filter((p) => connections[p] !== true);
    if (disconnectedPlatforms.length > 0) {
      showMessage(`المنصات التالية غير متصلة: ${disconnectedPlatforms.join(', ')}. يرجى ربطها أولاً من صفحة المنصات.`, 'error');
      return;
    }

    if (!scheduledAt) {
      showMessage('يرجى تحديد تاريخ ووقت الجدولة', 'error');
      return;
    }

    try {
      // Update the content item first
      await updateContentItem(token, editingItem.id, {
        title: itemTitle,
        body: itemBody,
        attachments: itemAttachments,
        platforms: selectedPlatforms,
        scheduledAt: scheduledAt ? localDateTimeToISO(scheduledAt) : null
      });

      // Schedule it
      await scheduleContentItem(token, editingItem.id, {
        platforms: selectedPlatforms as string[],
        format: 'feed',
        scheduledAt: localDateTimeToISO(scheduledAt)
      });
      
      showMessage(`تم جدولة العنصر بنجاح على المنصات التالية: ${selectedPlatforms.join(', ')}. تحقق من صفحة الجدولة.`, 'success');
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
      showMessage('حدث خطأ أثناء تحديث/جدولة العنصر. تأكد من اتصال المنصات المحددة.', 'error');
    }
  };

  // Reminder functions
  const onSetReminder = async (item: ContentItem) => {
    setItemToRemind(item);
    
    // Try to get WhatsApp session phone number
    try {
      const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/whatsapp/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('[Reminder] WhatsApp status:', statusData);
        
        // Check if connected and has phone number
        if (statusData.success && (statusData.status === 'connected' || statusData.status === 'CONNECTED' || statusData.status === 'inChat')) {
          if (statusData.phoneNumber) {
            // Format phone number if needed
            let phoneNumber = statusData.phoneNumber;
            // Remove @s.whatsapp.net if present
            phoneNumber = phoneNumber.replace('@s.whatsapp.net', '').replace('@c.us', '');
            // Add + if not present
            if (!phoneNumber.startsWith('+')) {
              phoneNumber = '+' + phoneNumber;
            }
            setReminderWhatsApp(phoneNumber);
            setWhatsappSessionPhone(phoneNumber);
            console.log('[Reminder] Auto-filled WhatsApp number:', phoneNumber);
          }
        }
      }
    } catch (error) {
      console.error('[Reminder] Error fetching WhatsApp status:', error);
      // Don't block - continue with empty phone number
    }
    
    setShowReminderModal(true);
  };

  const onCreateReminder = async () => {
    if (!itemToRemind || !reminderWhatsApp.trim() || !reminderMessage.trim()) {
      showMessage('يرجى إدخال رقم الواتساب ورسالة التذكير', 'error');
      return;
    }

    if (!itemToRemind.scheduledAt) {
      showMessage('هذا العنصر غير مجدول', 'error');
      return;
    }

    // Check WhatsApp connection status (warning only, not blocking)
    try {
      const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/whatsapp/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const statusData = await statusResponse.json();
      console.log('[Reminder] WhatsApp status check:', statusData);
      
      if (!statusData.connected) {
        console.warn('[Reminder] WhatsApp not connected - reminder will be created but may not send');
        // Don't block - just log warning
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      // Don't block - continue with reminder creation
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemId: itemToRemind.id,
          whatsappNumber: reminderWhatsApp,
          message: reminderMessage,
          scheduledAt: itemToRemind.scheduledAt,
          timezoneOffset: new Date().getTimezoneOffset() // Send user's timezone offset
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Reminder] Creation response:', result);
        
        // Add to active reminders
        setActiveReminders(prev => new Set(prev).add(itemToRemind.id));
        closeReminderModal();
        
        // Show success toast with reminder times
        const description = result.reminder?.reminderTime1Display && result.reminder?.reminderTime2Display
          ? `⏰ سيتم التذكير في: ${result.reminder.reminderTime1Display} و ${result.reminder.reminderTime2Display}`
          : "سيتم إرسال رسالة قبل ساعتين وساعة واحدة من  الموعد المحدد.";
        
        toast.success("✅ تم إعداد التذكير بنجاح!", {
          description: description,
          duration: 6000
        });
      } else {
        const error = await response.json();
        showMessage(`خطأ في إعداد التذكير: ${error.message || 'حدث خطأ غير متوقع'}`, 'error');
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      showMessage('حدث خطأ أثناء إعداد التذكير', 'error');
    }
  };

  const closeReminderModal = () => {
    setShowReminderModal(false);
    setReminderWhatsApp("");
    setReminderMessage("");
    setItemToRemind(null);
    setWhatsappSessionPhone("");
  };

  const togglePlatform = (p: Platform) => {
    // Check if platform is connected before allowing selection
    if (connections[p] !== true) {
      showMessage(`المنصة ${p} غير متصلة. يرجى ربطها أولاً من صفحة المنصات.`, 'error');
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
    <div className="min-h-screen w-full">
      {/* {!hasActiveSubscription && (
        <NoActiveSubscription 
          heading="إدارة المحتوى"
          featureName="إدارة المحتوى"
          className="container mx-auto w-full mb-8 pt-6"
        />
      )} */}
      <div className={` w-full ${!hasActiveSubscription ? "opacity-50 pointer-events-none select-none grayscale-[0.5]" : ""}`}>
        {/* Header */}
        <div className="mb-2">
         <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">ادارة وجدولة المحتوى </h1>
          {/* <p className="text-gray-300 text-lg">إدارة المحتوى الاحترافية للمنصات الاجتماعية</p> */}

          <AnimatedTutorialButton onClick={handleShowTutorial} text1="شرح الميزة" text2="شاهد" />
          </div>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <Card className="gradient-border border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                 <div className="flex items-center gap-2">
                 <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                    <p className="text-gray-200 text-lg font-bold">التصنيفات</p>
                 </div>
                 <p className="text-4xl font-bold text-white">{categories.length}</p>
                 
                </div>
              </CardContent>
            </Card>

      <Card className="gradient-border border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                 <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                    <p className="text-gray-200 text-lg font-bold">العناصر</p>
                 </div>
                 <p className="text-4xl font-bold text-white">{items.length}</p>
                </div>
        </CardContent>
      </Card>

            <Card className="gradient-border border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                 <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                    <p className="text-gray-200 text-lg font-bold">العناصر</p>
                 </div>
                 <p className="text-4xl font-bold text-white">{items.length}</p>
                </div>
               
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Categories Tabs */}
        <Card className="gradient-border border-none mb-2">
          <CardHeader className="border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">التصنيفات</h2>
              <Button 
                onClick={() => setShowCreateCategory(true)}
                className="primary-button  text-white font-bold text-lg"
              >
              
                إضافة تصنيف
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
        {loading ? (
              <div className="p-2 text-center text-gray-400">جاري التحميل...</div>
        ) : categories.length === 0 ? (
              <div className="p-2 text-center text-yellow-500">لا توجد تصنيفات بعد</div>
            ) : (
              <div className="flex flex-wrap gap-2 p-0">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                      selectedCategory?.id === category.id
                        ? 'bg-blue-900  text-white shadow-lg'
                        : 'bg-secondry  text-gray-300'
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Area */}
        
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <Card className="gradient-border border-none">
                <CardHeader className="border-b border-gray-700">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {monthNames[currentMonth - 1]} {currentYear}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      <Button 
                        onClick={() => navigateMonth('prev')}
                        className="bg-black  text-white"
                      >
                        ← السابق
                      </Button>
                      <Button 
                        onClick={() => navigateMonth('next')}
                        className="bg-black  text-white"
                      >
                        التالي →
                      </Button>
                      <Button 
                        onClick={() => setShowCreateItem(true)}
                        className="primary-button text-white"
                      >
                       <div className="flex items-center gap-2">
                         <Plus className="w-4 h-4 mr-2" />
                        إضافة عنصر
                       </div>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {itemsLoading ? (
                    <div className="text-center py-8 text-gray-400">جاري تحميل العناصر...</div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <div className="grid min-w-[700px] grid-cols-7 gap-2">
                      {/* Day headers */}
                      {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                        <div key={day} className="p-3 text-center font-semibold text-green-400 bg-secondry rounded-lg">
                          {day}
                        </div>
                      ))}
                      
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: firstDay }).map((_, index) => (
                        <div key={`empty-${index}`} className="p-3 h-20 bg-fixed-40 rounded-lg"></div>
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
                                ? 'gradient-border-green text-white shadow-lg' 
                                : isPast
                                ? 'gradient-border-red text-white border border-red-200'
                                : isFuture
                                ? 'gradient-border-yellow text-white border border-yellow-200 hover:bg-yellow-200'
                                : 'bg-fixed-40 text-white  text-gray-300'
                            }`}
                          >
                            <div className="text-sm font-semibold mb-1 flex items-center justify-between">
                              <span>{day}</span>
                              {dayItems.length > 0 && (
                                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                  {dayItems.length}
                                </span>
                              )}
                            </div>
                            <div className={`space-y-1 ${dayItems.length > 2 ? 'max-h-12 overflow-y-auto scrollbar-hide' : ''}`}>
                              {dayItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 flex items-center justify-between ${
                                    isPast ? 'bg-red-500 text-white' : 'bg-green-500 text-white hover:bg-green-600'
                                  }`}
                                  title={item.title}
                                >
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditItem(item);
                                    }}
                                    className="flex-1"
                                  >
                                    {item.title}
                                  </span>
                                  {isPast && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteItem(item.id);
                                      }}
                                      className="ml-1 text-red-200 hover:text-white"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Items List */}
            <div className="lg:col-span-1">
              <Card className="gradient-border border-none">
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
                    <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3  rounded-lg bg-fixed-40 transition-colors cursor-pointer content-card"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-medium text-sm mb-1">{item.title}</h4>
                              <p className="text-gray-400 text-xs mb-2 line-clamp-2">{item.body}</p>
                              <div className="flex items-center gap-2">
                                {item.attachments.map((att, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    {att.type === 'image' && att.url ? (
                                      <img 
                                        src={att.url} 
                                        alt="مرفق" 
                                        className="w-8 h-8 object-cover rounded border"
                                      />
                                    ) : (
                                      <div className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                        {att.type === 'image' ? <Image className="w-3 h-3 inline mr-1" /> : 
                                         att.type === 'video' ? <Video className="w-3 h-3 inline mr-1" /> : 
                                         <FileText className="w-3 h-3 inline mr-1" />}
                                        {att.type}
                                      </div>
                                    )}
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
                              {item.scheduledAt && (
                                <button 
                                  onClick={() => onSetReminder(item)}
                                  className={`${activeReminders.has(item.id) ? 'text-green-400' : 'text-blue-400'} hover:text-blue-300`}
                                  title={activeReminders.has(item.id) ? "التذكير مفعل" : "ذكرني"}
                                >
                                  {activeReminders.has(item.id) ? (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span className="text-xs">✓</span>
                                    </div>
                                  ) : (
                                    <Clock className="w-4 h-4" />
                                  )}
                                </button>
                              )}
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
       

        {/* Create Category Modal */}
        {showCreateCategory && (
          <div className="fixed inset-0 bg-black/70  backdrop-blur-lg  flex items-center justify-center z-50">
            <div className=" gradient-border rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">إضافة تصنيف جديد</h3>
              <div className="space-y-4">
                <Input 
                  placeholder="اسم التصنيف" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#011910] border-gray-300 text-white"
                />
                <Textarea 
                  placeholder="وصف التصنيف (اختياري)" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-[#011910] border-gray-300 text-white"
                />
                <div className="flex gap-2">
                  <Button onClick={onCreateCategory} className="primary-button text-white font-bold text-lg flex-1">
                    إنشاء
                  </Button>
                  <Button 
                    onClick={() => setShowCreateCategory(false)}
                    variant="secondary"
                    className="primary-button after:bg-red-600  text-white font-bold text-lg flex-1"
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-start justify-center overflow-y-auto scrollbar-hide z-50">
            <div className="gradient-border rounded-lg p-6 max-w-2xl w-full mx-4 my-8 max-h-full overflow-y-auto scrollbar-hide">
              <h3 className="text-lg font-semibold text-white mb-4">إضافة عنصر جديد</h3>
              <div className="space-y-4">
                <Input 
                  placeholder="عنوان العنصر" 
                  value={itemTitle} 
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="bg-[#011910] border-gray-700 text-white"
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
                    className="bg-[#011910] border-gray-700 text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm">المرفقات</label>
                  <label htmlFor="contentAttachments" className="container cursor-pointer block">
                    <div className="header"> 
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                        <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> 
                        <p className="text-white text-sm font-medium">اختر مرفقات</p>
                      </div> 
                      <div className="footer"> 
                        <svg fill="#ffffff" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z" fill="white"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z" fill="white"></path></g></svg> 
                        <p className="text-white text-sm font-medium">
                          {itemAttachments.length ? `${itemAttachments.length} ملف/ملفات مرفوعة` : "لا يوجد ملفات محددة"}
                        </p> 
                        {itemAttachments.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setItemAttachments([]);
                              const fileInput = document.getElementById('contentAttachments') as HTMLInputElement;
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
                        id="contentAttachments"
                        type="file" 
                        multiple 
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      />
                  </label>
                  
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
                    {(['facebook','instagram','linkedin','youtube','twitter'] as Platform[]).map((p) => {
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
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full bg-fixed-40 border-primary rounded p-2 text-white cursor-pointer"
                  />
                </div>

                {/* Reminder Button - Only show if scheduled */}
                {scheduledAt && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-white text-sm">التذكير</label>
                      <Button
                        onClick={async () => {
                          // Create the item first if not already created
                          try {
                            let itemId = createdItemId;
                            
                            if (!itemId) {
                              const itemRes = await createContentItem(token, selectedCategory?.id || 0, { 
                                title: itemTitle, 
                                body: itemBody, 
                                attachments: itemAttachments,
                                scheduledAt: scheduledAt ? localDateTimeToISO(scheduledAt) : null
                              });
                              itemId = itemRes.item.id;
                              setCreatedItemId(itemId);
                              
                              // Now set reminder with real item
                              onSetReminder(itemRes.item);
                            } else {
                              // Use existing item
                              const tempItem = {
                                id: itemId,
                                title: itemTitle,
                                scheduledAt: scheduledAt,
                                categoryId: selectedCategory?.id || 0,
                                attachments: itemAttachments,
                                status: 'draft',
                                platforms: selectedPlatforms,
                                body: itemBody
                              } as ContentItem;
                              onSetReminder(tempItem);
                            }
                          } catch (error) {
                            console.error('Error creating item for reminder:', error);
                            showMessage('حدث خطأ أثناء إنشاء العنصر للتذكير', 'error');
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-sm"
                        disabled={!itemTitle.trim() || !scheduledAt}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        ذكرني
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      سيتم إرسال رسالة تذكير قبل ساعتين وساعة واحدة من الموعد المحدد 
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={onCreateItem} className="primary-button  text-white font-bold text-lg flex-1">
                    
                    حفظ
                  </Button>
                  <Button 
                    onClick={onScheduleItem}
                    disabled={selectedPlatforms.length === 0 || selectedPlatforms.some(p => connections[p] !== true) || !scheduledAt}
                    className="primary-button after:bg-yellow-600  text-white font-bold text-lg flex-1"
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
                  
                    جدولة
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowCreateItem(false);
                      setCreatedItemId(null);
                    }}
                    variant="secondary"
                    className="primary-button after:bg-red-600  text-white font-bold text-lg flex-1"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-start justify-center overflow-y-auto scrollbar-hide z-50">
            <div className="gradient-border rounded-lg p-6 max-w-2xl w-full mx-4 my-8 max-h-full overflow-y-auto scrollbar-hide">
              <h3 className="text-lg font-semibold text-white mb-4">تحرير العنصر</h3>
              <div className="space-y-4">
                <Input 
                  placeholder="عنوان العنصر" 
                  value={itemTitle} 
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="bg-[#011910] border-gray-300 text-white"
                />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm">المحتوى</label>
                    <Button
                      onClick={() => setShowAIModal(true)}
                      className="primary-button after:bg-purple-600  text-white font-bold text-lg"
                    >
                      
                      إنشاء بالذكاء الاصطناعي
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="اكتب المحتوى..." 
                    value={itemBody} 
                    onChange={(e) => setItemBody(e.target.value)}
                    className="bg-[#011910] border-gray-300 text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm">المرفقات</label>
                  <label htmlFor="contentAttachmentsSecondary" className="container cursor-pointer block">
                    <div className="header"> 
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                        <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> 
                        <p className="text-white text-sm font-medium">اختر مرفقات</p>
                      </div> 
                      <div className="footer"> 
                        <svg fill="#ffffff" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z" fill="white"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z" fill="white"></path></g></svg> 
                        <p className="text-white text-sm font-medium">
                          {itemAttachments.length ? `${itemAttachments.length} ملف/ملفات مرفوعة` : "لا يوجد ملفات محددة"}
                        </p> 
                        {itemAttachments.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setItemAttachments([]);
                              const fileInput = document.getElementById('contentAttachmentsSecondary') as HTMLInputElement;
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
                        id="contentAttachmentsSecondary"
                        type="file" 
                        multiple 
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      />
                  </label>
                  
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
                    {(['facebook','instagram','linkedin','youtube','twitter'] as Platform[]).map((p) => {
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
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full bg-fixed-40 border-primary rounded p-2 text-white cursor-pointer"
                  />
                </div>

                {/* Reminder Button - Only show if scheduled */}
                {scheduledAt && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-white text-sm">التذكير</label>
                      <Button
                        onClick={() => {
                          // Create a temporary item for reminder
                          const tempItem = {
                            id: editingItem?.id || Date.now(),
                            title: itemTitle,
                            scheduledAt: scheduledAt,
                            categoryId: selectedCategory?.id || 0,
                            attachments: itemAttachments,
                            status: 'draft',
                            platforms: selectedPlatforms,
                            body: itemBody
                          } as ContentItem;
                          onSetReminder(tempItem);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-sm"
                        disabled={!itemTitle.trim() || !scheduledAt}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        ذكرني
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                       سيتم إرسال رسالة تذكير قبل ساعتين وساعة واحدة من الموعد المحدد
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={onUpdateItem} className="primary-button a text-white font-bold text-lg flex-1">
                    
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
                  className="primary-button after:bg-red-600  text-white font-bold text-lg flex-1"
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
          <div className="fixed inset-0 bg-black/50  backdrop-blur-lg  flex items-center justify-center z-50">
            <div className=" gradient-border rounded-lg p-6 max-w-lg w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">إنشاء المحتوى بالذكاء الاصطناعي</h3>
              <div className="space-y-4">
                <Textarea 
                  placeholder="اكتب البروميت الخاص بك..." 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="bg-[#011910] border-gray-300 text-white min-h-[100px]"
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
                    className="primary-button   text-white font-bold text-lg flex-1"
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
                  className="primary-button after:bg-red-600  text-white font-bold text-lg flex-1"
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
          <div className="fixed inset-0 bg-black/70  backdrop-blur-lg  flex items-center justify-center z-999">
            <div className=" gradient-border rounded-lg p-6 max-w-md w-full mx-4">
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

        {/* Reminder Modal */}
        {showReminderModal && itemToRemind && (
          <div className="fixed inset-0 bg-black/70  backdrop-blur-lg  flex items-center justify-center z-999">
            <div className=" gradient-border rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">إعداد تذكير</h3>
              <div className="space-y-2">
                
                  <div className="flex">
                    <p className="text-gray-300 mb-2">العنصر:</p>
                  <p className="text-white font-medium">{itemToRemind.title}</p>
                  </div>
                  <p className="text-gray-400 text-sm">
                    مجدول في: {itemToRemind.scheduledAt ? new Date(itemToRemind.scheduledAt).toLocaleString('en-US') : 'غير محدد'}
                  </p>
                

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm">رقم الواتساب</label>
                    {whatsappSessionPhone && reminderWhatsApp === whatsappSessionPhone && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <span>✓</span>
                        <span>تم الملء تلقائياً من الجلسة</span>
                      </span>
                    )}
                  </div>
                  <Input 
                    placeholder="مثال: +966501234567" 
                    value={reminderWhatsApp} 
                    onChange={(e) => setReminderWhatsApp(e.target.value)}
                    className="bg-[#011910] border-gray-300 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm">رسالة التذكير</label>
                  <Textarea 
                    placeholder="اكتب رسالة التذكير..." 
                    value={reminderMessage} 
                    onChange={(e) => setReminderMessage(e.target.value)}
                    className="bg-[#011910] border-gray-300 text-white min-h-[80px]"
                  />
                  <p className="text-gray-300 text-xs">
                    سيتم إرسال هذه الرسالة قبل ساعتين وساعة واحدة من الموعد المحدد
                  </p>
                </div>

                {/* WhatsApp Connection Warning */}
                <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="text-yellow-400 mt-0.5">⚡</div>
                    <div className="flex-1">
                      <p className="text-yellow-200 text-sm font-medium mb-1">تلميح</p>
                      <p className="text-yellow-300 text-xs">
                        للحصول على التذكيرات، تأكد من أن جلسة الواتساب الخاصة بك نشطة عند موعد إرسال التذكير.
                        سيتم إرسال التذكيرات تلقائياً إذا كانت الجلسة متصلة.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={onCreateReminder}
                    disabled={!reminderWhatsApp.trim() || !reminderMessage.trim()}
                    className="primary-button text-white font-bold text-lg flex-1"
                  >
                  
                    إعداد التذكير
                  </Button>
                  <Button 
                    onClick={closeReminderModal}
                    variant="secondary"
                    className="primary-button after:bg-red-600  text-white font-bold text-lg flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50">
            <div className="gradient-border rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                {messageType === 'success' && (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">✓</span>
                  </div>
                )}
                {messageType === 'error' && (
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-lg">✗</span>
                  </div>
                )}
                {messageType === 'info' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">ℹ</span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">
                  {messageType === 'success' ? 'نجح' : messageType === 'error' ? 'خطأ' : 'معلومة'}
                </h3>
              </div>
              <p className="text-gray-300 mb-6">{messageText}</p>
              <Button 
                onClick={() => setShowMessageModal(false)}
                className="w-full primary-button text-white"
              >
                موافق
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Tutorial Video Modal */}
      <TutorialVideoModal
        tutorial={selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
        onViewIncrement={incrementViews}
      />
    </div>
  );
}


