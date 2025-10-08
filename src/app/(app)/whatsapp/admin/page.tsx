"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  adminListAgents,
  adminListChats,
  adminAssignChat,
} from "@/lib/api";

export default function WhatsAppAdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Admin state
  const [adminAgents, setAdminAgents] = useState<Array<{ id: number; name?: string; email: string }>>([]);
  const [adminChats, setAdminChats] = useState<any[]>([]);
  const [adminFilterContact, setAdminFilterContact] = useState<string>("");
  const [adminSelectedAssignee, setAdminSelectedAssignee] = useState<number | undefined>(undefined);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      handleAdminLoad();
    }
  }, [token]);

  async function handleAdminLoad() {
    try {
      setLoading(true);
      setError("");
      
      const [agentsResult, chatsResult] = await Promise.all([
        adminListAgents(token),
        adminListChats(token)
      ]);
      
      if (agentsResult.success) {
        setAdminAgents(agentsResult.agents);
      }
      
      if (chatsResult.success) {
        setAdminChats(chatsResult.chats);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminFilter() {
    try {
      setLoading(true);
      setError("");
      const result = await adminListChats(token, adminFilterContact);
      if (result.success) {
        setAdminChats(result.chats);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminAssign(chatId: number, assigneeId?: number) {
    try {
      setLoading(true);
      setError("");
      const result = await adminAssignChat(token, chatId, assigneeId);
      if (result.success) {
        setSuccess("تم تعيين المحادثة بنجاح!");
        await handleAdminLoad(); // Refresh the list
      } else {
        setError(result.message || "فشل في تعيين المحادثة");
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
        <CardHeader className="border-text-primary/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">إدارة الإدارة</h3>
              <p className="text-sm text-gray-600">إدارة محادثات الواتساب وتعيين الوكلاء</p>
            </div>
            <Button onClick={handleAdminLoad} variant="secondary" size="sm">
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adminChats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد محادثات متاحة بعد.</p>
                <p className="text-sm text-gray-400 mt-2">
                  اتصل بالواتساب وأرسل/استقبل بعض الرسائل لرؤية بيانات المحادثة هنا.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">المحادثات ({adminChats.length})</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="تصفية برقم جهة الاتصال"
                      value={adminFilterContact}
                      onChange={(e) => setAdminFilterContact(e.target.value)}
                      className="px-3 py-1 border rounded-md text-sm"
                    />
                    <Button onClick={handleAdminFilter} variant="secondary" size="sm">
                      تصفية
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
                            <option value="">غير معين</option>
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
  );
}