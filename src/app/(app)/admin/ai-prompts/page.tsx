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
import { useAuth } from "@/lib/auth";
import Loader from "@/components/Loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Edit, Trash2, Search, Filter } from "lucide-react";

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

export default function AIPromptsAdminPage() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | "">("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | "">("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general" as PromptCategory,
    prompt: "",
    variables: [] as string[],
    isActive: true,
    isGlobal: false,
    tags: [] as string[],
  });

  useEffect(() => {
    loadPrompts();
  }, [categoryFilter, isActiveFilter, searchTerm]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: 100,
      };
      
      if (categoryFilter) params.category = categoryFilter;
      if (isActiveFilter !== "") params.isActive = isActiveFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await getAllPrompts(params);
      if (res.success) {
        setPrompts(res.data);
      }
    } catch (error: any) {
      setError(error.message || "فشل في تحميل البرومبتات");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (prompt?: AIPrompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setFormData({
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
      setFormData({
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
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPrompt(null);
    setFormData({
      title: "",
      description: "",
      category: "general",
      prompt: "",
      variables: [],
      isActive: true,
      isGlobal: false,
      tags: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.prompt) {
      setError("العنوان والبرومبت مطلوبان");
      return;
    }

    try {
      if (editingPrompt) {
        setIsUpdating(true);
        const res = await updatePrompt(editingPrompt.id, formData);
        if (res.success) {
          setSuccess("تم تحديث البرومبت بنجاح");
          handleCloseDialog();
          loadPrompts();
        }
      } else {
        setIsCreating(true);
        const res = await createPrompt(formData);
        if (res.success) {
          setSuccess("تم إنشاء البرومبت بنجاح");
          handleCloseDialog();
          loadPrompts();
        }
      }
    } catch (error: any) {
      setError(error.message || "فشل في حفظ البرومبت");
    } finally {
      setIsCreating(false);
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا البرومبت؟")) return;

    setIsDeleting(true);
    try {
      const res = await deletePrompt(id);
      if (res.success) {
        setSuccess("تم حذف البرومبت بنجاح");
        loadPrompts();
      }
    } catch (error: any) {
      setError(error.message || "فشل في حذف البرومبت");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Loader
        text="جاري تحميل البرومبتات..."
        size="lg"
        variant="primary"
        showDots
        fullScreen
      />
    );
  }

  if (isCreating || isUpdating || isDeleting) {
    let loaderText = "جاري المعالجة...";
    if (isCreating) loaderText = "جاري إنشاء البرومبت...";
    else if (isUpdating) loaderText = "جاري تحديث البرومبت...";
    else if (isDeleting) loaderText = "جاري حذف البرومبت...";

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

  const filteredPrompts = prompts.filter((p) => {
    if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !p.prompt.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (isActiveFilter !== "" && p.isActive !== isActiveFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">إدارة برومبتات الذكاء الاصطناعي</h2>
          <p className="text-sm text-gray-400">إدارة وتنظيم البرومبتات المستخدمة في النظام</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="primary-button"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة برومبت جديد
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/50">
          <CardContent className="p-4">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}
      {success && (
        <Card className="bg-green-500/10 border-green-500/50">
          <CardContent className="p-4">
            <p className="text-sm text-green-400">{success}</p>
          </CardContent>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={isActiveFilter}
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

      {/* Prompts List */}
      <Card className="bg-card border-none">
        <CardHeader>
          <CardTitle className="text-white">البرومبتات ({filteredPrompts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPrompts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">لا توجد برومبتات</p>
          ) : (
            <div className="space-y-4">
              {filteredPrompts.map((prompt) => (
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
                            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                              عام
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            prompt.isActive 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {prompt.isActive ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>
                        {prompt.description && (
                          <p className="text-sm text-gray-400 mb-2">{prompt.description}</p>
                        )}
                        <div className="text-sm text-gray-300 mb-2 line-clamp-2">
                          {prompt.prompt}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>عدد الاستخدامات: {prompt.usageCount}</span>
                          <span>أنشأه: {prompt.creator?.name || prompt.creator?.email || 'غير معروف'}</span>
                          {prompt.tags && prompt.tags.length > 0 && (
                            <div className="flex gap-1">
                              {prompt.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-700 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDialog(prompt)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDelete(prompt.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingPrompt ? "تعديل البرومبت" : "إضافة برومبت جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">العنوان *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-[#01191040] border-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الوصف</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#01191040] border-blue-300"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">الفئة *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as PromptCategory })}
                  required
                  className="w-full p-2 rounded-md border border-blue-300 bg-[#01191040] text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  نشط
                </label>
                {user?.role === 'admin' && (
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={formData.isGlobal}
                      onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                      className="w-4 h-4"
                    />
                    برومبت عام
                  </label>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">البرومبت *</label>
              <Textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                required
                className="bg-[#01191040] border-blue-300"
                rows={8}
                placeholder="اكتب البرومبت هنا..."
              />
            </div>
            <div className="flex gap-4">
              <Button
                type="submit"
                className="primary-button"
                disabled={isCreating || isUpdating}
              >
                {editingPrompt ? "تحديث" : "إنشاء"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseDialog}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}















