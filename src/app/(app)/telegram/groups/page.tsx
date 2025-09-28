"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  listTelegramGroups,
  sendToTelegramGroup,
  sendToTelegramGroupsBulk,
} from "@/lib/api";

export default function TelegramGroupsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Groups state
  const [groups, setGroups] = useState<Array<{ id: string; name: string; type: string; messageCount: number }>>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [groupMessage, setGroupMessage] = useState<string>("");
  const [groupMedia, setGroupMedia] = useState<File | null>(null);
  const [groupScheduleAt, setGroupScheduleAt] = useState<string>("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      handleListGroups();
    }
  }, [token]);

  async function handleListGroups() {
    try {
      const res = await listTelegramGroups(token);
      if (res.success) setGroups(res.groups);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleSendToGroup() {
    if (selectedGroupIds.length === 0) {
      setError("Please select at least one group");
      return;
    }
    if (!groupMessage && !groupMedia) {
      setError("Please provide a message or media");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const formData = new FormData();
      formData.append('groupIds', JSON.stringify(selectedGroupIds));
      if (groupMessage) formData.append('message', groupMessage);
      if (groupMedia) formData.append('media', groupMedia);
      if (groupScheduleAt) {
        formData.append('scheduleAt', groupScheduleAt);
        formData.append('timezoneOffset', new Date().getTimezoneOffset().toString());
      }

      const result = await sendToTelegramGroupsBulk(token, formData);
      
      if (result.success) {
        setSuccess(`Message sent to ${selectedGroupIds.length} groups successfully!`);
        setGroupMessage("");
        setGroupMedia(null);
        setGroupScheduleAt("");
        setSelectedGroupIds([]);
      } else {
        setError(result.message || "Failed to send message");
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
        <CardHeader className="border-text-primary/50 text-primary">Groups</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={handleListGroups} variant="secondary" disabled={loading}>Refresh</Button>
            <span className="text-sm text-white">{groups.length} groups</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Select Groups</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-text-primary rounded-md p-2">
                <div className="flex items-center gap-2">
                  <input className="" type="checkbox" checked={selectedGroupIds.length === groups.length && groups.length > 0} onChange={(e) => setSelectedGroupIds(e.target.checked ? groups.map(g => g.id) : [])} />
                  <span className="text-sm text-white ">Select All</span>
                </div>
                {groups.map(g => (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(g.id)}
                      onChange={(e) => {
                        const next = new Set(selectedGroupIds);
                        if (e.target.checked) next.add(g.id); else next.delete(g.id);
                        setSelectedGroupIds(Array.from(next));
                      }}
                    />
                    <span className="text-white">{g.name} ({g.type})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Message</label>
                <textarea className="w-full px-3 py-2 border border-text-primary outline-none rounded-md bg-gray-700/30 text-white" rows={3} placeholder="Type your message... (optional if media attached)" value={groupMessage} onChange={(e) => setGroupMessage(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Media (image/video)</label>
                <input className="text-orange-500" type="file" accept="image/*,video/*" onChange={(e) => setGroupMedia(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Schedule (optional)</label>
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
            <Button onClick={handleSendToGroup} disabled={loading || selectedGroupIds.length === 0 || (!groupMessage && !groupMedia)}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}