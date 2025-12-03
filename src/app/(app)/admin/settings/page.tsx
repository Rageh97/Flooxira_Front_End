"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getAllPrompts, 
  createPrompt, 
  updatePrompt, 
  deletePrompt,
  type AIPrompt,
  type PromptCategory
} from "@/lib/aiPromptApi";
import { 
  getAllLinks, 
  saveLink, 
  deleteLink, 
  type SystemLink 
} from "@/lib/systemLinkApi";
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllNewsTickers,
  createNewsTicker,
  updateNewsTicker,
  deleteNewsTicker,
  uploadFile,
  type Banner,
  type NewsTicker
} from "@/lib/settingsApi";
import { useAuth } from "@/lib/auth";
import Loader from "@/components/Loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Edit, Trash2, Search, Filter, Link as LinkIcon, MessageSquare, Megaphone, Image as ImageIcon, Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const CATEGORIES: { value: PromptCategory; label: string }[] = [
  { value: 'system', label: 'النظام' },
  { value: 'greeting', label: 'التحية' },
  { value: 'farewell', label: 'الوداع' },
  { value: 'sales', label: 'المبيعات' },
  { value: 'support', label: 'الدعم' },
  { value: 'objection_handling', label: 'التعامل مع الاعتراضات' },
  { value: 'appointment', label: 'المواعيد' },
  { value: 'general', label: 'عام' },
  { value: 'custom', label: 'مخصص' },
];

