"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getWhatsAppStatus, 
  uploadKnowledgeBase, 
  getKnowledgeBase, 
  deleteKnowledgeEntry,
  sendWhatsAppMessage,
  startWhatsAppSession,
  getWhatsAppQRCode,
  stopWhatsAppSession,
  getChatHistory,
  getChatContacts,
  getBotStats,
  listWhatsAppGroups,
  sendToWhatsAppGroup,
  sendToWhatsAppGroupsBulk,
  exportGroupMembers,
  postWhatsAppStatus,
  startWhatsAppCampaign,
  API_URL,
  adminListAgents,
  adminListChats,
  adminAssignChat,
  getMonthlySchedules,
  updateWhatsAppSchedule,
  deleteWhatsAppSchedule,
  updatePlatformPostSchedule,
  deletePlatformPostSchedule
} from "@/lib/api";

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<'connection' | 'bot' | 'chats' | 'stats' | 'groups' | 'campaigns' | 'schedules' | 'admin'>('connection');
  const [status, setStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [knowledgeEntries, setKnowledgeEntries] = useState<Array<{ id: number; keyword: string; answer: string; isActive: boolean }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");
  
  // Chat management state
  const [chats, setChats] = useState<Array<{ id: number; contactNumber: string; messageType: 'incoming' | 'outgoing'; messageContent: string; responseSource: string; knowledgeBaseMatch: string | null; timestamp: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ contactNumber: string; messageCount: number; lastMessageTime: string }>>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [botStats, setBotStats] = useState<any>(null);

  // Groups/Status state
  const [groups, setGroups] = useState<Array<{ id: string; name: string; participantsCount: number }>>([]);
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([]);
  const [groupMessage, setGroupMessage] = useState<string>("");
  const [groupMedia, setGroupMedia] = useState<File | null>(null);
  const [groupScheduleAt, setGroupScheduleAt] = useState<string>("");
  const [statusImage, setStatusImage] = useState<File | null>(null);
  const [statusCaption, setStatusCaption] = useState<string>("");

  // Campaigns state
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  const [campaignTemplate, setCampaignTemplate] = useState<string>("مرحبا {{name}} …");
  const [campaignThrottle, setCampaignThrottle] = useState<number>(3000);
  const [campaignMedia, setCampaignMedia] = useState<File | null>(null);
  const [campaignScheduleAt, setCampaignScheduleAt] = useState<string>("");
  const [campaignDailyCap, setCampaignDailyCap] = useState<number | ''>('');
  const [campaignPerNumberDelay, setCampaignPerNumberDelay] = useState<number | ''>('');

  // Admin state
  const [adminAgents, setAdminAgents] = useState<Array<{ id: number; name?: string; email: string }>>([]);
  const [adminChats, setAdminChats] = useState<any[]>([]);
  const [adminFilterContact, setAdminFilterContact] = useState<string>("");
  const [adminSelectedAssignee, setAdminSelectedAssignee] = useState<number | undefined>(undefined);

  // Schedules state
  const today = new Date();
  const [schedYear, setSchedYear] = useState<number>(today.getFullYear());
  const [schedMonth, setSchedMonth] = useState<number>(today.getMonth() + 1);
  const [monthlySchedules, setMonthlySchedules] = useState<{ whatsapp: any[]; posts: any[] }>({ whatsapp: [], posts: [] });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayItems, setDayItems] = useState<any[]>([]);
  const [showSchedModal, setShowSchedModal] = useState<boolean>(false);


  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      checkStatus();
      loadKnowledgeBase();
      loadBotStats();
    }
  }, [token]);

  // Auto-refresh QR code and status
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        checkStatus();
        // Always try to refresh QR while not connected
        if (!status || status?.status !== 'CONNECTED') refreshQRCode();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [token, status?.status]);

  // Load chat data when switching to chats tab
  useEffect(() => {
    if (activeTab === 'chats' && token) {
      loadChatContacts();
      if (selectedContact) {
        loadChatHistory(selectedContact);
      }
    }
  }, [activeTab, token, selectedContact]);

  // Load groups on groups tab
  useEffect(() => {
    if (activeTab === 'groups' && token) {
      handleListGroups();
    }
  }, [activeTab, token]);

  // Load admin data on admin tab
  useEffect(() => {
    if (activeTab === 'admin' && token) {
      handleAdminLoad();
    }
  }, [activeTab, token]);

  // Load schedules on schedules tab
  useEffect(() => {
    if (activeTab === 'schedules' && token) {
      loadMonthlySchedules(schedYear, schedMonth);
    }
  }, [activeTab, token, schedYear, schedMonth]);

  async function checkStatus() {
    try {
      const statusData = await getWhatsAppStatus(token);
      setStatus(statusData);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function refreshQRCode() {
    try {
      const qrData = await getWhatsAppQRCode(token);
      if (qrData.success && qrData.qrCode) {
        setQrCode(qrData.qrCode);
      }
    } catch (e: any) {
      console.error('QR Code refresh error:', e);
    }
  }

  async function startSession() {
    try {
      setLoading(true);
      setError("");
      const result = await startWhatsAppSession(token);
      if (result.success) {
        setStatus(result);
        if (result.qrCode) {
          setQrCode(result.qrCode);
        }
        setSuccess("WhatsApp session started! Scan the QR code with your phone.");
      } else {
        setError(result.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function stopSession() {
    try {
      setLoading(true);
      setError("");
      const result = await stopWhatsAppSession(token);
      if (result.success) {
        setStatus({ status: 'disconnected', message: 'Session stopped' });
        setQrCode("");
        setSuccess("WhatsApp session stopped successfully!");
      } else {
        setError(result.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadKnowledgeBase() {
    try {
      const data = await getKnowledgeBase(token);
      setKnowledgeEntries(data.entries);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadChatContacts() {
    try {
      const data = await getChatContacts(token);
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadChatHistory(contactNumber: string) {
    try {
      const data = await getChatHistory(token, contactNumber);
      if (data.success) {
        setChats(data.chats);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadBotStats() {
    try {
      const data = await getBotStats(token);
      if (data.success) {
        setBotStats(data.stats);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleFileUpload() {
    if (!file) return;
    
    try {
      setLoading(true);
      setError("");
      await uploadKnowledgeBase(token, file);
      await loadKnowledgeBase();
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setSuccess("Knowledge base uploaded successfully!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEntry(id: number) {
    try {
      await deleteKnowledgeEntry(token, id);
      await loadKnowledgeBase();
      setSuccess("Knowledge base entry deleted successfully!");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleSendMessage() {
    if (!testPhoneNumber || !testMessage) {
      setError("Please enter both phone number and message");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      const result = await sendWhatsAppMessage(token, testPhoneNumber, testMessage);
      
      if (result.success) {
        setSuccess("Message sent successfully!");
      setTestMessage("");
      } else {
        setError(result.message || "Failed to send message");
      }
    } catch (e: any) {
      console.error('Send message error:', e);
      setError(`Send failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleListGroups() {
    try {
      const res = await listWhatsAppGroups(token);
      if (res.success) setGroups(res.groups);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleSendToGroup() {
    try {
      setLoading(true);
      setError("");
      if (!selectedGroupNames.length) throw new Error('Please select at least one group');
      if (!groupMessage && !groupMedia) throw new Error('Enter message or attach media');
      const res = await sendToWhatsAppGroupsBulk(token, {
        groupNames: selectedGroupNames,
        message: groupMessage || undefined,
        mediaFile: groupMedia,
        scheduleAt: groupScheduleAt || undefined
      });
      if (res.success) setSuccess(res.message || 'Sent');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportGroupMembers() {
    try {
      if (selectedGroupNames.length !== 1) { setError('Select exactly one group to export'); return; }
      const res = await exportGroupMembers(token, selectedGroupNames[0]);
      if (res.success && res.file) {
        window.open(`${API_URL}${res.file}`, '_blank');
      } else {
        setError(res.message || 'Export failed');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handlePostStatus() {
    if (!statusImage) { setError('Select an image'); return; }
    try {
      setLoading(true);
      setError("");
      const res = await postWhatsAppStatus(token, statusImage, statusCaption);
      if (res.success) setSuccess('Status posted');
      else setError(res.message || 'Failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMonthlySchedules(year: number, month: number) {
    try {
      const res = await getMonthlySchedules(token, year, month);
      if (res.success) setMonthlySchedules({ whatsapp: res.whatsapp || [], posts: res.posts || [] });
    } catch (e: any) {
      setError(e.message);
    }
  }

  function daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }

  function openDayModal(dateISO: string) {
    setSelectedDate(dateISO);
    const dayStart = new Date(dateISO);
    const dayEnd = new Date(dateISO);
    dayEnd.setHours(23, 59, 59, 999);
    const items: any[] = [];
    for (const w of monthlySchedules.whatsapp) {
      const d = new Date(w.scheduledAt);
      if (d >= dayStart && d <= dayEnd) items.push({ type: 'whatsapp', item: w });
    }
    for (const p of monthlySchedules.posts) {
      const d = new Date(p.scheduledAt);
      if (d >= dayStart && d <= dayEnd) items.push({ type: 'post', item: p });
    }
    setDayItems(items);
    setShowSchedModal(true);
  }

  async function handleUpdateSchedule(id: number, scheduledAt: string, payload?: any) {
    try {
      const res = await updateWhatsAppSchedule(token, id, { scheduledAt, payload });
      if (res.success) {
        setSuccess('Schedule updated');
        await loadMonthlySchedules(schedYear, schedMonth);
        openDayModal(selectedDate!);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDeleteSchedule(id: number) {
    try {
      const res = await deleteWhatsAppSchedule(token, id);
      if (res.success) {
        setSuccess('Schedule deleted');
        await loadMonthlySchedules(schedYear, schedMonth);
        openDayModal(selectedDate!);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleStartCampaign() {
    if (!campaignFile || !campaignTemplate) { setError('Upload file and enter template'); return; }
    try {
      setLoading(true);
      setError("");
      const res = await startWhatsAppCampaign(
        token,
        campaignFile,
        campaignTemplate,
        campaignThrottle,
        campaignMedia || undefined,
        campaignScheduleAt || undefined,
        campaignDailyCap ? Number(campaignDailyCap) : undefined,
        campaignPerNumberDelay ? Number(campaignPerNumberDelay) : undefined
      );
      if (res.success) setSuccess(res.message || (res.summary ? `Campaign done: sent ${res.summary?.sent}/${res.summary?.total}` : 'Scheduled'));
      else setError(res.message || 'Campaign failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLoad() {
    try {
      setError("");
      const [agentsRes, chatsRes] = await Promise.all([
        adminListAgents(token),
        adminListChats(token, { limit: 50 })
      ]);
      if (agentsRes.success) setAdminAgents(agentsRes.agents);
      if (chatsRes.success) setAdminChats(chatsRes.chats);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleAdminFilter() {
    try {
      const res = await adminListChats(token, { contactNumber: adminFilterContact || undefined, limit: 50 });
      if (res.success) setAdminChats(res.chats);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleAdminAssign(chatId: number, assigneeId?: number) {
    try {
      const res = await adminAssignChat(token, chatId, assigneeId);
      if (res.success) {
        setSuccess('Chat updated');
        await handleAdminFilter();
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">WhatsApp Bot Management</h1>
      
      {/* Status Messages */}
      {error && (
        <div className="rounded-md p-4 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {/* Groups & Status Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>Groups</CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={handleListGroups} variant="secondary" disabled={loading}>Refresh</Button>
                <span className="text-sm text-gray-600">{groups.length} groups</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Groups</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedGroupNames.length === groups.length && groups.length > 0} onChange={(e) => setSelectedGroupNames(e.target.checked ? groups.map(g => g.name) : [])} />
                      <span className="text-sm">Select All</span>
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
                        <span>{g.name} ({g.participantsCount})</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} placeholder="Type your message... (optional if media attached)" value={groupMessage} onChange={(e) => setGroupMessage(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Media (image/video)</label>
                    <input type="file" accept="image/*,video/*" onChange={(e) => setGroupMedia(e.target.files?.[0] || null)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Schedule (optional)</label>
                    <input type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={groupScheduleAt} onChange={(e) => setGroupScheduleAt(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSendToGroup} disabled={loading || selectedGroupNames.length === 0 || (!groupMessage && !groupMedia)}>Send</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>Post Status</CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setStatusImage(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Caption</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-md" value={statusCaption} onChange={(e) => setStatusCaption(e.target.value)} />
                </div>
              </div>
              <Button onClick={handlePostStatus} disabled={loading || !statusImage}>Post Status</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>Start Campaign</CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Excel (columns: phone, name, message)</label>
                  <input type="file" accept=".xlsx" onChange={(e) => setCampaignFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message Template</label>
                  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={4} value={campaignTemplate} onChange={(e) => setCampaignTemplate(e.target.value)} />
                  <p className="text-xs text-gray-500 mt-1">Use {'{{name}}'} placeholder.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Throttle (ms between messages)</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={campaignThrottle} onChange={(e) => setCampaignThrottle(parseInt(e.target.value || '3000'))} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Media (image/video, optional)</label>
                  <input type="file" accept="image/*,video/*" onChange={(e) => setCampaignMedia(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule (optional)</label>
                  <input type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={campaignScheduleAt} onChange={(e) => setCampaignScheduleAt(e.target.value)} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Daily cap (numbers/day, optional)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={campaignDailyCap} onChange={(e) => setCampaignDailyCap(e.target.value ? Number(e.target.value) : '')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Per-number delay (ms, optional)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={campaignPerNumberDelay} onChange={(e) => setCampaignPerNumberDelay(e.target.value ? Number(e.target.value) : '')} />
                </div>
              </div>
              <Button onClick={handleStartCampaign} disabled={loading || !campaignFile || !campaignTemplate}>Start Campaign</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>Monthly Schedules</CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="number" className="w-28 px-2 py-1 border rounded" value={schedYear} onChange={(e) => setSchedYear(parseInt(e.target.value || String(new Date().getFullYear())))} />
                <input type="number" className="w-20 px-2 py-1 border rounded" value={schedMonth} onChange={(e) => setSchedMonth(parseInt(e.target.value || String(new Date().getMonth()+1)))} />
                <Button variant="secondary" onClick={() => loadMonthlySchedules(schedYear, schedMonth)}>Refresh</Button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: daysInMonth(schedYear, schedMonth) }, (_, i) => i + 1).map((day) => {
                  const count = monthlySchedules.whatsapp.filter(w => new Date(w.scheduledAt).getFullYear() === schedYear && (new Date(w.scheduledAt).getMonth()+1) === schedMonth && new Date(w.scheduledAt).getDate() === day).length + monthlySchedules.posts.filter(p => new Date(p.scheduledAt).getFullYear() === schedYear && (new Date(p.scheduledAt).getMonth()+1) === schedMonth && new Date(p.scheduledAt).getDate() === day).length;
                  return (
                    <div key={day} className="border rounded p-2 hover:bg-gray-50 cursor-pointer" onClick={() => openDayModal(new Date(schedYear, schedMonth - 1, day).toISOString())}>
                      <div className="text-sm font-medium">{day}</div>
                      <div className="text-xs text-gray-500">{count} item(s)</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {showSchedModal && selectedDate && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white w-full max-w-2xl rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Schedules for {new Date(selectedDate).toLocaleDateString()}</h3>
                  <Button variant="secondary" size="sm" onClick={() => setShowSchedModal(false)}>Close</Button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dayItems.length === 0 && (
                    <div className="text-sm text-gray-500">No items.</div>
                  )}
                  {dayItems.map(({ type, item }) => (
                    <div key={`${type}_${item.id}`} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{type === 'whatsapp' ? 'WhatsApp' : 'Post'} #{item.id}</div>
                          <div className="text-xs text-gray-500">{new Date(item.scheduledAt).toLocaleString()}</div>
                        </div>
                        {type === 'whatsapp' ? (
                          <div className="flex items-center gap-2">
                            <input type="datetime-local" className="px-2 py-1 border rounded text-sm" onChange={(e) => (item.__newDate = e.target.value)} />
                            <Button size="sm" onClick={() => item.__newDate ? handleUpdateSchedule(item.id, item.__newDate) : null}>Update</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteSchedule(item.id)}>Delete</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input type="datetime-local" className="px-2 py-1 border rounded text-sm" onChange={(e) => (item.__newDate = e.target.value)} />
                            <Button size="sm" onClick={() => item.__newDate ? updatePlatformPostSchedule(token, item.id, { scheduledAt: item.__newDate }) : null}>Update</Button>
                            <Button size="sm" variant="destructive" onClick={() => deletePlatformPostSchedule(token, item.id)}>Delete</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {success && (
        <div className="rounded-md p-4 bg-green-50 text-green-700">
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('connection')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'connection'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Connection
        </button>
        <button
          onClick={() => setActiveTab('bot')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'bot'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Bot Settings
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'chats'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Chat History
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'groups'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Groups & Status
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'campaigns'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'schedules'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Schedules
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'admin'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Admin
        </button>
      </div>

      {/* Connection Tab */}
      {activeTab === 'connection' && (
        <div className="space-y-6">
          {/* WhatsApp Connection */}
      <Card>
            <CardHeader>WhatsApp Connection</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                    Status: {status?.status || 'Unknown'} • {status?.message || 'No session'}
              </p>
            </div>
                <div className="flex gap-2">
                  <Button onClick={checkStatus} disabled={loading} variant="secondary">
                    Refresh
                  </Button>
                  {status?.status === 'disconnected' || !status ? (
                    <Button onClick={startSession} disabled={loading}>
                      {loading ? 'Starting...' : 'Start Session'}
                    </Button>
                  ) : (
                    <Button onClick={stopSession} disabled={loading} variant="destructive">
                      {loading ? 'Stopping...' : 'Stop Session'}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* QR Code Display */}
              {qrCode && status?.status !== 'CONNECTED' && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Scan this QR code with your WhatsApp mobile app to connect:
                  </p>
                  <div className="flex justify-center">
                    <img 
                      src={qrCode} 
                      alt="WhatsApp QR Code" 
                      className="border border-gray-300 rounded-lg"
                      style={{ maxWidth: '300px', height: 'auto' }}
                    />
                  </div>
          </div>
              )}
        </CardContent>
      </Card>

      {/* Send Test Message */}
      <Card>
        <CardHeader>Send Test Message</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number (with country code)</label>
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Hello, this is a test message"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || !testPhoneNumber || !testMessage}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </CardContent>
      </Card>
        </div>
      )}

      {/* Bot Settings Tab */}
      {activeTab === 'bot' && (
        <div className="space-y-6">
      {/* Knowledge Base Upload */}
      <Card>
            <CardHeader>Knowledge Base Management</CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Excel File</label>
            <p className="mb-2 text-xs text-gray-500">
                  Upload an Excel file with "keyword" and "answer" columns. The bot will prioritize this data over OpenAI responses.
            </p>
            <div className="flex gap-2">
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
              <Button 
                onClick={handleFileUpload} 
                disabled={!file || loading}
                size="sm"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base Entries */}
      {knowledgeEntries.length > 0 && (
        <Card>
          <CardHeader>Knowledge Base Entries ({knowledgeEntries.length})</CardHeader>
          <CardContent>
            <div className="space-y-2">
              {knowledgeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{entry.keyword}</div>
                    <div className="text-xs text-gray-500">{entry.answer}</div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

          {/* Bot Response Priority Info */}
      <Card>
            <CardHeader>Response Priority</CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span><strong>1. Knowledge Base:</strong> Exact and fuzzy matches from your Excel file</span>
            </div>
            <div className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span><strong>2. OpenAI:</strong> AI responses for unknown queries</span>
            </div>
            <div className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
                  <span><strong>3. Fallback:</strong> Default responses when all else fails</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat History Tab */}
      {activeTab === 'chats' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Contacts List */}
            <Card>
              <CardHeader>Contacts ({contacts.length})</CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div
                      key={contact.contactNumber}
                      onClick={() => {
                        setSelectedContact(contact.contactNumber);
                        loadChatHistory(contact.contactNumber);
                      }}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedContact === contact.contactNumber
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm">{contact.contactNumber}</div>
                      <div className="text-xs text-gray-500">
                        {contact.messageCount} messages • {new Date(contact.lastMessageTime).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Messages */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  {selectedContact ? `Chat with ${selectedContact}` : 'Select a contact to view messages'}
                </CardHeader>
                <CardContent>
                  {selectedContact ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {chats.map((chat) => (
                        <div
                          key={chat.id}
                          className={`flex ${chat.messageType === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs p-3 rounded-lg ${
                              chat.messageType === 'outgoing'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <div className="text-sm">{chat.messageContent}</div>
                            <div className="text-xs mt-1 opacity-70">
                              {new Date(chat.timestamp).toLocaleTimeString()}
                              {chat.responseSource && (
                                <span className="ml-2">
                                  ({chat.responseSource === 'knowledge_base' ? 'KB' : chat.responseSource === 'openai' ? 'AI' : 'FB'})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Select a contact to view chat history</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {botStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{botStats.totalMessages}</div>
                  <p className="text-xs text-gray-600">Total Messages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{botStats.totalContacts}</div>
                  <p className="text-xs text-gray-600">Total Contacts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{botStats.incomingMessages}</div>
                  <p className="text-xs text-gray-600">Incoming Messages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{botStats.outgoingMessages}</div>
                  <p className="text-xs text-gray-600">Bot Responses</p>
                </CardContent>
              </Card>
            </div>
          )}

          {botStats && (
            <Card>
              <CardHeader>Response Sources</CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Knowledge Base</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(botStats.knowledgeBaseResponses / botStats.outgoingMessages) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{botStats.knowledgeBaseResponses}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">OpenAI</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(botStats.openaiResponses / botStats.outgoingMessages) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{botStats.openaiResponses}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fallback</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-500 h-2 rounded-full" 
                          style={{ width: `${(botStats.fallbackResponses / botStats.outgoingMessages) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{botStats.fallbackResponses}</span>
                    </div>
            </div>
          </div>
        </CardContent>
      </Card>
          )}
        </div>
      )}

      {/* Admin Tab */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Admin Management</h3>
                  <p className="text-sm text-gray-600">Manage WhatsApp chats and assign agents</p>
                </div>
                <Button onClick={handleAdminLoad} variant="secondary" size="sm">
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminChats.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No chats available yet.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Connect WhatsApp and send/receive some messages to see chat data here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Chats ({adminChats.length})</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Filter by contact number"
                          value={adminFilterContact}
                          onChange={(e) => setAdminFilterContact(e.target.value)}
                          className="px-3 py-1 border rounded-md text-sm"
                        />
                        <Button onClick={handleAdminFilter} variant="secondary" size="sm">
                          Filter
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {adminChats.map((chat: any) => (
                        <div key={chat.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{chat.contactNumber}</p>
                              <p className="text-xs text-gray-600">
                                {chat.messageType === 'incoming' ? '📥' : '📤'} 
                                {chat.messageContent?.slice(0, 50)}...
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(chat.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={chat.assigneeId || ''}
                                onChange={(e) => handleAdminAssign(chat.id, e.target.value ? parseInt(e.target.value) : undefined)}
                                className="text-xs border rounded px-2 py-1"
                              >
                                <option value="">Unassigned</option>
                                {adminAgents.map(agent => (
                                  <option key={agent.id} value={agent.id}>
                                    {agent.name || agent.email}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
      </Card>
        </div>
      )}
    </div>
  );
}









