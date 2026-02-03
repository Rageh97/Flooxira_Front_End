"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile, changePassword } from "@/lib/api";
import { Camera, Save, Lock, Mail, User as UserIcon, Phone } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import Image from "next/image";

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      // Load user avatar from user object or localStorage or use default
      if (user.avatar) {
        setUserAvatar(user.avatar);
        setAvatarPreview(user.avatar);
      } else {
        const storedAvatar = typeof window !== 'undefined' ? localStorage.getItem(`user_avatar_${user.id}`) : null;
        if (storedAvatar) {
          setUserAvatar(storedAvatar);
          setAvatarPreview(storedAvatar);
        }
      }
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('خطأ', 'حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('خطأ', 'يرجى اختيار صورة فقط');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token') || '';
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (formData.phone) {
        formDataToSend.append('phone', formData.phone);
      }
      
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      const result = await updateProfile(token, formDataToSend);
      
      if (result.success) {
        showSuccess('نجح', 'تم تحديث الملف الشخصي بنجاح');
        
        // Update user avatar from response if available (Bunny CDN URL)
        if (result.user?.avatar) {
          setUserAvatar(result.user.avatar);
          setAvatarPreview(result.user.avatar);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`user_avatar_${user.id}`, result.user.avatar);
          }
        }
        
        // Refresh user data
        await refreshUser();
        
        // Clear avatar file after successful upload
        setAvatarFile(null);
      } else {
        showError('خطأ', result.message || 'فشل تحديث الملف الشخصي');
      }
    } catch (error: any) {
      showError('خطأ', error.message || 'حدث خطأ أثناء تحديث الملف الشخصي');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setSavingPassword(true);

    try {
      const token = localStorage.getItem('auth_token') || '';
      const result = await changePassword(token, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (result.success) {
        showSuccess('نجح', 'تم تغيير كلمة المرور بنجاح');
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showError('خطأ', result.message || 'فشل تغيير كلمة المرور');
      }
    } catch (error: any) {
      showError('خطأ', error.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">يجب تسجيل الدخول أولاً</p>
      </div>
    );
  }

  const displayAvatar = avatarPreview || userAvatar || "/user.gif";

  return (
    <div className="mx-auto p-2  space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">الملف الشخصي</h1>
        <p className="text-gray-400">إدارة معلومات حسابك وكلمة المرور</p>
      </div>

      {/* Profile Picture Section */}
      <Card className="gradient-border border-none">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            الصورة الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/50 bg-gray-800">
                {displayAvatar.startsWith('http') || displayAvatar.startsWith('data:') ? (
                  <img
                    src={displayAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={displayAvatar}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized={displayAvatar.startsWith('/uploads/')}
                  />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary/80 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg"
              >
                <Camera className="w-5 h-5" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div className="flex-1 text-center md:text-right">
              <p className="text-gray-300 text-sm mb-2">
                انقر على أيقونة الكاميرا لرفع صورة شخصية جديدة
              </p>
              <p className="text-yellow-300 text-xs">
                الحد الأقصى لحجم الصورة: 5 ميجابايت
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="gradient-border border-none">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            المعلومات الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              الاسم
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-fixed-40 border-primary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary "
              placeholder="أدخل اسمك"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-fixed-40 border-primary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary "
              placeholder="أدخل بريدك الإلكتروني"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              رقم الهاتف
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-fixed-40 border-primary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary "
              placeholder="أدخل رقم هاتفك"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="primary-button w-full md:w-auto"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                 <div className="flex items-center gap-2">
                 <Save className="w-4 h-4 mr-2" />
                 <p> حفظ التغييرات</p>
                 </div>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="gradient-border border-none">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              كلمة المرور الحالية
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 bg-fixed-40 border-primary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary "
              placeholder="أدخل كلمة المرور الحالية"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 bg-fixed-40 border-primary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary "
              placeholder="أدخل كلمة المرور الجديدة"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              تأكيد كلمة المرور الجديدة
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 bg-fixed-40 border-primary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary "
              placeholder="أعد إدخال كلمة المرور الجديدة"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="primary-button w-full md:w-auto"
            >
              {savingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري التغيير...
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                 <Lock className="w-4 h-4 mr-2" />
                 <p> تغيير كلمة المرور</p>
                 </div>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