export default function SettingsPage() {
  const { user, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("prompts");

  // Prompts State
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);
  const [isDeletingPrompt, setIsDeletingPrompt] = useState(false);
  const [promptError, setPromptError] = useState("");
  const [promptSuccess, setPromptSuccess] = useState("");
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [promptSearchTerm, setPromptSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | "">("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | "">("");
  
  const [promptFormData, setPromptFormData] = useState({
    title: "",
    description: "",
    category: "general" as PromptCategory,
    prompt: "",
    variables: [] as string[],
    isActive: true,
    isGlobal: false,
    tags: [] as string[],
  });

  // Links State
  const [links, setLinks] = useState<SystemLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isDeletingLink, setIsDeletingLink] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SystemLink | null>(null);
  
  const [linkFormData, setLinkFormData] = useState({
    key: "",
    url: "",
    description: "",
    isActive: true,
  });

  // News Ticker State
  const [newsTickers, setNewsTickers] = useState<NewsTicker[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsTicker | null>(null);
  const [newsFormData, setNewsFormData] = useState({
    content: "",
    isActive: true,
    order: 0
  });

  // Banners State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerFormData, setBannerFormData] = useState({
    title: "",
    description: "",
    image: "",
    link: "",
    buttonText: "",
    backgroundColor: "#000000",
    textColor: "#FFFFFF",
    duration: 5,
    isActive: true,
    order: 0
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load Data
  useEffect(() => {
    if (activeTab === "prompts") {
      loadPrompts();
    } else if (activeTab === "links") {
      loadLinks();
    } else if (activeTab === "news") {
      loadNews();
    } else if (activeTab === "banners") {
      loadBanners();
    }
  }, [activeTab, categoryFilter, isActiveFilter, promptSearchTerm]);

  // --- Prompts Logic ---
  const loadPrompts = async () => {
    setLoadingPrompts(true);
    try {
      const params: any = { page: 1, limit: 100 };
      if (categoryFilter) params.category = categoryFilter;
      if (isActiveFilter !== "") params.isActive = isActiveFilter;
      if (promptSearchTerm) params.search = promptSearchTerm;

      const res = await getAllPrompts(params);
      if (res.success) setPrompts(res.data);
    } catch (error: any) {
      setPromptError(error.message || "فشل في تحميل البرومبتات");
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleOpenPromptDialog = (prompt?: AIPrompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setPromptFormData({
        title: prompt.title,
        description: prompt.description || "",
        category: prompt.category,
        prompt: prompt.prompt,
        variables: prompt.variables || [],
        isActive: prompt.isActive,
        isGlobal: prompt.isGlobal,
        tags: prompt.tags || [],
      });
    } else {
      setEditingPrompt(null);
      setPromptFormData({
        title: "",
        description: "",
        category: "general",
        prompt: "",
        variables: [],
        isActive: true,
        isGlobal: false,
        tags: [],
      });
    }
    setIsPromptDialogOpen(true);
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptFormData.title || !promptFormData.prompt) {
      setPromptError("العنوان والبرومبت مطلوبان");
      return;
    }

    try {
      if (editingPrompt) {
        setIsUpdatingPrompt(true);
        const res = await updatePrompt(editingPrompt.id, promptFormData);
        if (res.success) {
          setPromptSuccess("تم تحديث البرومبت بنجاح");
          setIsPromptDialogOpen(false);
          loadPrompts();
        }
      } else {
        setIsCreatingPrompt(true);
        const res = await createPrompt(promptFormData);
        if (res.success) {
          setPromptSuccess("تم إنشاء البرومبت بنجاح");
          setIsPromptDialogOpen(false);
          loadPrompts();
        }
      }
    } catch (error: any) {
      setPromptError(error.message || "فشل في حفظ البرومبت");
    } finally {
      setIsCreatingPrompt(false);
      setIsUpdatingPrompt(false);
    }
  };

  const handleDeletePrompt = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا البرومبت؟")) return;
    setIsDeletingPrompt(true);
    try {
      const res = await deletePrompt(id);
      if (res.success) {
        setPromptSuccess("تم حذف البرومبت بنجاح");
        loadPrompts();
      }
    } catch (error: any) {
      setPromptError(error.message || "فشل في حذف البرومبت");
    } finally {
      setIsDeletingPrompt(false);
    }
  };

  const filteredPrompts = prompts.filter((p) => {
    if (promptSearchTerm && !p.title.toLowerCase().includes(promptSearchTerm.toLowerCase()) && 
        !p.prompt.toLowerCase().includes(promptSearchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // --- Links Logic ---
  const loadLinks = async () => {
    setLoadingLinks(true);
    try {
      const token = getToken();
      if (!token) return;
      const res = await getAllLinks(token);
      if (res.success) setLinks(res.links);
    } catch (error: any) {
      setLinkError(error.message || "فشل في تحميل الروابط");
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleOpenLinkDialog = (link?: SystemLink) => {
    if (link) {
      setEditingLink(link);
      setLinkFormData({
        key: link.key,
        url: link.url,
        description: link.description || "",
        isActive: link.isActive,
      });
    } else {
      setEditingLink(null);
      setLinkFormData({
        key: "",
        url: "",
        description: "",
        isActive: true,
      });
    }
    setIsLinkDialogOpen(true);
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkFormData.key || !linkFormData.url) {
      setLinkError("المفتاح والرابط مطلوبان");
      return;
    }

    setIsSavingLink(true);
    try {
      const token = getToken();
      if (!token) return;
      const res = await saveLink(token, linkFormData);
      if (res.success) {
        setLinkSuccess(editingLink ? "تم تحديث الرابط بنجاح" : "تم إنشاء الرابط بنجاح");
        setIsLinkDialogOpen(false);
        loadLinks();
      }
    } catch (error: any) {
      setLinkError(error.message || "فشل في حفظ الرابط");
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الرابط؟")) return;
    setIsDeletingLink(true);
    try {
      const token = getToken();
      if (!token) return;
      const res = await deleteLink(token, id);
      if (res.success) {
        setLinkSuccess("تم حذف الرابط بنجاح");
        loadLinks();
      }
    } catch (error: any) {
      setLinkError(error.message || "فشل في حذف الرابط");
    } finally {
      setIsDeletingLink(false);
    }
  };

  // --- News Logic ---
  const loadNews = async () => {
    setLoadingNews(true);
    try {
      const res = await getAllNewsTickers();
      if (res.success) setNewsTickers(res.tickers);
    } catch (error: any) {
      toast.error(error.message || "فشل في تحميل الأخبار");
    } finally {
      setLoadingNews(false);
    }
  };

  const handleOpenNewsDialog = (news?: NewsTicker) => {
    if (news) {
      setEditingNews(news);
      setNewsFormData({
        content: news.content,
        isActive: news.isActive,
        order: news.order
      });
    } else {
      setEditingNews(null);
      setNewsFormData({
        content: "",
        isActive: true,
        order: 0
      });
    }
    setIsNewsDialogOpen(true);
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsFormData.content) {
      toast.error("المحتوى مطلوب");
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      if (editingNews) {
        const res = await updateNewsTicker(editingNews.id, newsFormData, token);
        if (res.success) {
          toast.success("تم تحديث الخبر بنجاح");
          setIsNewsDialogOpen(false);
          loadNews();
        }
      } else {
        const res = await createNewsTicker(newsFormData, token);
        if (res.success) {
          toast.success("تم إنشاء الخبر بنجاح");
          setIsNewsDialogOpen(false);
          loadNews();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "فشل في حفظ الخبر");
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الخبر؟")) return;
    try {
      const token = getToken();
      if (!token) return;
      const res = await deleteNewsTicker(id, token);
      if (res.success) {
        toast.success("تم حذف الخبر بنجاح");
        loadNews();
      }
    } catch (error: any) {
      toast.error(error.message || "فشل في حذف الخبر");
    }
  };

  // --- Banners Logic ---
  const loadBanners = async () => {
    setLoadingBanners(true);
    try {
      const res = await getAllBanners();
      if (res.success) setBanners(res.banners);
    } catch (error: any) {
      toast.error(error.message || "فشل في تحميل البنرات");
    } finally {
      setLoadingBanners(false);
    }
  };

  const handleOpenBannerDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerFormData({
        title: banner.title,
        description: banner.description || "",
        image: banner.image || "",
        link: banner.link || "",
        buttonText: banner.buttonText || "",
        backgroundColor: banner.backgroundColor,
        textColor: banner.textColor,
        duration: banner.duration || 5,
        isActive: banner.isActive,
        order: banner.order
      });
    } else {
      setEditingBanner(null);
      setBannerFormData({
        title: "",
        description: "",
        image: "",
        link: "",
        buttonText: "",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        duration: 5,
        isActive: true,
        order: 0
      });
    }
    setIsBannerDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const token = getToken();
      if (!token) return;
      const res = await uploadFile(token, file);
      if (res.url) {
        setBannerFormData(prev => ({ ...prev, image: res.url }));
        toast.success("تم رفع الصورة بنجاح");
      }
    } catch (error: any) {
      toast.error("فشل في رفع الصورة");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerFormData.title) {
      toast.error("العنوان مطلوب");
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      if (editingBanner) {
        const res = await updateBanner(editingBanner.id, bannerFormData, token);
        if (res.success) {
          toast.success("تم تحديث البنر بنجاح");
          setIsBannerDialogOpen(false);
          loadBanners();
        }
      } else {
        const res = await createBanner(bannerFormData, token);
        if (res.success) {
          toast.success("تم إنشاء البنر بنجاح");
          setIsBannerDialogOpen(false);
          loadBanners();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "فشل في حفظ البنر");
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا البنر؟")) return;
    try {
      const token = getToken();
      if (!token) return;
      const res = await deleteBanner(id, token);
      if (res.success) {
        toast.success("تم حذف البنر بنجاح");
        loadBanners();
      }
    } catch (error: any) {
      toast.error(error.message || "فشل في حذف البنر");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">الإعدادات</h2>
          <p className="text-gray-400">إدارة إعدادات النظام والبرومبتات والروابط</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-gray-900/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            البرومبتات
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            الروابط
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            شريط الأخبار
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            البنرات
          </TabsTrigger>
        </TabsList>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenPromptDialog()} className="primary-button">
              <Plus className="w-4 h-4 ml-2" />
              إضافة برومبت جديد
            </Button>
          </div>

          {promptError && (
            <Card className="bg-red-500/10 border-red-500/50">
              <CardContent className="p-4 text-red-400">{promptError}</CardContent>
            </Card>
          )}
          {promptSuccess && (
            <Card className="bg-green-500/10 border-green-500/50">
              <CardContent className="p-4 text-green-400">{promptSuccess}</CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="bg-card border-none">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="البحث..."
                    value={promptSearchTerm}
                    onChange={(e) => setPromptSearchTerm(e.target.value)}
                    className="pr-10 bg-[#01191040] border-blue-300"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as PromptCategory | "")}
                  className="p-2 rounded-md border border-blue-300 bg-[#01191040] text-white"
                >
                  <option value="">جميع الفئات</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <select
                  value={isActiveFilter === "" ? "" : String(isActiveFilter)}
                  onChange={(e) => setIsActiveFilter(e.target.value === "" ? "" : e.target.value === "true")}
                  className="p-2 rounded-md border border-blue-300 bg-[#01191040] text-white"
                >
                  <option value="">جميع الحالات</option>
                  <option value="true">نشط</option>
                  <option value="false">غير نشط</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {loadingPrompts ? (
             <Loader text="جاري تحميل البرومبتات..." size="lg" variant="primary" showDots />
          ) : (
            <div className="space-y-4">
              {filteredPrompts.length === 0 ? (
                <p className="text-center text-gray-400 py-8">لا توجد برومبتات</p>
              ) : (
                filteredPrompts.map((prompt) => (
                  <Card key={prompt.id} className="gradient-border border-blue-300/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{prompt.title}</h3>
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                              {CATEGORIES.find(c => c.value === prompt.category)?.label || prompt.category}
                            </span>
                            {prompt.isGlobal && (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">عام</span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded-full ${prompt.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                              {prompt.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </div>
                          {prompt.description && <p className="text-sm text-gray-400 mb-2">{prompt.description}</p>}
                          <div className="text-sm text-gray-300 mb-2 line-clamp-2">{prompt.prompt}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleOpenPromptDialog(prompt)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleDeletePrompt(prompt.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenLinkDialog()} className="primary-button">
              <Plus className="w-4 h-4 ml-2" />
              إضافة رابط جديد
            </Button>
          </div>

          {linkError && (
            <Card className="bg-red-500/10 border-red-500/50">
              <CardContent className="p-4 text-red-400">{linkError}</CardContent>
            </Card>
          )}
          {linkSuccess && (
            <Card className="bg-green-500/10 border-green-500/50">
              <CardContent className="p-4 text-green-400">{linkSuccess}</CardContent>
            </Card>
          )}

          {loadingLinks ? (
             <Loader text="جاري تحميل الروابط..." size="lg" variant="primary" showDots />
          ) : (
            <Card className="bg-card border-none">
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المفتاح (Key)</TableHead>
                      <TableHead>الرابط (URL)</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-400">لا توجد روابط</TableCell>
                      </TableRow>
                    ) : (
                      links.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell className="font-mono text-blue-300">{link.key}</TableCell>
                          <TableCell className="max-w-xs truncate" title={link.url}>{link.url}</TableCell>
                          <TableCell>{link.description || '-'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${link.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                              {link.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="secondary" size="sm" onClick={() => handleOpenLinkDialog(link)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="secondary" size="sm" onClick={() => handleDeleteLink(link.id)} className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenNewsDialog()} className="primary-button">
              <Plus className="w-4 h-4 ml-2" />
              إضافة خبر جديد
            </Button>
          </div>

          {loadingNews ? (
             <Loader text="جاري تحميل الأخبار..." size="lg" variant="primary" showDots />
          ) : (
            <Card className="bg-card border-none">
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المحتوى</TableHead>
                      <TableHead>الترتيب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newsTickers.length === 0 ? (
                      <TableRow className="">
                        <TableCell colSpan={4} className=" py-8 text-white">لا توجد أخبار</TableCell>
                      </TableRow>
                    ) : (
                      newsTickers.map((news) => (
                        <TableRow key={news.id}>
                          <TableCell className="max-w-md truncate text-white text-right">{news.content}</TableCell>
                          <TableCell className="text-white text-right">{news.order}</TableCell>
                          <TableCell className=" text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${news.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                              {news.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="secondary" size="sm" onClick={() => handleOpenNewsDialog(news)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="secondary" size="sm" onClick={() => handleDeleteNews(news.id)} className="text-red-400  hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenBannerDialog()} className="primary-button">
              <Plus className="w-4 h-4 ml-2" />
              إضافة بنر جديد
            </Button>
          </div>

          {loadingBanners ? (
             <Loader text="جاري تحميل البنرات..." size="lg" variant="primary" showDots />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.length === 0 ? (
                <p className="text-center text-gray-400 py-8 col-span-2">لا توجد بنرات</p>
              ) : (
                banners.map((banner) => (
                  <Card key={banner.id} className="gradient-border border-blue-300/30 overflow-hidden">
                    <div 
                      className="h-32 w-full relative"
                      style={{ backgroundColor: banner.backgroundColor }}
                    >
                      {banner.image && (
                        <img src={banner.image} alt={banner.title} className="w-full h-full object-cover opacity-80" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30">
                        <h3 className="text-xl font-bold" style={{ color: banner.textColor }}>{banner.title}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex gap-2 text-xs">
                            <span className="bg-gray-800 px-2 py-1 rounded">الترتيب: {banner.order}</span>
                            <span className={`px-2 py-1 rounded ${banner.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                              {banner.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleOpenBannerDialog(banner)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleDeleteBanner(banner.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Prompt Dialog */}
      <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editingPrompt ? "تعديل البرومبت" : "إضافة برومبت جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePromptSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">العنوان *</label>
              <Input value={promptFormData.title} onChange={(e) => setPromptFormData({ ...promptFormData, title: e.target.value })} required className="bg-[#01191040] border-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الوصف</label>
              <Textarea value={promptFormData.description} onChange={(e) => setPromptFormData({ ...promptFormData, description: e.target.value })} className="bg-[#01191040] border-blue-300" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">الفئة *</label>
                <select value={promptFormData.category} onChange={(e) => setPromptFormData({ ...promptFormData, category: e.target.value as PromptCategory })} required className="w-full p-2 rounded-md border border-blue-300 bg-[#01191040] text-white">
                  {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-2 text-white">
                  <input type="checkbox" checked={promptFormData.isActive} onChange={(e) => setPromptFormData({ ...promptFormData, isActive: e.target.checked })} className="w-4 h-4" /> نشط
                </label>
                {user?.role === 'admin' && (
                  <label className="flex items-center gap-2 text-white">
                    <input type="checkbox" checked={promptFormData.isGlobal} onChange={(e) => setPromptFormData({ ...promptFormData, isGlobal: e.target.checked })} className="w-4 h-4" /> برومبت عام
                  </label>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">البرومبت *</label>
              <Textarea value={promptFormData.prompt} onChange={(e) => setPromptFormData({ ...promptFormData, prompt: e.target.value })} required className="bg-[#01191040] border-blue-300" rows={8} placeholder="اكتب البرومبت هنا..." />
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="primary-button" disabled={isCreatingPrompt || isUpdatingPrompt}>{editingPrompt ? "تحديث" : "إنشاء"}</Button>
              <Button type="button" variant="secondary" onClick={() => setIsPromptDialogOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editingLink ? "تعديل الرابط" : "إضافة رابط جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">المفتاح (Key) *</label>
              <Input 
                value={linkFormData.key} 
                onChange={(e) => setLinkFormData({ ...linkFormData, key: e.target.value })} 
                required 
                placeholder="مثال: content_service_link"
                className="bg-[#01191040] border-blue-300 font-mono" 
                disabled={!!editingLink} // Disable key editing to prevent issues
              />
              <p className="text-xs text-gray-400 mt-1">يستخدم هذا المفتاح لاستدعاء الرابط في الكود</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الرابط (URL) *</label>
              <Input value={linkFormData.url} onChange={(e) => setLinkFormData({ ...linkFormData, url: e.target.value })} required className="bg-[#01191040] border-blue-300" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الوصف</label>
              <Textarea value={linkFormData.description} onChange={(e) => setLinkFormData({ ...linkFormData, description: e.target.value })} className="bg-[#01191040] border-blue-300" rows={2} />
            </div>
            <div className="flex items-center gap-2 text-white">
              <input type="checkbox" checked={linkFormData.isActive} onChange={(e) => setLinkFormData({ ...linkFormData, isActive: e.target.checked })} className="w-4 h-4" /> نشط
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="primary-button" disabled={isSavingLink}>{editingLink ? "تحديث" : "إنشاء"}</Button>
              <Button type="button" variant="secondary" onClick={() => setIsLinkDialogOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* News Dialog */}
      <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editingNews ? "تعديل الخبر" : "إضافة خبر جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNewsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">المحتوى *</label>
              <Textarea value={newsFormData.content} onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })} required className="bg-[#01191040] border-blue-300" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الترتيب</label>
              <Input type="number" value={newsFormData.order} onChange={(e) => setNewsFormData({ ...newsFormData, order: parseInt(e.target.value) })} className="bg-[#01191040] border-blue-300" />
            </div>
            <div className="flex items-center gap-2 text-white">
              <input type="checkbox" checked={newsFormData.isActive} onChange={(e) => setNewsFormData({ ...newsFormData, isActive: e.target.checked })} className="w-4 h-4" /> نشط
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="primary-button">{editingNews ? "تحديث" : "إنشاء"}</Button>
              <Button type="button" variant="secondary" onClick={() => setIsNewsDialogOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Banner Dialog */}
      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editingBanner ? "تعديل البنر" : "إضافة بنر جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBannerSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">العنوان *</label>
              <Input value={bannerFormData.title} onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })} required className="bg-[#01191040] border-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">الصورة</label>
              <div className="flex gap-2">
                <Input value={bannerFormData.image} onChange={(e) => setBannerFormData({ ...bannerFormData, image: e.target.value })} className="bg-[#01191040] border-blue-300" placeholder="رابط الصورة" />
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
              {uploadingImage && <p className="text-xs text-blue-300 mt-1">جاري الرفع...</p>}
              {bannerFormData.image && (
                <div className="mt-2 h-20 bg-gray-800 rounded overflow-hidden">
                  <img src={bannerFormData.image} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الرابط</label>
              <Input value={bannerFormData.link} onChange={(e) => setBannerFormData({ ...bannerFormData, link: e.target.value })} className="bg-[#01191040] border-blue-300" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">نص الزر</label>
              <Input value={bannerFormData.buttonText} onChange={(e) => setBannerFormData({ ...bannerFormData, buttonText: e.target.value })} className="bg-[#01191040] border-blue-300" placeholder="مثال: اشترك الآن" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">الترتيب</label>
              <Input type="number" value={bannerFormData.order} onChange={(e) => setBannerFormData({ ...bannerFormData, order: parseInt(e.target.value) })} className="bg-[#01191040] border-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">المدة (ثواني)</label>
              <Input type="number" value={bannerFormData.duration} onChange={(e) => setBannerFormData({ ...bannerFormData, duration: parseInt(e.target.value) })} className="bg-[#01191040] border-blue-300" />
            </div>
            <div className="flex items-center gap-2 text-white">
              <input type="checkbox" checked={bannerFormData.isActive} onChange={(e) => setBannerFormData({ ...bannerFormData, isActive: e.target.checked })} className="w-4 h-4" /> نشط
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="primary-button" disabled={uploadingImage}>{editingBanner ? "تحديث" : "إنشاء"}</Button>
              <Button type="button" variant="secondary" onClick={() => setIsBannerDialogOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
