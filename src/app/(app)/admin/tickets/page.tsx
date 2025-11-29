"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Search,
  Filter,
  Send,
  User,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import Loader from "@/components/Loader";

interface Ticket {
  id: number;
  storeId: string;
  visitorId?: string;
  visitorName?: string;
  visitorEmail?: string;
  status: "open" | "pending" | "closed";
  assignedTo?: number;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  assignedAgent?: {
    id: number;
    name: string;
    email: string;
  };
}

interface TicketMessage {
  id: number;
  ticketId: number;
  senderType: "visitor" | "bot" | "agent";
  senderId?: number;
  content: string;
  createdAt: string;
  senderAgent?: {
    id: number;
    name: string;
    email: string;
  };
}

interface TicketStats {
  total: number;
  open: number;
  pending: number;
  closed: number;
}

export default function TicketsAdminPage() {
  const [token, setToken] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadTickets();
    loadStats();
  }, [token, statusFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/dashboard/tickets?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب التذاكر");
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error: any) {
      showError("خطأ", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/dashboard/tickets/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب الإحصائيات");
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadTicket = async (ticketId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/dashboard/tickets/${ticketId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب التذكرة");
      }

      const data = await response.json();
      setSelectedTicket(data.ticket);
      setMessages(data.ticket.messages || []);
      setDialogOpen(true);
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedTicket || sending) return;

    const content = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/dashboard/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
            senderType: "agent",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("فشل في إرسال الرسالة");
      }

      const data = await response.json();
      if (data.message) {
        setMessages([...messages, data.message]);
      }

      // Reload ticket to get updated messages
      await loadTicket(selectedTicket.id);
      showSuccess("تم إرسال الرسالة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message);
      setInputMessage(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/dashboard/tickets/${ticketId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("فشل في تحديث حالة التذكرة");
      }

      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        await loadTicket(ticketId);
      }
      showSuccess("تم تحديث حالة التذكرة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "مفتوحة";
      case "pending":
        return "قيد الانتظار";
      case "closed":
        return "مغلقة";
      default:
        return status;
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.visitorName?.toLowerCase().includes(query) ||
        ticket.visitorEmail?.toLowerCase().includes(query) ||
        ticket.storeId.toLowerCase().includes(query) ||
        ticket.id.toString().includes(query)
      );
    }
    return true;
  });

  if (loading && tickets.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader text="جاري تحميل التذاكر..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">إدارة التذاكر</h1>
        <p className="text-sm text-gray-400">لوحة تحكم الإدارة - عرض وإدارة جميع التذاكر</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-custom border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">إجمالي التذاكر</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-custom border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">مفتوحة</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-custom border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">قيد الانتظار</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-custom border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">مغلقة</p>
                  <p className="text-2xl font-bold text-green-400">{stats.closed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-gradient-custom border-primary">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن تذكرة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="حالة التذكرة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="open">مفتوحة</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="closed">مغلقة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card className="bg-gradient-custom border-primary">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">لا توجد تذاكر</p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="bg-gradient-custom border-primary cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => loadTicket(ticket.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(ticket.status)}
                    <div>
                      <h3 className="font-semibold text-white">
                        {ticket.visitorName || `زائر ${ticket.id}`}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {ticket.visitorEmail || "بريد إلكتروني غير متوفر"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Store: {ticket.storeId} • {new Date(ticket.createdAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{getStatusText(ticket.status)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStatus = ticket.status === "open" ? "closed" : "open";
                        updateTicketStatus(ticket.id, newStatus);
                      }}
                    >
                      {ticket.status === "open" ? "إغلاق" : "فتح"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ticket Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedTicket?.visitorName || `تذكرة #${selectedTicket?.id}`}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedTicket?.visitorEmail || "بريد إلكتروني غير متوفر"} • Store: {selectedTicket?.storeId}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-900 rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderType === "visitor" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.senderType === "visitor"
                      ? "bg-blue-600/20 text-white"
                      : message.senderType === "bot"
                      ? "bg-gray-800 text-white"
                      : "bg-green-600/20 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.senderType === "visitor" ? (
                      <User className="h-4 w-4" />
                    ) : message.senderType === "bot" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.senderType === "visitor"
                        ? "زائر"
                        : message.senderType === "bot"
                        ? "بوت"
                        : message.senderAgent?.name || "وكيل"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(message.createdAt).toLocaleString("ar-SA")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="اكتب رسالتك..."
              className="flex-1"
              disabled={sending}
            />
            <Button onClick={sendMessage} disabled={!inputMessage.trim() || sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            {selectedTicket && (
              <Select
                value={selectedTicket.status}
                onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">مفتوحة</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
















