"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  sendWhatsAppMessage,
  getChatHistory,
  getChatContacts,
} from "@/lib/api";
import { listTags, addContactToTag, createTag } from "@/lib/tagsApi";
import { sendWhatsAppMedia } from "@/lib/mediaApi";
import { getBotStatus, pauseBot, resumeBot, BotStatus } from "@/lib/botControlApi";

export default function WhatsAppChatsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [testMessage, setTestMessage] = useState("");
  // Tag modal state
  const [showTagModal, setShowTagModal] = useState(false);
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [selectedContactForTag, setSelectedContactForTag] = useState<string>("");
  const [tagLoading, setTagLoading] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  
  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaCaption, setMediaCaption] = useState("");
  const [sendingMedia, setSendingMedia] = useState(false);
  
  // Chat management state
  const [chats, setChats] = useState<Array<{ 
    id: number; 
    contactNumber: string; 
    messageType: 'incoming' | 'outgoing'; 
    messageContent: string; 
    contentType: 'text' | 'image' | 'video' | 'audio' | 'document';
    mediaUrl?: string;
    mediaFilename?: string;
    mediaMimetype?: string;
    responseSource: string; 
    knowledgeBaseMatch: string | null; 
    timestamp: string 
  }>>([]);
  const [contacts, setContacts] = useState<Array<{ contactNumber: string; messageCount: number; lastMessageTime: string }>>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  
  // Bot control state
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botControlLoading, setBotControlLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      loadChatContacts();
      loadBotStatus();
    }
  }, [token]);

  // Load chat data when contact is selected
  useEffect(() => {
    if (selectedContact && token) {
      loadChatHistory(selectedContact);
    }
  }, [selectedContact, token]);

  async function loadChatHistory(contactNumber: string) {
    try {
      console.log(`[WhatsApp] Loading chat history for: ${contactNumber}`);
      const data = await getChatHistory(token, contactNumber);
      console.log(`[WhatsApp] Chat history response:`, data);
      if (data.success) {
        setChats(data.chats);
        console.log(`[WhatsApp] Loaded ${data.chats.length} messages`);
      } else {
        console.log(`[WhatsApp] Failed to load chat history:`, data);
      }
    } catch (e: any) {
      console.error(`[WhatsApp] Chat history error:`, e);
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

  async function openTagModal() {
    try {
      setTagLoading(true);
      setError("");
      const res = await listTags();
      if (res.success) {
        setTags(res.data || []);
      }
      // default contact
      setSelectedContactForTag(selectedContact || "");
      setShowTagModal(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTagLoading(false);
    }
  }

  async function handleAddToTag() {
    if (!selectedTagId || !selectedContactForTag) return;
    try {
      setTagLoading(true);
      const res = await addContactToTag(selectedTagId, { contactNumber: selectedContactForTag, contactName: undefined });
      if (res.success) {
        setSuccess("Added to tag successfully");
        setShowTagModal(false);
      } else {
        setError(res.message || "Failed to add to tag");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTagLoading(false);
    }
  }

  async function handleCreateTagQuick() {
    if (!newTagName.trim()) return;
    try {
      setTagLoading(true);
      const res = await createTag({ name: newTagName.trim() });
      if (res.success) {
        setNewTagName("");
        const list = await listTags();
        if (list.success) setTags(list.data || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTagLoading(false);
    }
  }

  async function handleSendMessage(phoneNumber?: string, message?: string) {
    const targetPhone = phoneNumber;
    const targetMessage = message || testMessage;
    
    if (!targetPhone || !targetMessage) {
      setError("Please enter both phone number and message");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      console.log(`[WhatsApp Frontend] Sending message to ${targetPhone}: ${targetMessage}`);
      const result = await sendWhatsAppMessage(token, targetPhone, targetMessage);
      
      if (result.success) {
        setSuccess("Message sent successfully!");
        setTestMessage("");
        console.log(`[WhatsApp Frontend] Message sent successfully, refreshing chat history for ${selectedContact}`);
        // Refresh chat history if we're in chat view
        if (selectedContact && phoneNumber) {
          // Add a small delay to ensure the message is processed on the backend
          setTimeout(() => {
            console.log(`[WhatsApp Frontend] Refreshing chat history after 1 second delay`);
            loadChatHistory(selectedContact);
          }, 1000);
        }
      } else {
        console.log(`[WhatsApp Frontend] Message send failed:`, result.message);
        setError(result.message || "Failed to send message");
      }
    } catch (e: any) {
      console.error('[WhatsApp Frontend] Send message error:', e);
      setError(`Send failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMedia(contactNumber: string) {
    if (!mediaFile) return;
    
    setSendingMedia(true);
    setError("");
    setSuccess("");
    
    try {
      console.log(`[WhatsApp] Sending media to ${contactNumber}:`, mediaFile.name);
      const data = await sendWhatsAppMedia(contactNumber, mediaFile, mediaCaption || undefined);
      console.log(`[WhatsApp] Send media response:`, data);
      
      if (data.success) {
        setSuccess(`Media sent successfully to ${contactNumber}`);
        setMediaFile(null);
        setMediaPreview(null);
        setMediaCaption("");
        // Refresh chat history to show the new message
        await loadChatHistory(contactNumber);
      } else {
        setError(data.message || "Failed to send media");
      }
    } catch (error) {
      console.error("[WhatsApp] Error sending media:", error);
      setError("Failed to send media. Please try again.");
    } finally {
      setSendingMedia(false);
    }
  }

  function handleMediaSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setError('Please select an image or video file');
      return;
    }

    // Check file size (max 16MB for WhatsApp)
    if (file.size > 16 * 1024 * 1024) {
      setError('File size must be less than 16MB');
      return;
    }

    setMediaFile(file);
    setError("");

    // Create preview for images
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  }

  function clearMedia() {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaCaption("");
  }

  // Bot control functions
  async function loadBotStatus() {
    try {
      const result = await getBotStatus();
      if (result.success) {
        setBotStatus(result.data);
      }
    } catch (e: any) {
      console.error('Failed to load bot status:', e);
    }
  }

  async function handlePauseBot(minutes: number = 30) {
    try {
      setBotControlLoading(true);
      setError("");
      const result = await pauseBot(minutes);
      if (result.success) {
        setSuccess(`Bot paused for ${minutes} minutes`);
        await loadBotStatus();
      } else {
        setError(result.message || "Failed to pause bot");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBotControlLoading(false);
    }
  }

  async function handleResumeBot() {
    try {
      setBotControlLoading(true);
      setError("");
      const result = await resumeBot();
      if (result.success) {
        setSuccess("Bot resumed successfully");
        await loadBotStatus();
      } else {
        setError(result.message || "Failed to resume bot");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBotControlLoading(false);
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

      {/* Bot Control Panel */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <div className="flex items-center justify-between">
            <span>Bot Control</span>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={loadBotStatus}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${botStatus?.isPaused ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-white">
                {botStatus?.isPaused ? 'Bot Paused' : 'Bot Active'}
              </span>
              {botStatus?.isPaused && botStatus.timeRemaining > 0 && (
                <span className="text-xs text-gray-500">
                  ({botStatus.timeRemaining} min remaining)
                </span>
              )}
              
            </div>
            <div className="flex gap-2">
              {botStatus?.isPaused ? (
                <Button 
                  size="sm" 
                  onClick={handleResumeBot}
                  disabled={botControlLoading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {botControlLoading ? 'Resuming...' : 'Resume Bot'}
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    onClick={() => handlePauseBot(30)}
                    disabled={botControlLoading}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    Pause 30m
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handlePauseBot(60)}
                    disabled={botControlLoading}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Pause 1h
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {botStatus?.isPaused 
              ? "Bot will not respond to incoming messages. Resume manually or wait for auto-resume."
              : "Bot is actively responding to incoming messages. Pause when you want to take over conversations."
            }
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contacts List */}
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">Contacts ({contacts.length})</CardHeader>
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
                      ? 'bg-light-custom '
                      : ''
                  }`}
                >
                  <div className="font-medium text-sm text-white">{contact.contactNumber}</div>
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
                <span>{selectedContact ? `Chat with ${selectedContact}` : 'Select a contact to view messages'}</span>
                {selectedContact && (
                  <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={() => loadChatHistory(selectedContact)}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                    <Button 
                      size="sm" 
                      onClick={openTagModal}
                      className="text-xs bg-light-custom hover:bg-[#08c47d]"
                    >
                      + Add to Tag
                    </Button>
                  </div>
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
                              {/* Media Content */}
                              {chat.contentType === 'image' && chat.mediaUrl && (
                                <div className="mb-2">
                                  <img 
                                    src={`http://localhost:4000${chat.mediaUrl}`} 
                                    alt="Sent image" 
                                    className="max-w-full h-auto rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              
                              {chat.contentType === 'video' && chat.mediaUrl && (
                                <div className="mb-2">
                                  <video 
                                    src={`http://localhost:4000${chat.mediaUrl}`} 
                                    controls 
                                    className="max-w-full h-auto rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                              
                              {(chat.contentType === 'audio' || chat.contentType === 'document') && chat.mediaUrl && (
                                <div className="mb-2 p-2 bg-black bg-opacity-20 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                      {chat.contentType === 'audio' ? '🎵' : '📄'}
                                    </span>
                                    <div>
                                      <div className="text-sm font-medium">
                                        {chat.mediaFilename || `${chat.contentType.toUpperCase()} File`}
                                      </div>
                                      <a 
                                        href={`http://localhost:4000${chat.mediaUrl}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs underline"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Text Content */}
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
                  
                  {/* Media Upload Section */}
                  {mediaFile && (
                    <div className="border-t pt-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Media Preview</h4>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={clearMedia}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                        
                        {mediaPreview && (
                          <div className="mb-3">
                            <img 
                              src={mediaPreview} 
                              alt="Preview" 
                              className="max-w-xs max-h-48 rounded-lg object-cover"
                            />
                          </div>
                        )}
                        
                        {mediaFile.type.startsWith('video/') && (
                          <div className="mb-3 p-2 bg-gray-100 rounded">
                            <p className="text-sm text-gray-600">📹 Video: {mediaFile.name}</p>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Add caption (optional)..."
                            value={mediaCaption}
                            onChange={(e) => setMediaCaption(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleSendMedia(selectedContact)}
                              disabled={sendingMedia}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              {sendingMedia ? "Sending..." : "Send Media"}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={clearMedia}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                      <label className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded cursor-pointer flex items-center">
                        📎
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleMediaSelect}
                          className="hidden"
                        />
                      </label>
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
      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTagModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-semidark-custom border border-gray-700 rounded p-4">
            <h3 className="text-white text-lg font-medium mb-3">Add to Tag</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Contact</label>
                <select
                  className="w-full bg-dark-custom border border-gray-600 rounded px-3 py-2 text-white"
                  value={selectedContactForTag}
                  onChange={(e) => setSelectedContactForTag(e.target.value)}
                >
                  <option value="">Select contact</option>
                  {contacts.map(c => (
                    <option key={c.contactNumber} value={c.contactNumber}>{c.contactNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tag</label>
                <select
                  className="w-full bg-dark-custom border border-gray-600 rounded px-3 py-2 text-white"
                  value={selectedTagId ?? ''}
                  onChange={(e) => setSelectedTagId(parseInt(e.target.value))}
                >
                  <option value="">Select tag</option>
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 bg-dark-custom border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Quick create tag"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
                <Button onClick={handleCreateTagQuick} disabled={!newTagName.trim() || tagLoading} className="bg-light-custom hover:bg-[#08c47d]">
                  Create
                </Button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowTagModal(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddToTag} disabled={!selectedTagId || !selectedContactForTag || tagLoading} className="bg-light-custom hover:bg-[#08c47d]">
                  {tagLoading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}