"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  listWhatsAppGroups,
  sendToWhatsAppGroup,
  sendToWhatsAppGroupsBulk,
  exportGroupMembers,
  postWhatsAppStatus,
} from "@/lib/api";

export default function WhatsAppGroupsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Groups/Status state
  const [groups, setGroups] = useState<Array<{ id: string; name: string; participantsCount: number }>>([]);
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([]);
  const [groupMessage, setGroupMessage] = useState<string>("");
  const [groupMedia, setGroupMedia] = useState<File | null>(null);
  const [groupScheduleAt, setGroupScheduleAt] = useState<string>("");
  const [statusImage, setStatusImage] = useState<File | null>(null);
  const [statusCaption, setStatusCaption] = useState<string>("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      handleListGroups();
    }
  }, [token]);

  async function handleListGroups() {
    try {
      const res = await listWhatsAppGroups(token);
      if (res.success) setGroups(res.groups);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleSendToGroup() {
    if (selectedGroupNames.length === 0) {
      setError("يرجى اختيار مجموعة واحدة على الأقل");
      return;
    }
    if (!groupMessage && !groupMedia) {
      setError("يرجى تقديم رسالة أو وسائط");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const formData = new FormData();
      formData.append('groupNames', JSON.stringify(selectedGroupNames));
      if (groupMessage) formData.append('message', groupMessage);
      if (groupMedia) formData.append('media', groupMedia);
      if (groupScheduleAt) {
        formData.append('scheduleAt', groupScheduleAt);
        formData.append('timezoneOffset', new Date().getTimezoneOffset().toString());
      }

      const result = await sendToWhatsAppGroupsBulk(token, formData);
      
      if (result.success) {
        setSuccess(`تم إرسال الرسالة إلى ${selectedGroupNames.length} مجموعة بنجاح!`);
        setGroupMessage("");
        setGroupMedia(null);
        setGroupScheduleAt("");
        setSelectedGroupNames([]);
      } else {
        setError(result.message || "فشل في إرسال الرسالة");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportGroupMembers() {
    if (selectedGroupNames.length === 0) {
      setError("يرجى اختيار مجموعة واحدة على الأقل");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await exportGroupMembers(token, selectedGroupNames);
      
      if (result.success) {
        setSuccess("تم تصدير أعضاء المجموعة بنجاح!");
      } else {
        setError(result.message || "فشل في تصدير أعضاء المجموعة");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostStatus() {
    if (!statusImage) {
      setError("يرجى اختيار صورة");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const formData = new FormData();
      formData.append('image', statusImage);
      if (statusCaption) formData.append('caption', statusCaption);

      const result = await postWhatsAppStatus(token, formData);
      
      if (result.success) {
        setSuccess("تم نشر الحالة بنجاح!");
        setStatusImage(null);
        setStatusCaption("");
      } else {
        setError(result.message || "فشل في نشر الحالة");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="rounded-md p-4 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md p-4 bg-green-50 text-green-700">
          {success}
        </div>
      )}

      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">المجموعات</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={handleListGroups} variant="secondary" disabled={loading}>تحديث</Button>
            <span className="text-sm text-white">{groups.length} مجموعة</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">اختر المجموعات</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-text-primary rounded-md p-2">
                <div className="flex items-center gap-2">
                  <input className="" type="checkbox" checked={selectedGroupNames.length === groups.length && groups.length > 0} onChange={(e) => setSelectedGroupNames(e.target.checked ? groups.map(g => g.name) : [])} />
                  <span className="text-sm text-white ">اختر الكل</span>
                </div>
                {groups.map(g => (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedGroupNames.includes(g.name)}
                      onChange={(e) => {
                        const next = new Set(selectedGroupNames);
                        if (e.target.checked) next.add(g.name); else next.delete(g.name);
                        setSelectedGroupNames(Array.from(next));
                      }}
                    />
                    <span className="text-white">{g.name} ({g.participantsCount})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">الرسالة</label>
                <textarea className="w-full px-3 py-2 border border-text-primary outline-none rounded-md bg-gray-700/30 text-white placeholder-white" rows={3} placeholder="اكتب رسالتك... (اختياري إذا تم إرفاق وسائط)" value={groupMessage} onChange={(e) => setGroupMessage(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">الوسائط (صورة/فيديو)</label>
                <input className="text-orange-500" type="file" accept="image/*,video/*" onChange={(e) => setGroupMedia(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">الجدولة (اختياري)</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-3 py-2 border border-text-primary outline-none rounded-md bg-gray-700/30 text-white" 
                  value={groupScheduleAt} 
                  onChange={(e) => {
                    const value = e.target.value;
                    // Get user's timezone offset
                    const timezoneOffset = new Date().getTimezoneOffset();
                    console.log('User timezone offset:', timezoneOffset, 'minutes');
                    console.log('Selected time:', value);
                    setGroupScheduleAt(value);
                  }} 
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSendToGroup} disabled={loading || selectedGroupNames.length === 0 || (!groupMessage && !groupMedia)}>إرسال</Button>
            <Button onClick={handleExportGroupMembers} disabled={loading || selectedGroupNames.length === 0} variant="secondary">تصدير الأعضاء</Button>
          </div>
        </CardContent>
      </Card>

      {/* <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">نشر الحالة</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الصورة</label>
              <input className="text-white" type="file" accept="image/*" onChange={(e) => setStatusImage(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">التعليق</label>
              <input className="w-full px-3 py-2 border border-text-primary outline-none rounded-md bg-gray-700/30 text-white placeholder-white" placeholder="اكتب تعليقاً..." value={statusCaption} onChange={(e) => setStatusCaption(e.target.value)} />
            </div>
          </div>
          <Button onClick={handlePostStatus} disabled={loading || !statusImage}>نشر الحالة</Button>
        </CardContent>
      </Card> */}
    </div>
  );
}