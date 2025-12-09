"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTutorials } from "@/hooks/useTutorials";
import { TutorialVideoModal } from "@/components/TutorialVideoModal";
import { Tutorial } from "@/types/tutorial";
import { BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Search,
  Filter,
  Send,
  User,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
  CheckCheck,
  Code,
  Settings,
  Upload,
  FileSpreadsheet,
  Trash2,
  Power,
  PowerOff,
  Eye,
  Database,
  Image,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import Loader from "@/components/Loader";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import NoActiveSubscription from "@/components/NoActiveSubscription";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { io, Socket } from "socket.io-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Ticket {
  id: number;
  storeId: string;
  visitorId?: string;
  visitorName?: string;
  visitorEmail?: string;
  status: "open" | "pending" | "closed";
  assignedTo?: number;
  ticketNumber?: string;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  assignedAgent?: {
    id: number;
    name: string;
    email: string;
  };
}

interface TicketMessage {
  id: number;
  ticketId: number;
  senderType: "visitor" | "bot" | "agent";
  senderId?: number;
  content: string;
  attachments?: string[];
  createdAt: string;
  senderAgent?: {
    id: number;
    name: string;
    email: string;
  };
  metadata?: {
    senderName?: string;
    [key: string]: any;
  };
}

interface TicketStats {
  total: number;
  open: number;
  pending: number;
  closed: number;
}

