"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startWhatsAppCampaign } from "@/lib/api";

export default function WhatsAppCampaignsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Campaigns state
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  const [campaignTemplate, setCampaignTemplate] = useState<string>("مرحبا {{name}} …");
  const [campaignThrottle, setCampaignThrottle] = useState<number>(3000);
  const [campaignMedia, setCampaignMedia] = useState<File | null>(null);
  const [campaignScheduleAt, setCampaignScheduleAt] = useState<string>("");
  const [campaignDailyCap, setCampaignDailyCap] = useState<number | ''>('');
  const [campaignPerNumberDelay, setCampaignPerNumberDelay] = useState<number | ''>('');

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  async function handleStartCampaign() {
    if (!campaignFile || !campaignTemplate) {
      setError("Please upload Excel file and provide message template");
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
        setSuccess("Campaign started successfully!");
        setCampaignFile(null);
        setCampaignTemplate("مرحبا {{name}} …");
        setCampaignThrottle(3000);
        setCampaignMedia(null);
        setCampaignScheduleAt("");
        setCampaignDailyCap('');
        setCampaignPerNumberDelay('');
      } else {
        setError(result.message || "Failed to start campaign");
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
        <CardHeader className="border-text-primary/50 text-primary">Start Campaign</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Upload Excel (columns: phone, name, message)</label>
              <input type="file" accept=".xlsx" onChange={(e) => setCampaignFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Message Template</label>
              <textarea className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" rows={4} value={campaignTemplate} onChange={(e) => setCampaignTemplate(e.target.value)} />
              <p className="text-xs text-gray-300 mt-1">Use {'{{name}}'} placeholder.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Throttle (ms between messages)</label>
            <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignThrottle} onChange={(e) => setCampaignThrottle(parseInt(e.target.value || '3000'))} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Media (image/video, optional)</label>
              <input type="file" accept="image/*,video/*" onChange={(e) => setCampaignMedia(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Schedule (optional)</label>
              <input type="datetime-local" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignScheduleAt} onChange={(e) => setCampaignScheduleAt(e.target.value)} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Daily cap (numbers/day, optional)</label>
              <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignDailyCap} onChange={(e) => setCampaignDailyCap(e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Per-number delay (ms, optional)</label>
              <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignPerNumberDelay} onChange={(e) => setCampaignPerNumberDelay(e.target.value ? Number(e.target.value) : '')} />
            </div>
          </div>
          <Button onClick={handleStartCampaign} disabled={loading || !campaignFile || !campaignTemplate}>Start Campaign</Button>
        </CardContent>
      </Card>
    </div>
  );
}