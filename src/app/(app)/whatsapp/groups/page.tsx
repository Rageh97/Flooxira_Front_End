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

      <Card className="gradient-border border-none">
        <CardHeader className="border-text-primary/50 text-white font-bold text-xl">حملة اعلانية للمجموعات </CardHeader>
        <CardContent className="space-y-4">
          {/* <div className="flex items-center gap-2">
          <span className="text-sm text-white">{groups.length} </span>
          </div> */}



          <div className="flex gap-4">


           <div className="w-full flex flex-col gap-4">
           <div>
              <label className="block text-sm font-medium mb-2 text-white">اختر المجموعة</label>
              <select
                className="w-full px-3 py-4 bg-[#011910] rounded-md text-white inner-shadow outline-none appearance-none"
                value={selectedGroupNames[0] || ""}
                onChange={(e) => setSelectedGroupNames(e.target.value ? [e.target.value] : [])}
              >
                <option value="">-- اختر مجموعة --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.name}>{g.name} ({g.participantsCount})</option>
                ))}
              </select>
            </div>

            
            <div className="flex flex-col mt-2.5">
  <label className="block text-sm font-medium mb-2 text-white">
    ارفع (صورة / فيديو)
  </label>

  <div className="relative ">
    <input
      id="file-upload"
      type="file"
      accept="image/*,video/*"
      onChange={(e) => setGroupMedia(e.target.files?.[0] || null)}
      className="hidden"
    />

    <label
      htmlFor="file-upload"
      className="cursor-pointer flex items-center justify-center bg-[#011910] rounded-md  inner-shadow px-4 py-2 text-sm font-medium  hover:text-white transition"
    >
      <img className="w-10 h-10" src="/img.gif" alt="" />
    </label>
  </div>
              </div>
           </div>



            <div className="w-full flex flex-col gap-4">

              <div>
                <label className="block text-sm font-medium mb-2 text-white">الرسالة</label>
                <textarea className="w-full h-15 px-3 py-2 bg-[#011910] rounded-md text-white inner-shadow outline-none" rows={3} placeholder="اكتب رسالتك التسويقية" value={groupMessage} onChange={(e) => setGroupMessage(e.target.value)} />
              </div>


              <div>
                <label className="block text-sm font-medium mb-2 text-white">الجدولة (اختياري)</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-3 py-4 bg-[#011910] rounded-md text-white inner-shadow outline-none" 
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
            <button className="w-50 h-18 primary-button text-white text-2xl font-bold" onClick={handleSendToGroup} disabled={loading || selectedGroupNames.length === 0 || (!groupMessage && !groupMedia)}>إرسال</button>
            <button className="w-50 primary-button text-white text-xl font-bold after:bg-red-800 before:bg-[#01191080]" onClick={handleExportGroupMembers} disabled={loading || selectedGroupNames.length === 0} variant="secondary">تصدير الأعضاء</button>
          </div>


        </CardContent>
      </Card>

    </div>
  );
}