interface KnowledgeBase {
  id: number;
  storeId: string;
  fileName: string;
  rowCount: number;
  columns: string[];
  data?: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TicketsPage() {
  const [token, setToken] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showWidgetCode, setShowWidgetCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("tickets");
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingKB, setViewingKB] = useState<KnowledgeBase | null>(null);
  const [deletingKB, setDeletingKB] = useState<KnowledgeBase | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);
  const [widgetSettings, setWidgetSettings] = useState({
    facebookUrl: "",
    whatsappUrl: "",
    telegramUrl: "",
    snapchatUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    widgetIconUrl: "",
  });
  const [widgetIconPreview, setWidgetIconPreview] = useState<string>("");
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [liveChatUsage, setLiveChatUsage] = useState<{
    total: number | null;
    used: number;
    remaining: number | null;
    isUnlimited: boolean;
    resetAt?: string;
  } | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [refreshUsageTrigger, setRefreshUsageTrigger] = useState(0);
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const { canUseLiveChat, hasActiveSubscription, loading: permissionsLoading, permissions } = usePermissions();
  const socketRef = useRef<Socket | null>(null);
  const selectedTicketRef = useRef<Ticket | null>(null);
  const messagesByTicketRef = useRef<Record<number, TicketMessage[]>>({});
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const { tutorials, getTutorialByCategory, incrementViews } = useTutorials();

  const handleShowTutorial = () => {
    // البحث عن شرح الواتساب - يمكن البحث بالتصنيف "whatsapp" أو "واتساب" أو "WhatsApp"
    const liveChatTicketsTutorial = 
      getTutorialByCategory('Live Chat and Tickets') || 
      getTutorialByCategory('لايف شات') || 
      getTutorialByCategory('لايف شات والتذاكر') ||
      tutorials.find(t => 
        t.title.toLowerCase().includes('لايف شات') || 
        t.title.toLowerCase().includes('لايف شات والتذاكر') ||
        t.category.toLowerCase().includes('لايف شات') ||
        t.category.toLowerCase().includes('لايف شات والتذاكر')
      ) || null;
    
    if (liveChatTicketsTutorial) {
      setSelectedTutorial(liveChatTicketsTutorial);
      incrementViews(liveChatTicketsTutorial.id);
    } else {
      showError("لم يتم العثور على شرح خاص بلايف شات والتذاكر");
    }
  };

  useEffect(() => {
    if (!permissionsLoading && !hasActiveSubscription) {
      showError("لا يوجد اشتراك نشط");
    }
  }, [hasActiveSubscription, permissionsLoading]);

  const addMessageToThread = useCallback((newMessage: TicketMessage | null) => {
    if (!newMessage) return;

    setTickets((prev) => {
      const updated = prev.map((ticket) =>
        ticket.id === newMessage.ticketId
          ? { ...ticket, updatedAt: newMessage.createdAt }
          : ticket
      );
      return [...updated].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });

    setSelectedTicket((prev) =>
      prev && prev.id === newMessage.ticketId
        ? { ...prev, updatedAt: newMessage.createdAt }
        : prev
    );

    setMessages((prev) => {
      const currentMessages =
        messagesByTicketRef.current[newMessage.ticketId] ??
        (selectedTicketRef.current?.id === newMessage.ticketId ? prev : []);

      if (currentMessages.some((msg) => msg.id === newMessage.id)) {
        return currentMessages;
      }

      const updatedMessages = [...currentMessages, newMessage].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      messagesByTicketRef.current = {
        ...messagesByTicketRef.current,
        [newMessage.ticketId]: updatedMessages,
      };

      if (selectedTicketRef.current?.id !== newMessage.ticketId) {
        return selectedTicketRef.current ? prev : updatedMessages;
      }

      return updatedMessages;
    });
  }, []);
  
  // Generate storeId from userId
  const storeId = user ? (user.storeId || `store_${user.id}`) : '';
  const widgetCode = `<script>
  window.WIDGET_API_URL = '${API_BASE_URL}';
  window.WIDGET_SOCKET_URL = '${API_BASE_URL}';
</script>
<script src="${API_BASE_URL}/widget.js" data-store-id="${storeId}"></script>`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "tickets") {
      loadTickets();
      loadStats();
      loadWidgetSettings();
      loadLiveChatUsage();
    } else if (activeTab === "knowledge") {
      loadKnowledgeBases();
    }
  }, [token, statusFilter, activeTab, permissions]);

  useEffect(() => {
    if (!token || activeTab !== "tickets") return;
    if (selectedTicket?.storeId) {
      loadLiveChatUsage(selectedTicket.storeId);
    }
  }, [selectedTicket?.storeId, activeTab, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(`${API_BASE_URL}/tickets/agent`, {
      transports: ["websocket"],
      auth: { token }
    });

    socketRef.current = socket;

    const handleNewMessage = (payload: { message: TicketMessage }) => {
      if (payload?.message) {
        addMessageToThread(payload.message);
        if (payload.message.senderType.toLowerCase() === 'bot') {
          setRefreshUsageTrigger(prev => prev + 1);
        }
      }
    };

    socket.on("new-message", handleNewMessage);

    socket.on("connect_error", (error) => {
      console.error("Ticket socket error:", error);
    });

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, addMessageToThread]);

  useEffect(() => {
    if (!socketRef.current || !selectedTicket) return;
    selectedTicketRef.current = selectedTicket;
    const cachedMessages =
      messagesByTicketRef.current[selectedTicket.id] ?? selectedTicket.messages ?? [];
    setMessages(
      [...cachedMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    );
    socketRef.current.emit("join-ticket", { ticketId: selectedTicket.id });
  }, [selectedTicket]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }
    });
  }, [messages, selectedTicket?.id]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/tickets?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب التذاكر");
      }

      const data = await response.json();
      const fetchedTickets: Ticket[] = data.tickets || [];
      setTickets(fetchedTickets);

      if (fetchedTickets.length > 0) {
        const selectedStillExists = selectedTicketRef.current
          ? fetchedTickets.some((ticket) => ticket.id === selectedTicketRef.current?.id)
          : false;

        if (!selectedTicketRef.current || !selectedStillExists) {
          loadTicket(fetchedTickets[0].id);
        }

        loadLiveChatUsage(fetchedTickets[0].storeId);
      } else {
        setSelectedTicket(null);
        setMessages([]);
        selectedTicketRef.current = null;
      }
    } catch (error: any) {
      showError("خطأ", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/tickets/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب الإحصائيات");
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadTicket = async (ticketId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/tickets/${ticketId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب التذكرة");
      }

      const data = await response.json();
      const sortedMessages = [...(data.ticket.messages || [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      messagesByTicketRef.current = {
        ...messagesByTicketRef.current,
        [data.ticket.id]: sortedMessages,
      };
      selectedTicketRef.current = data.ticket;
      setSelectedTicket(data.ticket);
      setMessages(sortedMessages);
      if (data.ticket.storeId) {
        loadLiveChatUsage(data.ticket.storeId);
      }
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/tickets/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("فشل في رفع الصورة");
      }

      const data = await response.json();
      if (data.success && data.url) {
        return data.url;
      }
      return null;
    } catch (error: any) {
      showError("خطأ", error.message || "فشل في رفع الصورة");
      return null;
    }
  };

  const sendMessage = async (attachments: string[] = []) => {
    const content = inputMessage.trim();
    if ((!content && !selectedImage && attachments.length === 0) || !selectedTicket || sending) return;

    // If there is a selected image, upload it first
    let uploadedImageUrl: string | null = null;
    if (selectedImage) {
      setUploadingImage(true);
      try {
        uploadedImageUrl = await uploadImage(selectedImage);
      } catch (error) {
        console.error('Failed to upload image:', error);
        setUploadingImage(false);
        return; // Stop sending if upload fails
      }
      setUploadingImage(false);
    }

    const finalAttachments = [...attachments];
    if (uploadedImageUrl) {
      finalAttachments.push(uploadedImageUrl);
    }

    setInputMessage("");
    setSelectedImage(null);
    setPreviewUrl(null);
    setSending(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
            senderType: "agent",
            attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("فشل في إرسال الرسالة");
      }

      const data = await response.json();
      if (data.message) {
        addMessageToThread(data.message);
      }
      showSuccess("تم إرسال الرسالة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message);
      setInputMessage(content); // Restore message on error
      // Note: We don't restore the image here as it might be complicated, but we could if needed.
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError("خطأ", "يرجى اختيار صورة فقط");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError("خطأ", "حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/tickets/${ticketId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("فشل في تحديث حالة التذكرة");
      }

      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        await loadTicket(ticketId);
      }
      showSuccess("تم تحديث حالة التذكرة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const copyWidgetCode = async () => {
    try {
      await navigator.clipboard.writeText(widgetCode);
      setCopied(true);
      showSuccess("تم نسخ كود التضمين!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showError("خطأ", "فشل نسخ الكود");
    }
  };

  const uploadWidgetIcon = async (file: File) => {
    const formData = new FormData();
    formData.append("icon", file);
    const res = await fetch(`${API_BASE_URL}/api/dashboard/tickets/widget-icon`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`فشل رفع الأيقونة: ${res.status} ${errText}`);
    }
    const data = await res.json();
    return data.url as string;
  };

  const loadWidgetSettings = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/tickets/widget-settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب إعدادات الويدجت");
      }

      const data = await response.json();
      if (data.success && data.settings) {
        setWidgetSettings({
          facebookUrl: data.settings.facebookUrl || "",
          whatsappUrl: data.settings.whatsappUrl || "",
          telegramUrl: data.settings.telegramUrl || "",
          snapchatUrl: data.settings.snapchatUrl || "",
          tiktokUrl: data.settings.tiktokUrl || "",
          youtubeUrl: data.settings.youtubeUrl || "",
          instagramUrl: data.settings.instagramUrl || "",
          twitterUrl: data.settings.twitterUrl || "",
          widgetIconUrl: data.settings.widgetIconUrl || "",
        });
        setWidgetIconPreview(data.settings.widgetIconUrl || "");
      }
    } catch (error: any) {
      console.error("Failed to load widget settings:", error);
    }
  };

  const saveWidgetSettings = async (override?: typeof widgetSettings) => {
    setSavingSettings(true);
    try {
      const payload = override ?? widgetSettings;
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/tickets/widget-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("فشل في حفظ إعدادات الويدجت");
      }

      if (override) {
        setWidgetSettings(override);
      }

      showSuccess("تم حفظ إعدادات الويدجت بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleWidgetIconSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingIcon(true);
      const url = await uploadWidgetIcon(file);
      const nextSettings = { ...widgetSettings, widgetIconUrl: url };
      setWidgetSettings(nextSettings);
      setWidgetIconPreview(url);
      // حفظ تلقائي بعد رفع الأيقونة لضمان تسجيل الرابط في قاعدة البيانات
      await saveWidgetSettings(nextSettings);
      showSuccess("تم رفع الأيقونة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "فشل رفع الأيقونة");
    } finally {
      setUploadingIcon(false);
      e.target.value = "";
    }
  };

  const resolveActiveStoreId = (overrideStoreId?: string) => {
    if (overrideStoreId) return overrideStoreId;
    if (selectedTicketRef.current?.storeId) return selectedTicketRef.current.storeId;
    if (selectedTicket?.storeId) return selectedTicket.storeId;
    if (tickets.length > 0) return tickets[0].storeId;
    return storeId;
  };

  const loadLiveChatUsage = async (storeOverride?: string) => {
    if (!token) return;
    setUsageLoading(true);
    setUsageError(null);
    try {
      const activeStoreId = resolveActiveStoreId(storeOverride);
      const response = await fetch(
        activeStoreId
          ? `${API_BASE_URL}/api/dashboard/tickets/live-chat-usage?storeId=${encodeURIComponent(
              activeStoreId
            )}`
          : `${API_BASE_URL}/api/dashboard/tickets/live-chat-usage`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          if (permissions?.liveChatAiResponses) {
            setLiveChatUsage({
              total: permissions.liveChatAiResponses,
              used: 0,
              remaining: permissions.liveChatAiResponses,
              isUnlimited: false,
            });
            setUsageError(null);
          } else {
            setLiveChatUsage(null);
            setUsageError(null);
          }
          return;
        }
        throw new Error("فشل في جلب رصيد الردود التلقائية");
      }

      const data = await response.json();
      if (data.success && data.usage) {
        const usagePayload = {
          total:
            typeof data.usage.total === "number"
              ? data.usage.total
              : data.usage.total !== null && data.usage.total !== undefined
              ? Number(data.usage.total)
              : null,
          used:
            typeof data.usage.used === "number"
              ? data.usage.used
              : Number(data.usage.used) || 0,
          remaining:
            data.usage.remaining === null || data.usage.remaining === undefined
              ? null
              : typeof data.usage.remaining === "number"
              ? data.usage.remaining
              : Number(data.usage.remaining),
          isUnlimited: Boolean(data.usage.isUnlimited),
          resetAt: data.usage.resetAt,
        };
        setLiveChatUsage(usagePayload);
        setUsageError(null);
      } else {
        setLiveChatUsage(null);
        setUsageError("تعذر تحديد رصيد الردود التلقائية.");
      }
    } catch (error: any) {
      console.error("Failed to load live chat usage:", error);
      setLiveChatUsage(null);
      setUsageError(error.message || "تعذر جلب بيانات الرصيد.");
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    if (refreshUsageTrigger > 0) {
      loadLiveChatUsage();
    }
  }, [refreshUsageTrigger]);

  const loadKnowledgeBases = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/knowledge-bases?storeId=${storeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب قواعد المعرفة");
      }

      const data = await response.json();
      setKnowledgeBases(data.knowledgeBases || []);
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        showError("خطأ", "الملف يجب أن يكون Excel (.xlsx, .xls) أو CSV");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showError("خطأ", "حجم الملف يجب أن يكون أقل من 10 ميجابايت");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) {
      showError("خطأ", "يرجى اختيار ملف أولاً");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('storeId', storeId);

      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/knowledge-bases/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في رفع الملف");
      }

      const data = await response.json();
      showSuccess("نجح", data.message || "تم رفع قاعدة البيانات بنجاح!");
      setSelectedFile(null);
      await loadKnowledgeBases();
    } catch (error: any) {
      showError("خطأ", error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteKB = async (kbId: number) => {
    const kb = knowledgeBases.find(k => k.id === kbId);
    if (kb) {
      setDeletingKB(kb);
    }
  };

  const confirmDeleteKB = async () => {
    if (!deletingKB) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/knowledge-bases/${deletingKB.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في حذف قاعدة البيانات");
      }

      showSuccess("نجح", "تم حذف قاعدة البيانات بنجاح!");
      setDeletingKB(null);
      await loadKnowledgeBases();
    } catch (error: any) {
      showError("خطأ", error.message);
      setDeletingKB(null);
    }
  };

  const handleToggleKB = async (kbId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/knowledge-bases/${kbId}/toggle`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في تحديث حالة قاعدة البيانات");
      }

      const data = await response.json();
      showSuccess("نجح", data.message);
      await loadKnowledgeBases();
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleViewKB = async (kbId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/knowledge-bases/${kbId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب قاعدة البيانات");
      }

      const data = await response.json();
      setViewingKB(data.knowledgeBase);
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleDeleteTicket = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setDeletingTicket(ticket);
    }
  };

  const confirmDeleteTicket = async () => {
    if (!deletingTicket) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/tickets/${deletingTicket.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في حذف التذكرة");
      }

      showSuccess("تم حذف التذكرة بنجاح");
      
      // Update state
      const updatedTickets = tickets.filter(t => t.id !== deletingTicket.id);
      setTickets(updatedTickets);
      
      if (selectedTicket?.id === deletingTicket.id) {
        setSelectedTicket(updatedTickets.length > 0 ? updatedTickets[0] : null);
        if (updatedTickets.length === 0) {
          setMessages([]);
        }
      }
      
      setDeletingTicket(null);
      loadStats(); // Refresh stats
    } catch (error: any) {
      showError("خطأ", error.message);
      setDeletingTicket(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "مفتوحة";
      case "pending":
        return "قيد الانتظار";
      case "closed":
        return "مغلقة";
      default:
        return status;
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Filter by status first
    if (statusFilter !== "all" && ticket.status !== statusFilter) {
      return false;
    }
    
    // Then filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.visitorName?.toLowerCase().includes(query) ||
        ticket.visitorEmail?.toLowerCase().includes(query) ||
        ticket.storeId.toLowerCase().includes(query) ||
        ticket.id.toString().includes(query) ||
        ticket.ticketNumber?.toLowerCase().includes(query) ||
        ticket.ticketNumber?.includes(query)
      );
    }
    return true;
  });

  if (permissionsLoading || (loading && tickets.length === 0)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader text="جاري التحقق من الصلاحيات..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }

  if (hasActiveSubscription && !canUseLiveChat()) {
    return (
      <NoActiveSubscription
        heading="ميزة Live Chat والتذاكر"
        featureName="ميزة Live Chat والتذاكر"
        description="هذه الميزة غير متوفرة في باقتك الحالية."
        className="h-screen flex items-center justify-center"
      />
    );
  }

  return (
    <div  className=" w-full space-y-3">
      {/* {!hasActiveSubscription && (
        <NoActiveSubscription 
          heading="نظام التذاكر والدردشة المباشرة"
          featureName="نظام التذاكر والدردشة المباشرة"
          className="mb-8"
        />
      )} */}
      <div className={!hasActiveSubscription ? "opacity-50 pointer-events-none select-none grayscale-[0.5] space-y-6" : "space-y-6"}>
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div>
          <h1 className="lg:text-3xl text-2xl font-bold text-white">نظام التذاكر والدردشة المباشرة</h1>
        </div>
        {activeTab === "tickets" && (<>
        <div className="flex items-center gap-2">
        <Button
            onClick={() => setShowWidgetCode(!showWidgetCode)}
            className="primary-button flex"
          >
           <div className="flex items-center gap-2">
           <Code className="h-4 w-4 mr-2" />
           <span className="text-sm">{showWidgetCode ? "إخفاء" : "عرض"} كود التضمين</span>
           </div>
          </Button>
           <Button 
             
           onClick={handleShowTutorial} 
           variant="secondary"
           className="flex items-center gap-2 primary-button">
          <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <p> شرح الميزة</p>
          </div>
         </Button>
        </div>
         </>  )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-0">
        <TabsList className="grid w-full grid-cols-2 gradient-border">
          <TabsTrigger 
            value="tickets" 
            className="data-[state=active]:bg-[#03132c] data-[state=active]:text-white text-white"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            التذاكر
          </TabsTrigger>
          <TabsTrigger 
            value="knowledge" 
            className="data-[state=active]:bg-[#03132c] data-[state=active]:text-white text-white"
          >
            <Database className="h-4 w-4 mr-2" />
            قاعدة البيانات
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-3 mt-2">

      {/* Widget Code Section */}
      {showWidgetCode && (
        <Card  className="bg-fixed-40 border-none">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              كود التضمين 
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">
                انسخ هذا الكود وضعّه في موقعك أو متجرك لعرض  الدردشة المباشرة:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <code className="text-sm text-green-400 whitespace-pre-wrap block pl-10 font-mono leading-relaxed">{widgetCode}</code>
                <button
                  onClick={copyWidgetCode}
                  className="absolute top-2 left-2 p-2 hover:bg-gray-800 rounded transition-colors"
                  title="نسخ الكود"
                >
                  {copied ? (
                    <CheckCheck className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong> نصيحة:</strong> ضع هذا الكود قبل إغلاق tag <code className="bg-gray-800 px-1 rounded">&lt;/body&gt;</code> في صفحة HTML الخاصة بك
              </p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-300">
                <strong>⚠️ مهم:</strong> Store ID الخاص بك هو: <code className="bg-gray-800 px-2 py-1 rounded">{storeId}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

     
   

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gradient-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">إجمالي التذاكر</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">مفتوحة</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">قيد الانتظار</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">مغلقة</p>
                  <p className="text-2xl font-bold text-green-400">{stats.closed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tickets Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">
        <Card className="gradient-border border-none h-[640px] flex flex-col overflow-hidden">
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-white">قائمة التذاكر</CardTitle>
              <p className="text-sm text-gray-400">
                اختر تذكرة لعرض المحادثة في الجانب الأيمن
              </p>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث برقم التذكرة "
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-fixed-40 border-primary text-white placeholder:text-gray-400"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full text-white">
                  <SelectValue placeholder="حالة التذكرة" />
                </SelectTrigger>
                <SelectContent className="bg-secondry border-primary text-white">
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="open">مفتوحة</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            <div className="divide-y divide-gray-800 h-full overflow-y-auto scrollbar-hide">
              {filteredTickets.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  لا توجد تذاكر مطابقة للبحث
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isActive = selectedTicket?.id === ticket.id;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => loadTicket(ticket.id)}
                      className={`w-full text-left rounded-md p-4 transition-colors ${
                        isActive ? "bg-fixed-40 inner-shadow " : "hover:bg-secondry"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getStatusIcon(ticket.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-white truncate">
                              {ticket.visitorName || `عميل جديد `}
                            </h3>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {new Date(ticket.createdAt).toLocaleDateString("en-US")}
                              {/* {ticket.ticketNumber} */}
                            </span>
                          </div>
                          <p className="text-xs text-yellow-400 mt-1">
                          {getStatusText(ticket.status)}
                          </p>
                          {ticket.visitorEmail && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {ticket.visitorEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border border-none h-[640px] flex flex-col overflow-hidden">
          {selectedTicket ? (
            <CardContent className="p-4 flex-1 flex flex-col min-h-0 border-none">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4  ">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {selectedTicket.visitorName || `عميل جديد`}
                  </h2>
                  <p className="text-sm text-primary mt-1">
                    رقم التذكرة: {selectedTicket.ticketNumber || `#${selectedTicket.id}`}
                  </p>
                  <p className="text-xs text-gray-200 mt-1">
                    تم الإنشاء في {new Date(selectedTicket.createdAt).toLocaleString("en-US")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="secondary"
                    className="primary-button after:bg-red-500"
                    size="sm"
                    onClick={() =>
                      updateTicketStatus(
                        selectedTicket.id,
                        selectedTicket.status === "closed" ? "open" : "closed"
                      )
                    }
                  >
                    {selectedTicket.status === "closed" ? "إعادة فتح" : "إغلاق"} التذكرة
                  </Button>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] bg-fixed-40 border-primary text-white">
                      <SelectValue placeholder="حالة التذكرة" />
                    </SelectTrigger>
                    <SelectContent className="bg-fixed-40 border-primary text-white">
                      <SelectItem value="open">مفتوحة</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="closed">مغلقة</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    title="حذف التذكرة"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 custom-scrollbar overflow-y-auto space-y-4 p-4 rounded-lg mt-4 bg-gray-900 min-h-0"
              >
                {messages.map((message) => {
                  const agentDisplayName =
                    message.senderAgent?.name ||
                    message.metadata?.senderName ||
                    message.metadata?.agentName ||
                    "عضو الفريق";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderType === "visitor" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg  p-4 ${
                          message.senderType === "visitor"
                            ? "bg-blue-600/20 text-white"
                            : message.senderType === "bot"
                            ? "bg-gray-800 text-white"
                            : "bg-purple-600/20 text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {message.senderType === "visitor" ? (
                            <User className="h-4 w-4" />
                          ) : message.senderType === "bot" ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium">
                            {message.senderType === "visitor"
                              ? "عميل جديد"
                              : message.senderType === "bot"
                              ? "بوت"
                              : agentDisplayName}
                          </span>
                        </div>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="space-y-2 mb-2">
                            {message.attachments.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt="Attachment"
                                className="max-w-full max-h-64 rounded-lg cursor-pointer"
                                onClick={() => window.open(url, "_blank")}
                              />
                            ))}
                          </div>
                        )}
                        {message.content && message.content.trim() && (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(message.createdAt).toLocaleString("en-US")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col  mt-4">
                {previewUrl && (
                  <div className="p-4 flex items-center gap-4 bg-gray-900/50 ">
                    <div className="relative group">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="h-20 w-20 object-cover rounded-lg border border-gray-700"
                      />
                      <button
                        onClick={removeSelectedImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>الصورة جاهزة للإرسال</p>
                      <p className="text-xs">{selectedImage?.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-center gap-2 p-4 pt-2">
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={sending || uploadingImage || !!selectedImage}
                    title="إرسال صورة"
                    className="h-10 w-10 p-0"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Image className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 w-full"
                    disabled={sending || uploadingImage}
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={(!inputMessage.trim() && !selectedImage) || sending || uploadingImage}
                    className="w-full sm:w-auto"
                  >
                    {sending || uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <MessageSquare className="h-12 w-12 text-primary" />
              <div>
                <p className="text-white font-semibold text-lg">اختر تذكرة لعرض محتواها</p>
                <p className="text-sm text-gray-400 mt-1">
                  استخدم القائمة الجانبية للبحث والتصفية ثم ابدأ المحادثة مع الزائر.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
      {/* ........................... */}
   {(liveChatUsage || usageLoading || usageError) && (
        <Card className="gradient-border border-none">
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-200">رصيد الردود الآلية للباقة</p>
                <p className="text-2xl font-bold text-white">
                  {liveChatUsage
                    ? liveChatUsage.isUnlimited
                      ? "غير محدود"
                      : `${liveChatUsage.used ?? 0} / ${liveChatUsage.total ?? 0}`
                    : "--"}
                </p>
              </div>
              {usageLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {liveChatUsage &&
                !liveChatUsage.isUnlimited &&
                typeof liveChatUsage.total === "number" &&
                liveChatUsage.total > 0 && (
                <div className="w-full md:w-1/2">
                  <div className="flex items-center justify-between text-xs text-gray-200 mb-1">
                    <span>الإستخدام</span>
                    <span>
                      {Math.min(
                        100,
                        Math.round((liveChatUsage.used / liveChatUsage.total) * 100)
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-text-primary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (liveChatUsage.used / liveChatUsage.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {usageError && !usageLoading && (
              <p className="text-sm text-red-400">{usageError}</p>
            )}
            {liveChatUsage?.resetAt && (
              <p className="text-xs text-gray-500">
                سيتم إعادة التعيين بتاريخ{" "}
                {new Date(liveChatUsage.resetAt).toLocaleDateString("en-US")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
 {/* Widget Settings Section */}
      <Card className="gradient-border border-none">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات الشات - روابط التواصل الاجتماعي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400 mb-4">
            أضف روابط حساباتك على منصات التواصل الاجتماعي لتظهر في نهاية الشات:
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-gray-700 rounded-lg bg-fixed-40">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full  bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                {widgetIconPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={widgetIconPreview} alt="Widget Icon" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400 text-center px-2">لا توجد أيقونة</span>
                )}
              </div>
              <div>
                <p className="text-sm text-white font-medium">أيقونة الويدجت</p>
                <p className="text-xs text-gray-400">ارفع صورة (PNG/GIF) لاستخدامها كأيقونة</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-end gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleWidgetIconSelect}
                disabled={uploadingIcon}
                className="bg-fixed-40 border-primary cursor-pointer"
              />
              <Button disabled={uploadingIcon} className="primary-button">
                {uploadingIcon ? <Loader2 className="h-4 w-4 animate-spin" /> : "رفع الأيقونة"}
              </Button>
            </div>
          </div>
          
          <div className="space-y-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                رابط فيسبوك
              </label>
              <Input
                type="url"
                value={widgetSettings.facebookUrl}
                onChange={(e) =>
                  setWidgetSettings({ ...widgetSettings, facebookUrl: e.target.value })
                }
                placeholder="https://facebook.com/yourpage"
                className="bg-fixed-40 border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                رابط واتساب
              </label>
              <Input
                type="url"
                value={widgetSettings.whatsappUrl}
                onChange={(e) =>
                  setWidgetSettings({ ...widgetSettings, whatsappUrl: e.target.value })
                }
                placeholder="https://wa.me/966xxxxxxxxx"
                className="bg-fixed-40 border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">رابط تليجرام</label>
              <Input
                placeholder="https://t.me/username"
                value={widgetSettings.telegramUrl}
                onChange={(e) =>
                  setWidgetSettings({
                    ...widgetSettings,
                    telegramUrl: e.target.value,
                  })
                }
                className="bg-fixed-40 border-primary text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">رابط سناب شات</label>
              <Input
                placeholder="https://www.snapchat.com/add/username"
                value={widgetSettings.snapchatUrl}
                onChange={(e) =>
                  setWidgetSettings({
                    ...widgetSettings,
                    snapchatUrl: e.target.value,
                  })
                }
                className="bg-fixed-40 border-primary text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">رابط تيك توك</label>
              <Input
                placeholder="https://www.tiktok.com/@username"
                value={widgetSettings.tiktokUrl}
                onChange={(e) =>
                  setWidgetSettings({
                    ...widgetSettings,
                    tiktokUrl: e.target.value,
                  })
                }
                className="bg-fixed-40 border-primary text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">رابط يوتيوب</label>
              <Input
                placeholder="https://www.youtube.com/channel/..."
                value={widgetSettings.youtubeUrl}
                onChange={(e) =>
                  setWidgetSettings({
                    ...widgetSettings,
                    youtubeUrl: e.target.value,
                  })
                }
                className="bg-fixed-40 border-primary text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">رابط انستجرام</label>
              <Input
                placeholder="https://www.instagram.com/username"
                value={widgetSettings.instagramUrl}
                onChange={(e) =>
                  setWidgetSettings({
                    ...widgetSettings,
                    instagramUrl: e.target.value,
                  })
                }
                className="bg-fixed-40 border-primary text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">رابط تويتر (X)</label>
              <Input
                placeholder="https://twitter.com/username"
                value={widgetSettings.twitterUrl}
                onChange={(e) =>
                  setWidgetSettings({
                    ...widgetSettings,
                    twitterUrl: e.target.value,
                  })
                }
                className="bg-fixed-40 border-primary text-white"
              />
            </div>
          </div>

          <Button
            onClick={() => saveWidgetSettings()}
            disabled={savingSettings}
            className="w-full primary-button"
          >
            {savingSettings ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ الإعدادات"
            )}
          </Button>
        </CardContent>
      </Card>

        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6 mt-6">
          <Card className="bg-fixed-40 border-none">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                قاعدة البيانات للردود التلقائية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300 font-semibold mb-2">
                  كيف يعمل النظام:
                </p>
                <ul className="text-sm text-blue-200 space-y-1 list-disc list-inside">
                  <li>ارفع ملف Excel يحتوي على بيانات منتجاتك أو خدماتك</li>
                  <li>سيستخدم الذكاء الاصطناعي هذه البيانات للإجابة على أسئلة الزوار تلقائياً</li>
                  <li>الردود ستكون دقيقة ومفصلة بناءً على البيانات المرفوعة</li>
                  <li>يمكنك رفع ملف واحد فقط لكل متجر - سيتم تحديث البيانات عند رفع ملف جديد</li>
                </ul>
              </div>

              {/* Upload Section */}
              <div className="border border-gray-700 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  رفع ملف Excel
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      الصيغ المدعومة: .xlsx, .xls, .csv (حد أقصى 10 ميجابايت)
                    </p>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="primary-button "
                  >
                   <div className="flex items-center gap-2">
                   {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        جاري الرفع...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        رفع الملف
                      </>
                    )}
                   </div>
                  </Button>
                </div>
                {selectedFile && (
                  <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-green-400" />
                      <span className="text-white">{selectedFile.name}</span>
                      <span className="text-xs text-gray-400">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFile(null)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Knowledge Bases List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">قواعد المعرفة الموجودة</h3>
                {knowledgeBases.length === 0 ? (
                  <Card className="bg-gradient-custom border-primary">
                    <CardContent className="p-8 text-center">
                      <Database className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">لا توجد قواعد معرفة مرفوعة</p>
                      <p className="text-sm text-gray-500 mt-2">
                        ارفع ملف Excel لبدء استخدام الردود التلقائية الذكية
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {knowledgeBases.map((kb) => (
                      <Card
                        key={kb.id}
                        className={`gradient-border border-none ${
                          !kb.isActive ? "opacity-60" : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <FileSpreadsheet className="h-8 w-8 text-green-400" />
                              <div>
                                <h4 className="font-semibold text-white">{kb.fileName}</h4>
                                <p className="text-sm text-gray-200">
                                  {kb.rowCount} صف • {kb.columns.length} عمود
                                </p>
                                <p className="text-xs text-yellow-500 mt-1">
                                  آخر تحديث: {new Date(kb.updatedAt).toLocaleDateString("en-US")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {kb.isActive ? (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                                    نشط
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                                    غير نشط
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center  gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewKB(kb.id)}
                                title="عرض البيانات"
                              >
                                <Eye className="h-4 w-4 text-white" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleKB(kb.id)}
                                title={kb.isActive ? "إلغاء التفعيل" : "تفعيل"}
                              >
                                {kb.isActive ? (
                                  <PowerOff className="h-4 w-4 text-yellow-400" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-400" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteKB(kb.id)}
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Knowledge Base Dialog */}
      <Dialog open={!!viewingKB} onOpenChange={() => setViewingKB(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">
              {viewingKB?.fileName}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {viewingKB?.rowCount} صف • {viewingKB?.columns.length} عمود
            </DialogDescription>
          </DialogHeader>

          {viewingKB && viewingKB.data && (
            <div className="flex-1 overflow-auto">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-800">
                        {viewingKB.columns.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-right text-gray-300 font-semibold sticky top-0 bg-gray-800"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(viewingKB.data) && viewingKB.data.slice(0, 100).map((row: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                        >
                          {viewingKB.columns.map((col) => (
                            <td key={col} className="px-4 py-2 text-gray-300 max-w-xs truncate" title={row[col] || "-"}>
                              {row[col] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Array.isArray(viewingKB.data) && viewingKB.data.length > 100 && (
                    <p className="text-xs text-gray-500 mt-4 text-center">
                      عرض أول 100 صف من أصل {viewingKB.data.length}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Confirmation Dialog */}
      <Dialog open={!!deletingTicket} onOpenChange={() => setDeletingTicket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 mx-10">
              <AlertCircle className="h-5 w-5 text-red-500" />
              تأكيد حذف التذكرة
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              هل أنت متأكد من حذف التذكرة رقم {deletingTicket?.ticketNumber || `#${deletingTicket?.id}`}؟
              <br />
              <span className="text-red-400 font-medium">لا يمكن التراجع عن هذا الإجراء.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="destructive"
              onClick={() => setDeletingTicket(null)}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmDeleteTicket}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Knowledge Base Confirmation Dialog */}
      <Dialog open={!!deletingKB} onOpenChange={() => setDeletingKB(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 mx-10">
              {/* <AlertCircle className="h-5 w-5 text-red-500" /> */}
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              هل أنت متأكد من حذف قاعدة البيانات "{deletingKB?.fileName}"؟
              <br />
              <span className="text-red-400 font-medium">لا يمكن التراجع عن هذا الإجراء.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => setDeletingKB(null)}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmDeleteKB}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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

