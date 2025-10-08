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
  const [campaignThrottle, setCampaignThrottle] = useState<number>(3000);
  const [campaignMedia, setCampaignMedia] = useState<File | null>(null);
  const [campaignScheduleAt, setCampaignScheduleAt] = useState<string>("");
  const [campaignDailyCap, setCampaignDailyCap] = useState<number | ''>('');
  const [campaignPerNumberDelay, setCampaignPerNumberDelay] = useState<number | ''>('');

  // Tag-based campaign
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | ''>('');

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
      setError("يرجى رفع ملف Excel وتوفير قالب الرسالة");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const formData = new FormData();
      formData.append('file', campaignFile);
      formData.append('messageTemplate', campaignTemplate);
      formData.append('throttleMs', campaignThrottle.toString());
      if (campaignMedia) formData.append('media', campaignMedia);
      if (campaignScheduleAt) {
        formData.append('scheduleAt', campaignScheduleAt);
        formData.append('timezoneOffset', new Date().getTimezoneOffset().toString());
      }
      if (campaignDailyCap) formData.append('dailyCap', campaignDailyCap.toString());
      if (campaignPerNumberDelay) formData.append('perNumberDelayMs', campaignPerNumberDelay.toString());

      const result = await startWhatsAppCampaign(token, formData);
      
      if (result.success) {
        setSuccess("تم بدء الحملة بنجاح!");
        setCampaignFile(null);
        setCampaignTemplate("مرحبا {{name}} …");
        setCampaignThrottle(3000);
        setCampaignMedia(null);
        setCampaignScheduleAt("");
        setCampaignDailyCap('');
        setCampaignPerNumberDelay('');
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
    if (!selectedTagId || !campaignTemplate.trim()) {
      setError("يرجى اختيار تصنيف وإدخال قالب الرسالة");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await sendCampaignToTag({ tagId: Number(selectedTagId), messageTemplate: campaignTemplate, throttleMs: campaignThrottle });
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

      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">بدء الحملة</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">رفع ملف Excel (أعمدة: هاتف، اسم، رسالة)</label>
              <input type="file" accept=".xlsx" onChange={(e) => setCampaignFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">قالب الرسالة</label>
              <textarea className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" rows={4} value={campaignTemplate} onChange={(e) => setCampaignTemplate(e.target.value)} />
              {/* <p className="text-xs text-gray-300 mt-1">استخدم placeholder {'{{name}}'}.</p> */}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">التحكم في السرعة (ملي ثانية بين الرسائل)</label>
            <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignThrottle} onChange={(e) => setCampaignThrottle(parseInt(e.target.value || '3000'))} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الوسائط (صورة/فيديو، اختياري)</label>
              <input type="file" accept="image/*,video/*" onChange={(e) => setCampaignMedia(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الجدولة (اختياري)</label>
              <input type="datetime-local" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignScheduleAt} onChange={(e) => setCampaignScheduleAt(e.target.value)} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الحد اليومي (أرقام/يوم، اختياري)</label>
              <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignDailyCap} onChange={(e) => setCampaignDailyCap(e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">تأخير لكل رقم (ملي ثانية، اختياري)</label>
              <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignPerNumberDelay} onChange={(e) => setCampaignPerNumberDelay(e.target.value ? Number(e.target.value) : '')} />
            </div>
          </div>
          <Button onClick={handleStartCampaign} disabled={loading || !campaignFile || !campaignTemplate}>بدء الحملة</Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">بدء الحملة للتصنيف</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">اختر التصنيف</label>
              <select
                className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md"
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- اختر تصنيف --</option>
                {tags.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">قالب الرسالة</label>
              <textarea className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" rows={4} value={campaignTemplate} onChange={(e) => setCampaignTemplate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">التحكم في السرعة (ملي ثانية بين الرسائل)</label>
            <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignThrottle} onChange={(e) => setCampaignThrottle(parseInt(e.target.value || '3000'))} />
          </div>
          <Button onClick={handleSendToTag} disabled={loading || !selectedTagId || !campaignTemplate.trim()}>إرسال </Button>
        </CardContent>
      </Card>
    </div>
  );
}