"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  sendTelegramMessage,
  getTelegramChatHistory,
  getTelegramChatContacts,
} from "@/lib/api";

export default function TelegramChatsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [testMessage, setTestMessage] = useState("");
  
  // Chat management state
  const [chats, setChats] = useState<Array<{ id: number; chatId: string; chatType: string; chatTitle: string; messageType: 'incoming' | 'outgoing'; messageContent: string; responseSource: string; knowledgeBaseMatch: string | null; timestamp: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ chatId: string; chatType: string; chatTitle: string; messageCount: number; lastMessageTime: string }>>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      loadChatContacts();
    }
  }, [token]);

  // Load chat data when contact is selected
  useEffect(() => {
    if (selectedContact && token) {
      loadChatHistory(selectedContact);
    }
  }, [selectedContact, token]);

  async function loadChatHistory(chatId: string) {
    try {
      console.log(`[Telegram] Loading chat history for: ${chatId}`);
      const data = await getTelegramChatHistory(token, chatId);
      console.log(`[Telegram] Chat history response:`, data);
      if (data.success) {
        setChats(data.chats);
        console.log(`[Telegram] Loaded ${data.chats.length} messages`);
      } else {
        console.log(`[Telegram] Failed to load chat history:`, data);
      }
    } catch (e: any) {
      console.error(`[Telegram] Chat history error:`, e);
      setError(e.message);
    }
  }

  async function loadChatContacts() {
    try {
      const data = await getTelegramChatContacts(token);
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleSendMessage(chatId?: string, message?: string) {
    const targetChatId = chatId;
    const targetMessage = message || testMessage;
    
    if (!targetChatId || !targetMessage) {
      setError("Please enter both chat ID and message");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      console.log(`[Telegram Frontend] Sending message to ${targetChatId}: ${targetMessage}`);
      const result = await sendTelegramMessage(token, targetChatId, targetMessage);
      
      if (result.success) {
        setSuccess("Message sent successfully!");
        setTestMessage("");
        console.log(`[Telegram Frontend] Message sent successfully, refreshing chat history for ${selectedContact}`);
        // Refresh chat history if we're in chat view
        if (selectedContact && chatId) {
          // Add a small delay to ensure the message is processed on the backend
          setTimeout(() => {
            console.log(`[Telegram Frontend] Refreshing chat history after 1 second delay`);
            loadChatHistory(selectedContact);
          }, 1000);
        }
      } else {
        console.log(`[Telegram Frontend] Message send failed:`, result.message);
        setError(result.message || "Failed to send message");
      }
    } catch (e: any) {
      console.error('[Telegram Frontend] Send message error:', e);
      setError(`Send failed: ${e.message}`);
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contacts List */}
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">Contacts ({contacts.length})</CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contacts.map((contact) => (
                <div
                  key={contact.chatId}
                  onClick={() => {
                    setSelectedContact(contact.chatId);
                    loadChatHistory(contact.chatId);
                  }}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedContact === contact.chatId
                      ? 'bg-light-custom '
                      : ''
                  }`}
                >
                  <div className="font-medium text-sm text-white">{contact.chatTitle}</div>
                  <div className="text-xs text-orange-300">
                    {contact.messageCount} messages • {new Date(contact.lastMessageTime).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <div className="md:col-span-2">
          <Card className="bg-card border-none">
            <CardHeader className="border-text-primary/50 text-primary">
              <div className="flex items-center justify-between">
                <span>{selectedContact ? `Chat with ${contacts.find(c => c.chatId === selectedContact)?.chatTitle || selectedContact}` : 'Select a contact to view messages'}</span>
                {selectedContact && (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={() => loadChatHistory(selectedContact)}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedContact ? (
                <div className="space-y-4">
                  {/* Messages Display */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {chats.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No messages found. Try refreshing or check if the contact has sent any messages.
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-gray-500 text-center">
                          {chats.length} message{chats.length !== 1 ? 's' : ''} loaded
                        </div>
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
                      </>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="border-t pt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !loading) {
                            handleSendMessage(selectedContact, testMessage);
                          }
                        }}
                        disabled={loading}
                      />
                      <Button 
                        onClick={() => handleSendMessage(selectedContact, testMessage)}
                        disabled={!testMessage.trim() || loading}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        {loading ? "Sending..." : "Send"}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {loading ? "Sending message..." : "Press Enter to send or click Send button"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Select a contact to view chat history</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}