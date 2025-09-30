"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tgWebGroups, tgWebSend } from "@/lib/api";

interface TelegramChat {
  id: string;
  name: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isActive: boolean;
  memberCount?: number;
}

interface ChatMessage {
  id: string;
  text: string;
  timestamp: string;
  isFromBot: boolean;
  senderName?: string;
}

export default function TelegramChatsPage() {
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState<TelegramChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await tgWebGroups(token);
      const chatData: TelegramChat[] = (res.groups || []).map((group: any) => ({
        id: group.id,
        name: group.name,
        type: group.type,
        lastMessage: group.last_message || "No recent messages",
        lastMessageTime: group.last_activity || "Unknown",
        unreadCount: 0,
        isActive: true,
        memberCount: group.member_count || 0
      }));
      
      setChats(chatData);
    } catch (e: any) {
      setError("Failed to load chats");
      console.error("Error loading chats:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(chatId: string) {
    // Load messages for selected chat
    const mockMessages: ChatMessage[] = [
      {
        id: "1",
        text: "Hello, how can I help you?",
        timestamp: "2 min ago",
        isFromBot: true,
        senderName: "Bot"
      },
      {
        id: "2",
        text: "I need help with my account",
        timestamp: "1 min ago",
        isFromBot: false,
        senderName: "User"
      },
      {
        id: "3",
        text: "Sure! What specific issue are you facing?",
        timestamp: "1 min ago",
        isFromBot: true,
        senderName: "Bot"
      }
    ];
    setMessages(mockMessages);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedChat) return;
    
    try {
      setSending(true);
      await tgWebSend(token, selectedChat.id, newMessage);
      
      // Add message to local state
      const message: ChatMessage = {
        id: Date.now().toString(),
        text: newMessage,
        timestamp: "Just now",
        isFromBot: false,
        senderName: "You"
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      setSuccess("Message sent successfully!");
    } catch (e: any) {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChatSelect = (chat: TelegramChat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'private': return '👤';
      case 'group': return '👥';
      case 'supergroup': return '👥';
      case 'channel': return '📢';
      default: return '💬';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Chat History</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Refresh
          </Button>
          <Button size="sm">
            Export Chats
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-none">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Chats</h3>
              <p className="text-sm text-gray-400">
                Manage your Telegram conversations
              </p>
              <Input
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-4"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat?.id === chat.id
                        ? 'bg-blue-100 border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getChatIcon(chat.type)}</span>
                        <div>
                          <div className="font-medium text-white">{chat.name}</div>
                          <div className="text-sm text-gray-500 capitalize">
                            {chat.type}
                          </div>
                        </div>
                      </div>
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <div className="mt-2 text-sm text-gray-600 truncate">
                        {chat.lastMessage}
                      </div>
                    )}
                    {chat.lastMessageTime && (
                      <div className="text-xs text-gray-400">
                        {chat.lastMessageTime}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Details */}
        <div className="lg:col-span-2">
          {selectedChat ? (
            <Card className="bg-card border-none">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>{getChatIcon(selectedChat.type)}</span>
                  {selectedChat.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedChat.type.charAt(0).toUpperCase() + selectedChat.type.slice(1)} Chat
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Chat ID</label>
                      <p className="text-white">{selectedChat.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Type</label>
                      <p className="text-white capitalize">{selectedChat.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Status</label>
                      <p className="text-green-400">Active</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Unread Messages</label>
                      <p className="text-white">{selectedChat.unreadCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-white mb-3">Messages</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {messages.map((message) => (
                        <div key={message.id} className={`p-3 rounded-lg ${
                          message.isFromBot ? 'bg-blue-50' : 'bg-gray-50'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-gray-800">{message.text}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {message.senderName} • {message.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-white mb-3">Send Message</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Bot will automatically respond based on your knowledge base or OpenAI settings
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm">
                      View Full History
                    </Button>
                    <Button variant="outline" size="sm">
                      Export Chat
                    </Button>
                    <Button variant="outline" size="sm">
                      Bot Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-none">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-white mb-2">Select a Chat</h3>
                  <p className="text-gray-400">Choose a chat from the list to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
