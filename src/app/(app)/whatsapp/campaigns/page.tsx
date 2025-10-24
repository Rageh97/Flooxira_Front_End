"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startWhatsAppCampaign } from "@/lib/api";
import { listTags, sendCampaignToTag } from "@/lib/tagsApi";

export default function WhatsAppCampaignsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Campaigns state
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  const [campaignTemplate, setCampaignTemplate] = useState<string>("");
  const [campaignThrottle, setCampaignThrottle] = useState<number>(5); // minutes
  const [campaignMedia, setCampaignMedia] = useState<File | null>(null);
  const [campaignScheduleAt, setCampaignScheduleAt] = useState<string>("");
  const [campaignDailyCap, setCampaignDailyCap] = useState<number | ''>('');
  const [campaignPerNumberDelay, setCampaignPerNumberDelay] = useState<number | ''>('');
  
  // Recurring campaign settings
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringInterval, setRecurringInterval] = useState<number>(8); // hours

  // Tag-based campaign
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | ''>('');
  const [tagCampaignTemplate, setTagCampaignTemplate] = useState<string>("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    // Load tags on mount
    (async () => {
      try {
        const res = await listTags();
        if (res.success) setTags(res.data || []);
      } catch {}
    })();
  }, []);

  async function handleStartCampaign() {
    if (!campaignFile || !campaignTemplate) {
      setError("يرجى رفع ملف Excel وتوفير نص المحتوى التسويقي");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const formData = new FormData();
      formData.append('file', campaignFile);
      formData.append('messageTemplate', campaignTemplate);
      formData.append('throttleMs', (campaignThrottle * 60 * 1000).toString()); // convert minutes to milliseconds
      if (campaignMedia) formData.append('media', campaignMedia);
      if (campaignScheduleAt) {
        formData.append('scheduleAt', campaignScheduleAt);
        formData.append('timezoneOffset', new Date().getTimezoneOffset().toString());
      }
      if (isRecurring) {
        formData.append('isRecurring', 'true');
        formData.append('recurringInterval', recurringInterval.toString());
      }
      if (campaignDailyCap) formData.append('dailyCap', campaignDailyCap.toString());
      if (campaignPerNumberDelay) formData.append('perNumberDelayMs', campaignPerNumberDelay.toString());

      const result = await startWhatsAppCampaign(token, formData);
      
      if (result.success) {
        setSuccess("تم بدء الحملة بنجاح!");
        setCampaignFile(null);
        setCampaignTemplate("مرحبا {{name}} …");
        setCampaignThrottle(5);
        setCampaignMedia(null);
        setCampaignScheduleAt("");
        setCampaignDailyCap('');
        setCampaignPerNumberDelay('');
        setIsRecurring(false);
        setRecurringInterval(8);
      } else {
        setError(result.message || "فشل في بدء الحملة");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendToTag() {
    if (!selectedTagId || !tagCampaignTemplate.trim()) {
      setError("يرجى اختيار تصنيف وإدخال نص المحتوى التسويقي");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await sendCampaignToTag({ tagId: Number(selectedTagId), messageTemplate: tagCampaignTemplate, throttleMs: campaignThrottle * 60 * 1000 });
      if (res.success) {
        setSuccess("تم بدء الحملة للتصنيف بنجاح!");
      } else {
        setError(res.message || "فشل في بدء حملة التصنيف");
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
        <CardHeader className="border-text-primary/50 text-white font-bold text-xl"> أدخل معلومات الحملة الاعلانية</CardHeader>
        <CardContent className="space-y-4">


       <div className="flex gap-5 w-full">
       <div className="flex flex-col gap-4 w-1/4">

<div>
  <label className="block text-sm font-medium mb-2 text-white">رفع ملف Excel للأرقام</label>
  <div className="relative">
  {/* input الحقيقي مخفي */}
  <input
    id="excelUpload"
    type="file"
    accept=".xlsx"
    className="hidden"
    onChange={(e) => setCampaignFile(e.target.files?.[0] || null)}
  />

  {/* label بديل بنفس شكل الانبوت */}
  <label
    htmlFor="excelUpload"
    className="bg-[#011910] rounded-md p-2 pl-12 text-white inner-shadow h-28 w-full flex items-center justify-center cursor-pointer relative"
  >
    <img
      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none"
      src="/folder.png"
      alt=""
    />
  </label>
</div>

</div>
<div>
  <label className="block text-sm font-medium mb-2 text-white">ارفع صورة او فيديو</label>
  <div className="relative">
  {/* input مخفي */}
  <input
    id="fileInput"
    type="file"
    accept="image/*,video/*"
    className="hidden"
    onChange={(e) => setCampaignMedia(e.target.files?.[0] || null)}
  />

  {/* زر مخصص لفتح نافذة الاختيار */}
  <label
    htmlFor="fileInput"
    className="bg-[#011910] rounded-md p-2 pl-12 text-white inner-shadow h-28 w-full flex items-center justify-center cursor-pointer relative"
  >
    <img
      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none"
      src="/img.gif"
      alt=""
    />
  </label>
</div>

</div>


      </div>


<div className="w-full ">
  <label className="block text-sm font-medium mb-2 text-white">نص المحتوى التسويقي</label>
  <textarea placeholder="اكتب نص المحتوى التسويقي" className="h-[268px] bg-[#011910] rounded-md p-2 text-white inner-shadow w-full px-3 py-4  outline-none  text-white rounded-md" rows={4} value={campaignTemplate} onChange={(e) => setCampaignTemplate(e.target.value)} />
  {/* <p className="text-xs text-gray-300 mt-1">استخدم placeholder {'{{name}}'}.</p> */}
</div>
       </div>

    <div className="flex w-full gap-4">
          <div className=" w-full">
            <label className="block text-sm font-medium mb-2 text-white">التحكم في السرعة (دقائق بين الرسائل)</label>
            <input min="1" max="100" type="number" className="bg-[#011910] rounded-md p-2 text-white inner-shadow w-full px-3 py-4  outline-none text-white rounded-md" value={campaignThrottle} onChange={(e) => setCampaignThrottle(parseInt(e.target.value || '1'))} />
          </div>


          <div className=" w-full">
           
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الجدولة (اختياري)</label>
              <input type="datetime-local" className="bg-[#011910] rounded-md p-2 text-white inner-shadow w-full px-3 py-4  outline-none text-white rounded-md" value={campaignScheduleAt} onChange={(e) => setCampaignScheduleAt(e.target.value)} />
            </div>
          </div>

          
            <div className=" w-full">
              <label className="block text-sm font-medium mb-2 text-white">الحد اليومي (أرقام/يوم، اختياري)</label>
              <input placeholder="أقصى عدد 100" min="1" max="100" type="number" className=" bg-[#011910] rounded-md  text-white inner-shadow w-full px-3 py-4  outline-none text-white rounded-md" value={campaignDailyCap} onChange={(e) => setCampaignDailyCap(e.target.value ? Number(e.target.value) : 1)} />
            </div>
            
            <div className="w-full">
              <label className="block text-sm font-medium mb-2 text-white">تأخير لكل رقم (بالدقيقة  اختياري)</label>
              <input placeholder="1" min="1" max="100" type="number" className=" bg-[#011910] rounded-md  text-white inner-shadow w-full px-3 py-4  outline-none text-white rounded-md" value={campaignPerNumberDelay} onChange={(e) => setCampaignPerNumberDelay(e.target.value ? Number(e.target.value) : 1)} />
            </div>
         


          </div> 


          <div className="flex items-center gap-4 w-full">
          <div className="w-50">
            <button className=" w-full h-18 primary-button text-white text-2xl font-bold" onClick={handleStartCampaign} disabled={loading || !campaignFile || !campaignTemplate}>بدء الحملة</button>

            </div>
         
          
              <div className="w-full flex gap-2 items-center justify-between">
              <label className="flex items-center gap-2 text-white">
              <input
                  type="checkbox" 
                  checked={isRecurring} 
                  onChange={(e) => setIsRecurring(e.target.checked)}
  className="
    appearance-none
    w-5 h-5
    border-2 border-gray-200
    rounded
    cursor-pointer
    checked:bg-green-500
    checked:border-green-500
    transition-colors duration-200
  "
/>

                <span className="text-sm font-medium">جدولة متكررة</span>
              </label>
              <div className="w-3/4">
                
            {isRecurring && (
              <div >
                <label className="  text-sm font-medium mb-2 text-white">تكرار كل (ساعات)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="168" 
                  className="bg-[#011910] rounded-md  text-white inner-shadow w-full px-3 py-2  outline-none text-white rounded-md" 
                  value={recurringInterval} 
                   onChange={(e) => setRecurringInterval(parseInt(e.target.value || '1'))}
                />
              </div>
            )}
          </div>
            </div>
          </div>
         
        </CardContent>
      </Card>



      <Card className="gradient-border border-none">
        <CardHeader className="border-text-primary/50 text-white font-bold text-xl"> حملة اعلانية لتصنيف محدد </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex  gap-4">


            <div className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">اختر التصنيف</label>
              <select
                  className="w-full appearance-none px-3 py-4 bg-[#011910] rounded-md text-white inner-shadow outline-none"
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value ? Number(e.target.value) : '')}
              >
                <option  value="">-- اختر تصنيف --</option>
                {tags.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
           
            <div>
            <label className="block text-sm font-medium mb-2 text-white">التحكم في السرعة (دقائق بين الرسائل)</label>
             <input placeholder="1" min="1" max="100" type="number" className="w-full px-3 py-4 bg-[#011910] rounded-md text-white inner-shadow outline-none" value={campaignThrottle} onChange={(e) => setCampaignThrottle(parseInt(e.target.value || '1'))} />
          </div>


            </div>

            <div className="w-full">
              <label className="block text-sm font-medium mb-2 text-white">نص المحتوى التسويقي</label>
               <textarea placeholder="اكتب نص المحتوى التسويقي" className="w-full px-3 py-4 bg-[#011910] rounded-md text-white inner-shadow outline-none" rows={4} value={tagCampaignTemplate} onChange={(e) => setTagCampaignTemplate(e.target.value)} />
            </div>


          </div>


        


          <button className="w-50 h-18 primary-button text-white text-2xl font-bold" onClick={handleSendToTag} disabled={loading || !selectedTagId || !tagCampaignTemplate.trim()}>بدء الحملة </button>
        </CardContent>
      </Card>
    </div>
  );
}