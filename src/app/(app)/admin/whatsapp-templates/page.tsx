"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSubscriptionReminderTemplates, updateSubscriptionReminderTemplate, uploadReminderMedia, getConnectedWhatsAppUsers } from "@/lib/api";
import { toast } from "sonner";
import { MessageSquare, Clock, AlertTriangle, CheckCircle2, Save, Image as ImageIcon, Video, Loader2, ChevronUp, ChevronDown, Upload, X, Users, UserCheck, UserMinus, RefreshCw } from "lucide-react";

type Template = {
  id: number;
  type: '3_days_before' | '1_day_before' | 'after_expiry';
  message: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'none';
  isActive: boolean;
  scheduledHour: number;
  scheduledMinute?: number;
};

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [openTimePicker, setOpenTimePicker] = useState<number | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState<number | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  const fetchConnectedUsers = async () => {
    setFetchingUsers(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await getConnectedWhatsAppUsers(token);
      if (res.success) {
        setConnectedUsers(res.users);
      }
    } catch (error: any) {
      console.error("Failed to fetch connected users:", error);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem("auth_token") || "";
        const res = await getSubscriptionReminderTemplates(token);
        if (res.success) {
          setTemplates(res.data);
        }
      } catch (error: any) {
        toast.error("فشل في تحميل القوالب: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
    fetchConnectedUsers();
  }, []);

  const handleUpdate = async (id: number) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    setSavingId(id);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await updateSubscriptionReminderTemplate(token, id, {
        message: template.message,
        mediaUrl: template.mediaUrl,
        mediaType: template.mediaType,
        isActive: template.isActive,
        scheduledHour: template.scheduledHour,
        scheduledMinute: template.scheduledMinute
      });

      if (res.success) {
        toast.success("تم التحديث بنجاح");
      }
    } catch (error: any) {
      toast.error("فشل التحديث: " + error.message);
    } finally {
      setSavingId(null);
    }
  };

  const updateLocalTemplate = (id: number, updates: Partial<Template>) => {
    console.log('🔄 تحديث القالب المحلي:', { id, updates });
    setTemplates(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      console.log('📋 القوالب بعد التحديث:', updated.find(t => t.id === id));
      return updated;
    });
  };

  const handleMediaUpload = async (templateId: number, file: File) => {
    setUploadingMedia(templateId);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const response = await uploadReminderMedia(token, file);
      
      if (response.success) {
        updateLocalTemplate(templateId, { 
          mediaUrl: response.url,
          mediaType: response.mediaType as 'image' | 'video'
        });
        toast.success("تم رفع الملف بنجاح");
      }
    } catch (error: any) {
      toast.error("فشل رفع الملف: " + error.message);
    } finally {
      setUploadingMedia(null);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case '3_days_before': return <Clock className="w-6 h-6 text-blue-400" />;
      case '1_day_before': return <AlertTriangle className="w-6 h-6 text-orange-400" />;
      case 'after_expiry': return <CheckCircle2 className="w-6 h-6 text-red-400" />;
      default: return <MessageSquare className="w-6 h-6 text-primary" />;
    }
  };

  const getTemplateTitle = (type: string) => {
    switch (type) {
      case '3_days_before': return "قبل الانتهاء بـ 3 أيام";
      case '1_day_before': return "قبل الانتهاء بيوم واحد";
      case 'after_expiry': return "بعد انتهاء الاشتراك";
      default: return "قالب رسالة";
    }
  };

  const TimePickerDropdown = ({ template }: { template: Template }) => {
    const [tempHour, setTempHour] = useState(template.scheduledHour ?? 10);
    const [tempMinute, setTempMinute] = useState(template.scheduledMinute ?? 0);
    const [isPM, setIsPM] = useState((template.scheduledHour ?? 10) >= 12);
    const [saving, setSaving] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // تحديث القيم المؤقتة عند تغيير القالب
    useEffect(() => {
      const hour = template.scheduledHour ?? 10;
      setTempHour(hour);
      setTempMinute(template.scheduledMinute ?? 0);
      setIsPM(hour >= 12);
    }, [template.scheduledHour, template.scheduledMinute]);

    // تحويل من 24 ساعة إلى 12 ساعة للعرض
    const displayHour = tempHour === 0 ? 12 : tempHour > 12 ? tempHour - 12 : tempHour;
    
    const incrementHour = () => {
      setTempHour((h) => {
        const newHour = (h + 1) % 24;
        setIsPM(newHour >= 12);
        return newHour;
      });
    };
    
    const decrementHour = () => {
      setTempHour((h) => {
        const newHour = (h - 1 + 24) % 24;
        setIsPM(newHour >= 12);
        return newHour;
      });
    };
    
    const toggleAMPM = () => {
      setIsPM(!isPM);
      setTempHour((h) => {
        if (isPM) {
          // تحويل من PM إلى AM
          return h >= 12 ? h - 12 : h;
        } else {
          // تحويل من AM إلى PM
          return h < 12 ? h + 12 : h;
        }
      });
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
          setOpenTimePicker(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const handleConfirm = async () => {
      console.log('🔵 بدء الحفظ:', { templateId: template.id, tempHour, tempMinute });
      setSaving(true);
      try {
        const token = localStorage.getItem("auth_token") || "";
        const payload = {
          message: template.message,
          mediaUrl: template.mediaUrl,
          mediaType: template.mediaType,
          isActive: template.isActive,
          scheduledHour: tempHour,
          scheduledMinute: tempMinute
        };
        console.log('📤 إرسال البيانات:', payload);
        
        const response = await updateSubscriptionReminderTemplate(token, template.id, payload);
        console.log('📥 الاستجابة:', response);
        
        if (response.success) {
          // تحديث القالب المحلي بالقيم الجديدة
          updateLocalTemplate(template.id, { 
            scheduledHour: tempHour, 
            scheduledMinute: tempMinute 
          });
          console.log('✅ تم التحديث المحلي');
          toast.success(`✅ تم حفظ الوقت: ${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`);
          setOpenTimePicker(null);
        }
      } catch (error: any) {
        console.error('❌ خطأ في الحفظ:', error);
        toast.error("فشل حفظ الوقت: " + error.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div 
        ref={pickerRef}
        className="absolute top-full left-0 mt-2 bg-card border border-white/20 rounded-lg shadow-2xl z-50 p-3 w-64 animate-in slide-in-from-top-2 duration-200"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={incrementHour}
              className="hover:bg-primary/20 text-white h-6 w-6 p-0"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <div className="text-2xl font-bold text-white my-1 w-12 text-center">
              {String(displayHour).padStart(2, '0')}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={decrementHour}
              className="hover:bg-primary/20 text-white h-6 w-6 p-0"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>

          <div className="text-2xl font-bold text-primary">:</div>

          <div className="flex flex-col items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTempMinute((m) => (m + 1) % 60)}
              className="hover:bg-primary/20 text-white h-6 w-6 p-0"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <div className="text-2xl font-bold text-white my-1 w-12 text-center">
              {String(tempMinute).padStart(2, '0')}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTempMinute((m) => (m - 1 + 60) % 60)}
              className="hover:bg-primary/20 text-white h-6 w-6 p-0"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleAMPM}
              className="hover:bg-primary/20 text-white h-14 w-12 p-0"
            >
              <div className="text-sm font-bold">{isPM ? 'PM' : 'AM'}</div>
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 bg-primary hover:bg-primary/90 text-white h-8 text-xs"
          >
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin ml-1" />
                حفظ...
              </>
            ) : (
              'حفظ'
            )}
          </Button>
          <Button
            onClick={() => setOpenTimePicker(null)}
            variant="ghost"
            disabled={saving}
            className="flex-1 text-gray-300 hover:bg-white/10 h-8 text-xs"
          >
            إلغاء
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className=" mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">إدارة الواتساب والقوالب</h1>
        <p className="text-primary text-lg">مراقبة الجلسات وإدارة رسائل التذكير التلقائية</p>
      </div>

      {/* Connected Users Section */}
      <Card className="gradient-border overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">حالات اتصال المستخدمين</CardTitle>
              <CardDescription className="text-gray-400">المستخدمين المسجلين وحالة اتصال البوت الخاص بهم</CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchConnectedUsers} 
            disabled={fetchingUsers}
            className="border-white/10 text-white hover:bg-white/5"
          >
            {fetchingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            تحديث
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-xs border-b border-white/5">
                  <th className="px-6 py-4 font-medium">المستخدم</th>
                  <th className="px-6 py-4 font-medium">معلومات التواصل</th>
                  <th className="px-6 py-4 font-medium text-center">الاسم في واتساب</th>
                  <th className="px-6 py-4 font-medium text-center">استهلاك AI</th>
                  <th className="px-6 py-4 font-medium text-center">حالة الاتصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {connectedUsers.length === 0 && !fetchingUsers && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">لا يوجد مستخدمين متاحين</td>
                  </tr>
                )}
                {connectedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{user.name}</div>
                          <div className="text-[10px] text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.phone || 'بدون رقم'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-300 font-mono">{user.whatsappName || '---'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-xs font-bold">
                        {user.aiCreditsUsed || 0} كريديت
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {user.status === 'connected' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs">
                            <UserCheck className="w-3 h-3" />
                            متصل الآن
                          </div>
                        ) : user.status === 'initializing' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            جاري الاتصال...
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                            <UserMinus className="w-3 h-3" />
                            غير متصل
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">قوالب التذكير التلقائية</h2>
        <div className="h-px bg-white/10 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-8">
        {templates.map((template) => (
          <Card key={template.id} className="gradient-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-fixed-40 border border-white/10">
                  {getTemplateIcon(template.type)}
                </div>
                <div>
                  <CardTitle className="text-xl text-white">{getTemplateTitle(template.type)}</CardTitle>
                  <CardDescription className="text-primary">تنبيه تلقائي يتم إرساله للمشترك</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{template.isActive ? 'مفعل' : 'معطل'}</span>
                  <Switch 
                    checked={template.isActive}
                    onCheckedChange={(checked) => updateLocalTemplate(template.id, { isActive: checked })}
                  />
                </div>
                <Button 
                  onClick={() => handleUpdate(template.id)}
                  disabled={savingId === template.id}
                  className="primary-button "
                >
                 <div className="flex items-center gap-2">
                  <div>
                   {savingId === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                 </div>
                 <p>حفظ التعديلات</p>
                 </div>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Message Content */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    محتوى الرسالة
                  </label>
                  <Textarea 
                    value={template.message}
                    onChange={(e) => updateLocalTemplate(template.id, { message: e.target.value })}
                    placeholder="اكتب نص الرسالة هنا..."
                    className="min-h-[200px]  text-white focus:ring-primary/50 resize-none font-sans leading-relaxed"
                  />
                  {/* <p className="text-xs text-muted-foreground flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    يمكنك استخدام المتغيرات مثل {"{name}"} لذكر اسم العميل تلقائياً.
                  </p> */}
                </div>
                {/* Right Column: Schedule & Media */}
                <div className="space-y-6">
                  {/* Schedule Time */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                       <Clock className="w-4 h-4" />
                       وقت الإرسال
                    </label>
                    <div className="relative">
                      <Button
                        type="button"
                        onClick={() => setOpenTimePicker(openTimePicker === template.id ? null : template.id)}
                        className="w-full h-12 bg-background/50 border border-white/10 hover:border-primary/50 text-white text-2xl font-bold justify-center"
                      >
                        <Clock className="w-5 h-5 ml-2 text-primary" />
                        {(() => {
                          const hour = template.scheduledHour ?? 10;
                          const minute = template.scheduledMinute ?? 0;
                          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          const period = hour >= 12 ? 'PM' : 'AM';
                          return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
                        })()}
                      </Button>
                      {openTimePicker === template.id && <TimePickerDropdown template={template} />}
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs text-primary flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        سيتم حفظ الوقت تلقائياً عند الضغط على "تأكيد وحفظ"
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        سيتم التحقق من الاشتراكات وإرسال هذا القالب يومياً في التوقيت المحدد.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      نوع الوسائط
                    </label>
                    <Select 
                      value={template.mediaType} 
                      onValueChange={(val: any) => updateLocalTemplate(template.id, { mediaType: val })}
                    >
                      <SelectTrigger className=" text-white">
                        <SelectValue placeholder="اختر نوع الوسائط" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white">
                        <SelectItem value="none">بدون وسائط</SelectItem>
                        <SelectItem value="image">صورة</SelectItem>
                        <SelectItem value="video">فيديو</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {template.mediaType !== 'none' && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        {template.mediaType === 'image' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        {template.mediaType === 'image' ? 'الصورة' : 'الفيديو'}
                      </label>
                      
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept={template.mediaType === 'image' ? 'image/*' : 'video/*'}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleMediaUpload(template.id, file);
                            }
                          }}
                          disabled={uploadingMedia === template.id}
                          className="hidden"
                          id={`media-upload-${template.id}`}
                        />
                        <label
                          htmlFor={`media-upload-${template.id}`}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-white/10 bg-background/50 text-white cursor-pointer hover:bg-white/5 transition-colors ${uploadingMedia === template.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {uploadingMedia === template.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              جاري الرفع...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              رفع {template.mediaType === 'image' ? 'صورة' : 'فيديو'}
                            </>
                          )}
                        </label>
                        
                        {template.mediaUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateLocalTemplate(template.id, { mediaUrl: '' })}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {template.mediaUrl && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-video flex items-center justify-center relative group">
                          {template.mediaType === 'image' ? (
                            <img src={template.mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                          ) : (
                            <video src={template.mediaUrl} controls className="w-full h-full object-contain" />
                          )}
                          <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                            معاينة
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
