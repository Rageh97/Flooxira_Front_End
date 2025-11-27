"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Eye,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

type Tutorial = {
  id: number;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeVideoId?: string;
  thumbnailUrl?: string;
  duration?: number;
  category: string;
  order: number;
  isActive: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export default function TutorialsAdminPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const { showSuccess, showError } = useToast();

  // Form states
  const [newTutorial, setNewTutorial] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    category: 'عام',
    order: 0
  });

  const [editTutorial, setEditTutorial] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    category: 'عام',
    order: 0,
    isActive: true
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false);

  // Handle thumbnail upload for create modal
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('خطأ', 'يرجى اختيار صورة فقط');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('خطأ', 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingThumbnail(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        setNewTutorial({ ...newTutorial, thumbnailUrl: data.url });
        showSuccess('تم رفع الصورة بنجاح!');
      } else {
        throw new Error(data.message || 'فشل رفع الصورة');
      }
    } catch (error: any) {
      showError('خطأ في رفع الصورة', error.message);
      setThumbnailPreview('');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // Handle thumbnail upload for edit modal
  const handleEditThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('خطأ', 'يرجى اختيار صورة فقط');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('خطأ', 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingEditThumbnail(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        setEditTutorial({ ...editTutorial, thumbnailUrl: data.url });
        showSuccess('تم رفع الصورة بنجاح!');
      } else {
        throw new Error(data.message || 'فشل رفع الصورة');
      }
    } catch (error: any) {
      showError('خطأ في رفع الصورة', error.message);
      setEditThumbnailPreview('');
    } finally {
      setUploadingEditThumbnail(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadTutorials();
  }, [token]);

  const loadTutorials = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tutorials/admin', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setTutorials(data.tutorials);
      } else {
        setError(data.message || 'Failed to load tutorials');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTutorial = async () => {
    try {
      const response = await fetch('/api/tutorials/admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTutorial)
      });
      const data = await response.json();
      if (data.success) {
        setCreateModalOpen(false);
        setNewTutorial({
          title: '',
          description: '',
          youtubeUrl: '',
          thumbnailUrl: '',
          category: 'عام',
          order: 0
        });
        setThumbnailPreview('');
        loadTutorials();
        showSuccess('تم إنشاء الشرح بنجاح!');
      } else {
        showError('خطأ في إنشاء الشرح', data.message);
      }
    } catch (e: any) {
      showError('خطأ في إنشاء الشرح', e.message);
    }
  };

  const handleUpdateTutorial = async () => {
    if (!selectedTutorial) return;
    
    try {
      const response = await fetch(`/api/tutorials/admin/${selectedTutorial.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editTutorial)
      });
      const data = await response.json();
      if (data.success) {
        setEditModalOpen(false);
        setSelectedTutorial(null);
        loadTutorials();
        showSuccess('تم تحديث الشرح بنجاح!');
      } else {
        showError('خطأ في تحديث الشرح', data.message);
      }
    } catch (e: any) {
      showError('خطأ في تحديث الشرح', e.message);
    }
  };

  const handleDeleteTutorial = async () => {
    if (!selectedTutorial) return;
    
    try {
      const response = await fetch(`/api/tutorials/admin/${selectedTutorial.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setSelectedTutorial(null);
        loadTutorials();
        showSuccess('تم حذف الشرح بنجاح!');
      } else {
        showError('خطأ في حذف الشرح', data.message);
      }
    } catch (e: any) {
      showError('خطأ في حذف الشرح', e.message);
    }
  };

  const openEditModal = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setEditTutorial({
      title: tutorial.title,
      description: tutorial.description || '',
      youtubeUrl: tutorial.youtubeUrl,
      thumbnailUrl: tutorial.thumbnailUrl || '',
      category: tutorial.category,
      order: tutorial.order,
      isActive: tutorial.isActive
    });
    setEditThumbnailPreview(tutorial.thumbnailUrl || '');
    setEditModalOpen(true);
  };

  const openDeleteModal = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setDeleteModalOpen(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-gray-300">جاري تحميل الشروحات...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-red-400">خطأ: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة الشروحات</h1>
          <p className="text-sm text-gray-300">إدارة شروحات المنصة التعليمية</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2 rtl:space-x-reverse">
          <Plus className="w-4 h-4" />
          <span>إضافة شرح جديد</span>
        </Button>
      </div>

      {/* Tutorials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => (
          <Card key={tutorial.id} className="bg-card border-none overflow-hidden">
            <div className="relative">
              <img
                src={tutorial.thumbnailUrl || `https://img.youtube.com/vi/${tutorial.youtubeVideoId}/maxresdefault.jpg`}
                alt={tutorial.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge className={tutorial.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {tutorial.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
                <Badge variant="outline" className="bg-black/50 text-white">
                  {tutorial.category}
                </Badge>
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white bg-black/50 px-2 py-1 rounded">
                <Play className="w-4 h-4" />
                <span className="text-sm">
                  {tutorial.duration ? formatDuration(tutorial.duration) : '--:--'}
                </span>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-2 line-clamp-2">{tutorial.title}</h3>
              <p className="text-sm text-gray-300 mb-3 line-clamp-2">{tutorial.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {tutorial.views} مشاهدة
                </span>
                <span>الترتيب: {tutorial.order}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => window.open(tutorial.youtubeUrl, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  مشاهدة
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEditModal(tutorial)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openDeleteModal(tutorial)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tutorials.length === 0 && (
        <Card className="bg-card border-none">
          <CardContent className="p-8 text-center">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">لا توجد شروحات</h3>
            <p className="text-gray-300 mb-4">ابدأ بإضافة أول شرح للمنصة</p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة شرح جديد
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة شرح جديد</DialogTitle>
            <DialogDescription>
              أضف شرح جديد للمنصة مع رابط يوتيوب
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">العنوان *</Label>
              <Input
                id="title"
                value={newTutorial.title}
                onChange={(e) => setNewTutorial({ ...newTutorial, title: e.target.value })}
                placeholder="عنوان الشرح"
              />
            </div>
            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newTutorial.description}
                onChange={(e) => setNewTutorial({ ...newTutorial, description: e.target.value })}
                placeholder="وصف الشرح"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="youtubeUrl">رابط يوتيوب *</Label>
              <Input
                id="youtubeUrl"
                value={newTutorial.youtubeUrl}
                onChange={(e) => setNewTutorial({ ...newTutorial, youtubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label htmlFor="thumbnailUrl">صورة مخصصة للفيديو (اختياري)</Label>
              <Input
                id="thumbnailUrl"
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={uploadingThumbnail}
                className="cursor-pointer"
              />
              {uploadingThumbnail && (
                <p className="text-sm text-blue-500 mt-2">جاري رفع الصورة...</p>
              )}
              {thumbnailPreview && !uploadingThumbnail && (
                <div className="mt-2">
                  <img 
                    src={thumbnailPreview} 
                    alt="معاينة الصورة" 
                    className="w-full h-32 object-cover rounded border border-gray-300"
                  />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                إذا لم تقم برفع صورة، سيتم استخدام الصورة الافتراضية من يوتيوب
              </p>
            </div>
            <div>
              <Label htmlFor="category">التصنيف</Label>
              <Input
                id="category"
                value={newTutorial.category}
                onChange={(e) => setNewTutorial({ ...newTutorial, category: e.target.value })}
                placeholder="التصنيف"
              />
            </div>
            <div>
              <Label htmlFor="order">الترتيب</Label>
              <Input
                id="order"
                type="number"
                value={newTutorial.order}
                onChange={(e) => setNewTutorial({ ...newTutorial, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateTutorial}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الشرح</DialogTitle>
            <DialogDescription>
              قم بتعديل معلومات الشرح
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">العنوان *</Label>
              <Input
                id="edit-title"
                value={editTutorial.title}
                onChange={(e) => setEditTutorial({ ...editTutorial, title: e.target.value })}
                placeholder="عنوان الشرح"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">الوصف</Label>
              <Textarea
                id="edit-description"
                value={editTutorial.description}
                onChange={(e) => setEditTutorial({ ...editTutorial, description: e.target.value })}
                placeholder="وصف الشرح"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-youtubeUrl">رابط يوتيوب *</Label>
              <Input
                id="edit-youtubeUrl"
                value={editTutorial.youtubeUrl}
                onChange={(e) => setEditTutorial({ ...editTutorial, youtubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label htmlFor="edit-thumbnailUrl">صورة مخصصة للفيديو (اختياري)</Label>
              <Input
                id="edit-thumbnailUrl"
                type="file"
                accept="image/*"
                onChange={handleEditThumbnailUpload}
                disabled={uploadingEditThumbnail}
                className="cursor-pointer"
              />
              {uploadingEditThumbnail && (
                <p className="text-sm text-blue-500 mt-2">جاري رفع الصورة...</p>
              )}
              {editThumbnailPreview && !uploadingEditThumbnail && (
                <div className="mt-2">
                  <img 
                    src={editThumbnailPreview} 
                    alt="معاينة الصورة" 
                    className="w-full h-32 object-cover rounded border border-gray-300"
                  />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                إذا لم تقم برفع صورة، سيتم استخدام الصورة الافتراضية من يوتيوب
              </p>
            </div>
            <div>
              <Label htmlFor="edit-category">التصنيف</Label>
              <Input
                id="edit-category"
                value={editTutorial.category}
                onChange={(e) => setEditTutorial({ ...editTutorial, category: e.target.value })}
                placeholder="التصنيف"
              />
            </div>
            <div>
              <Label htmlFor="edit-order">الترتيب</Label>
              <Input
                id="edit-order"
                type="number"
                value={editTutorial.order}
                onChange={(e) => setEditTutorial({ ...editTutorial, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={editTutorial.isActive}
                onChange={(e) => setEditTutorial({ ...editTutorial, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-isActive">نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateTutorial}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف الشرح "{selectedTutorial?.title}"؟ 
              <br />
              <span className="text-red-500">هذا الإجراء لا يمكن التراجع عنه.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteTutorial}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
