"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  sendWhatsAppMessage,
  getChatHistory,
  getChatContacts,
} from "@/lib/api";
import { listTags, addContactToTag, createTag, listContactsByTag } from "@/lib/tagsApi";
import { sendWhatsAppMedia } from "@/lib/mediaApi";
import { getBotStatus, pauseBot, resumeBot, BotStatus } from "@/lib/botControlApi";
import AnimatedEmoji, { EmojiPickerModal } from "@/components/AnimatedEmoji";

export default function WhatsAppChatsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-100 border border-green-400 text-green-800' :
      type === 'error' ? 'bg-red-100 border border-red-400 text-red-800' :
      'bg-blue-100 border border-blue-400 text-blue-800'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-lg">&times;</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  };
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
  
  // Prevent duplicate message sending
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  
  // Auto-refresh indicator
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  
  // Emoji state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Tags state
  const [contactTags, setContactTags] = useState<{[key: string]: string[]}>({});

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

  // Auto-refresh chat every 15 seconds when a contact is selected (improved performance)
  useEffect(() => {
    if (!selectedContact) return;

    const interval = setInterval(() => {
      console.log(`[WhatsApp] Auto-refreshing chat for ${selectedContact}`);
      loadChatHistory(selectedContact, true);
    }, 15000); // Refresh every 15 seconds (reduced from 5 seconds)

    return () => clearInterval(interval);
  }, [selectedContact]);

  async function loadChatHistory(contactNumber: string, isAutoRefresh: boolean = false) {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
      }
      
      console.log(`[WhatsApp] Loading chat history for: ${contactNumber}`);
      const data = await getChatHistory(token, contactNumber);
      console.log(`[WhatsApp] Chat history response:`, data);
      if (data.success) {
        setChats(data.chats.map((chat: any) => ({
          ...chat,
          contentType: chat.contentType || 'text',
          mediaUrl: chat.mediaUrl || undefined,
          mediaFilename: chat.mediaFilename || undefined,
          mediaMimetype: chat.mediaMimetype || undefined
        })).reverse());
        console.log(`[WhatsApp] Loaded ${data.chats.length} messages`);
      } else {
        console.log(`[WhatsApp] Failed to load chat history:`, data);
      }
    } catch (e: any) {
      console.error(`[WhatsApp] Chat history error:`, e);
      setError(e.message);
    } finally {
      if (isAutoRefresh) {
        setIsAutoRefreshing(false);
      }
    }
  }

  async function loadChatContacts() {
    try {
      const data = await getChatContacts(token);
      if (data.success) {
        setContacts(data.contacts);
        // Load tags for each contact
        await loadContactTags(data.contacts);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadContactTags(contacts: Array<{ contactNumber: string; messageCount: number; lastMessageTime: string }>) {
    try {
      const tagsMap: {[key: string]: string[]} = {};
      
      // Load all tags first
      const tagsRes = await listTags();
      if (tagsRes.success) {
        const tags = tagsRes.data;
        
        // For each contact, check which tags they belong to
        for (const contact of contacts) {
          const contactTags: string[] = [];
          
          for (const tag of tags) {
            const contactsRes = await listContactsByTag(tag.id);
            if (contactsRes.success) {
              const hasContact = contactsRes.data.some(c => c.contactNumber === contact.contactNumber);
              if (hasContact) {
                contactTags.push(tag.name);
              }
            }
          }
          
          if (contactTags.length > 0) {
            tagsMap[contact.contactNumber] = contactTags;
          }
        }
      }
      
      setContactTags(tagsMap);
    } catch (e: any) {
      console.error('Error loading contact tags:', e);
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
        showToast("تمت الإضافة إلى التصنيف بنجاح", 'success');
        setShowTagModal(false);
      } else {
        showToast(res.message || "فشل في الإضافة إلى تصنيف", 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
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
      showToast(e.message, 'error');
    } finally {
      setTagLoading(false);
    }
  }

  async function handleSendMessage(phoneNumber?: string, message?: string) {
    const targetPhone = phoneNumber;
    const targetMessage = message || testMessage;
    
    if (!targetPhone || !targetMessage) {
      setError("يرجى إدخال رقم الهاتف والرسالة");
      return;
    }

    // Create a unique key for this message to prevent duplicates
    const messageKey = `${targetPhone}_${targetMessage}_${Date.now()}`;
    
    // Check if we're already sending this message
    if (sendingMessages.has(messageKey)) {
      console.log(`[WhatsApp Frontend] Message already being sent, ignoring duplicate`);
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      // Add to sending set to prevent duplicates
      setSendingMessages(prev => new Set(prev).add(messageKey));
      
      console.log(`[WhatsApp Frontend] Sending message to ${targetPhone}: ${targetMessage}`);
      
      // Optimistic update: Add message to UI immediately
      if (selectedContact && phoneNumber === selectedContact) {
        const optimisticMessage = {
          id: Date.now(), // Temporary ID
          contactNumber: targetPhone,
          messageType: 'outgoing' as 'outgoing',
          messageContent: targetMessage,
          contentType: 'text' as 'text',
          responseSource: 'manual',
          knowledgeBaseMatch: null,
          timestamp: new Date().toISOString()
        };
        setChats(prev => [...prev, optimisticMessage]);
        console.log(`[WhatsApp Frontend] Added optimistic message to UI`);
      }
      
      const result = await sendWhatsAppMessage(token, targetPhone, targetMessage);
      
      if (result.success) {
        showToast("تم إرسال الرسالة بنجاح!", 'success');
        setTestMessage("");
        console.log(`[WhatsApp Frontend] Message sent successfully`);
        // Refresh to get the real message from backend (with correct ID)
        if (selectedContact && phoneNumber) {
          setTimeout(() => {
            console.log(`[WhatsApp Frontend] Refreshing chat history to sync with backend`);
            loadChatHistory(selectedContact);
          }, 500); // Reduced delay since we already showed the message
        }
      } else {
        console.log(`[WhatsApp Frontend] Message send failed:`, result.message);
        showToast(result.message || "فشل في إرسال الرسالة", 'error');
        // Remove optimistic message on failure
        if (selectedContact && phoneNumber === selectedContact) {
          setChats(prev => prev.filter(msg => msg.id !== Date.now()));
        }
      }
    } catch (e: any) {
      console.error('[WhatsApp Frontend] Send message error:', e);
      showToast(`فشل في الإرسال: ${e.message}`, 'error');
    } finally {
      setLoading(false);
      // Remove from sending set after completion
      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageKey);
        return newSet;
      });
    }
  }

  async function handleSendMedia(contactNumber: string) {
    if (!mediaFile) return;
    
    // Create a unique key for this media to prevent duplicates
    const mediaKey = `${contactNumber}_${mediaFile.name}_${Date.now()}`;
    
    // Check if we're already sending this media
    if (sendingMessages.has(mediaKey)) {
      console.log(`[WhatsApp Frontend] Media already being sent, ignoring duplicate`);
      return;
    }
    
    setSendingMedia(true);
    setError("");
    setSuccess("");
    
    try {
      // Add to sending set to prevent duplicates
      setSendingMessages(prev => new Set(prev).add(mediaKey));
      
      console.log(`[WhatsApp] Sending media to ${contactNumber}:`, mediaFile.name);
      const data = await sendWhatsAppMedia(contactNumber, mediaFile, mediaCaption || undefined);
      console.log(`[WhatsApp] Send media response:`, data);
      
      if (data.success) {
        showToast(`تم إرسال الوسائط بنجاح إلى ${contactNumber}`, 'success');
        setMediaFile(null);
        setMediaPreview(null);
        setMediaCaption("");
        // Refresh chat history to show the new message
        await loadChatHistory(contactNumber);
      } else {
        showToast(data.message || "فشل في إرسال الوسائط", 'error');
      }
    } catch (error) {
      console.error("[WhatsApp] Error sending media:", error);
      showToast("فشل في إرسال الوسائط. حاول مرة أخرى.", 'error');
    } finally {
      setSendingMedia(false);
      // Remove from sending set after completion
      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaKey);
        return newSet;
      });
    }
  }

  function handleMediaSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      showToast('يرجى اختيار ملف صورة أو فيديو', 'error');
      return;
    }

    // Check file size (max 16MB for WhatsApp)
    if (file.size > 16 * 1024 * 1024) {
      showToast('يجب أن يكون حجم الملف أقل من 16 ميجابايت', 'error');
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
        showToast(`تم إيقاف البوت لمدة ${minutes} دقيقة`, 'success');
        await loadBotStatus();
      } else {
        showToast(result.message || "فشل في إيقاف البوت", 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
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
        showToast("تم استئناف البوت بنجاح", 'success');
        await loadBotStatus();
      } else {
        showToast(result.message || "فشل في استئناف البوت", 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setBotControlLoading(false);
    }
  }

  return (
    <>
      <div className={`space-y-6 ${showTagModal ? 'blur-sm' : ''}`}>
        <div className="w-full h-[calc(100vh-8rem)] ">
          {/* Main Chat Container */}
          <Card  className=" border-none  flex h-full gradient-border">
          {/* Contacts List */}
          <div className="flex flex-col w-full h-full">
          <CardHeader className="border-text-primary/50 text-primary flex items-center justify-between">

          <div className="flex items-center gap-1">
          <h3 className="text-sm font-medium text-white bg-light-custom p-1 rounded-md inner-shadow">جهات الاتصال {contacts.length}</h3>
              <div className={`w-3 h-3 rounded-full ${botStatus?.isPaused ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-white">
                {botStatus?.isPaused ? 'البوت متوقف' : 'البوت نشط'}
              </span>
              {botStatus?.isPaused && botStatus.timeRemaining > 0 && (
                <span className="text-xs text-yellow-500">
                  ({botStatus.timeRemaining} دقيقة متبقية)
                </span>
              )}  
            </div>
          <div className="flex items-center gap-3 ml-70">
           
           
           <div className="flex items-center gap-2">
                  <img className="w-10 h-10" src="/user.gif" alt="" />
           <span className="text-white font-medium bg-light-custom p-1 rounded-md ">
                    {selectedContact ? `  ${selectedContact.replace('@c.us', '')}` : 'اختر جهة اتصال لعرض الرسائل'}
                  </span>
           </div>
           
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {/* {botStatus?.isPaused 
              ? "Bot will not respond to incoming messages. Resume manually or wait for auto-resume."
              : "Bot is actively responding to incoming messages. Pause when you want to take over conversations."
            } */}
          </div>
      
          <div className="gap-3  flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  
                  {/* {isAutoRefreshing && (
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>تحديث تلقائي</span>
                    </div>
                  )} */}
                </div>
                {selectedContact && (
                  <div className="flex items-center gap-2">
                    {/* <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => loadChatHistory(selectedContact)}
                      className="text-xs"
                      disabled={isAutoRefreshing}
                    >
                      {isAutoRefreshing ? 'جاري التحديث...' : 'Refresh'}
                    </Button> */}
                     <div className="flex gap-2">
              {botStatus?.isPaused ? (
                <Button 
                  size="sm" 
                  onClick={handleResumeBot}
                  disabled={botControlLoading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {botControlLoading ? 'جاري الاستئناف...' : 'استئناف البوت'}
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    onClick={() => handlePauseBot(30)}
                    disabled={botControlLoading}
                    className="bg-transparent text-white border border-text-primary/50 inner-shadow"
                  >
                    إيقاف البوت 30 د
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handlePauseBot(60)}
                    disabled={botControlLoading}
                    className="bg-transparent text-white border border-text-primary/50 inner-shadow"
                  >
                    إيقاف البوت ساعة
                  </Button>
                </div>
              )}
            </div>
                    <Button 
                      size="sm" 
                      onClick={openTagModal}
                      className="text-xs bg-light-custom hover:bg-[#08c47d]"
                    >
                      + إضافة إلى تصنيف
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className=" overflow-y-auto  h-full w-full flex ">
            <div className="space-y-2 w-1/3 border-l border-text-primary/50">
              {contacts.map((contact) => (
                <div
                  key={contact.contactNumber}
                  onClick={() => {
                    setSelectedContact(contact.contactNumber);
                    loadChatHistory(contact.contactNumber);
                  }}
                  className={`p-3 rounded-md cursor-pointer transition-colors flex items-center justify-between ${
                    selectedContact === contact.contactNumber
                      ? 'bg-light-custom inner-shadow'
                      : 'bg-secondry'
                  }`}
                >
                   <div className="flex items-center gap-2">
                   {contact.messageCount > 0 && (
                    <img className="w-10 h-10" src="/belll.gif" alt="" />
                  )}
                   <div className="flex flex-col">
                   <div className="font-medium text-md text-white">عميل جديد</div>
                    <div className="font-medium text-sm text-white">{contact.contactNumber.replace('@c.us', '')}</div>
                    
                   </div>
                  {/* <div className="text-xs text-orange-300">
                    {contact.messageCount} رسالة • {new Date(contact.lastMessageTime).toLocaleDateString()}
                  </div> */}
                  </div>
                 
                  {contactTags[contact.contactNumber] && contactTags[contact.contactNumber].length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contactTags[contact.contactNumber].map((tag, index) => (
                          <span key={index} className="text-xs bg-light-custom text-white px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
            {/* Chat Messages */}
          <div className="flex flex-col w-full h-full ">
            {/* Chat Header */}
            
            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hideيشس">
              {selectedContact ? (
                <div className="space-y-3">
                    {chats.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        لم يتم العثور على رسائل. جرب التحديث أو تحقق من إرسال جهة الاتصال لأي رسائل.
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-gray-500 text-center">
                          {chats.length} رسالة محملة
                        </div>
                        {chats.map((chat) => (
                          <div
                            key={chat.id}
                            className={`flex ${chat.messageType === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs p-3 rounded-lg ${
                                chat.messageType === 'outgoing'
                                  ? 'bg-card inner-shadow text-white'
                                  : 'bg-light-custom inner-shadow text-gray-200'
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
                                    متصفحك لا يدعم علامة الفيديو.
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
                                        تحميل
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Text Content */}
                              <div className="text-sm">
                                <AnimatedEmoji emoji={chat.messageContent} size={16} />
                              </div>
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
              ) : (
                <p className="text-gray-500 text-center py-8">اختر جهة اتصال لعرض سجل المحادثة</p>
              )}
            </div>

            {/* Message Input - Fixed at bottom */}
            {selectedContact && (
              <div className="border-t border-gray-700 p-4  flex-shrink-0">
                {/* Media Upload Section */}
                {mediaFile && (
                  <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-white">معاينة الوسائط</h4>
                      <Button 
                        variant="secondary" 
                        onClick={clearMedia}
                        className="text-red-400 hover:text-red-300"
                      >
                        إزالة
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
                      <div className="mb-3 p-2 bg-gray-600 rounded">
                        <p className="text-sm text-gray-300">📹 فيديو: {mediaFile.name}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="أضف تعليق (اختياري)..."
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        className="w-full px-3 bg-[#011910] py-2 border border-gray-500 rounded-md focus:outline-none  text-white placeholder-gray-400 "
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleSendMedia(selectedContact)}
                          disabled={sendingMedia}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {sendingMedia ? 'جاري الإرسال...' : 'إرسال الوسائط'}
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={clearMedia}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1">
          
                  <button
                    onClick={() => setShowEmojiPicker(true)}
                    
                    className="px-0"
                    title="إضافة إيموجي"
                  >
                    <img className="w-10 h-10" src="/imogi.gif" alt="" />
                    {/* <AnimatedEmoji emoji="😊" size={20} /> */}
                  </button>
                  <label className="text-white px-0 py-2 rounded cursor-pointer flex items-center">
                    <img className="w-10 h-10" src="/img.gif" alt="" />
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaSelect}
                      className="hidden"
                    />
                  </label>
                  <button 
                    onClick={() => handleSendMessage(selectedContact, testMessage)}
                    disabled={!testMessage.trim() || loading}
                    className=""
                  >
                    {loading ? 'جاري الإرسال...' : <img className="w-10 h-10" src="/telegram.gif" alt="" />}
                  </button>
                  <input
                    type="text"
                    placeholder="اكتب رسالتك..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="flex-1 px-3 bg-[#011910] py-4 border border-gray-300 rounded-2xl   text-white placeholder-white/50 "
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        handleSendMessage(selectedContact, testMessage);
                      }
                    }}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {loading ? "جاري إرسال الرسالة..." : ""}
                </p>
              </div>
            )}
          </div>
          </CardContent>
          </div>


          
        </Card>
        </div>
      </div>
      
      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center ">
          <div className="absolute inset-0 bg-black/70 " onClick={() => setShowTagModal(false)} />
          <div className="relative z-10 w-full max-w-xl gradient-border rounded p-4">
            <h3 className="text-white text-lg font-medium mb-3">إضافة إلى تصنيف</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">جهة الاتصال</label>
                <select
                  className="w-full bg-[#011910]  rounded px-3 py-2 text-white"
                  value={selectedContactForTag}
                  onChange={(e) => setSelectedContactForTag(e.target.value)}
                >
                  <option value="">اختر جهة اتصال</option>
                  {contacts.map(c => (
                    <option key={c.contactNumber} value={c.contactNumber}>{c.contactNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">التصنيف</label>
                <select
                  className="w-full bg-[#011910]  rounded px-3 py-2 text-white"
                  value={selectedTagId ?? ''}
                  onChange={(e) => setSelectedTagId(parseInt(e.target.value))}
                >
                  <option value="">اختر تصنيف</option>
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 bg-[#011910]  rounded px-3 py-2 text-white placeholder-white"
                  placeholder="إنشاء تصنيف سريع"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
                <button onClick={handleCreateTagQuick} disabled={!newTagName.trim() || tagLoading} className="bg-transparent rounded-md p-2 text-white inner-shadow border border-text-primary">
                  إنشاء
                </button>
              </div>
              <div className="flex items-center w-full gap-2 pt-2">
                <button className="w-full text-white primary-button after:bg-red-700 before:bg-red-700"  onClick={() => setShowTagModal(false)}>إلغاء</button>
                <button  onClick={handleAddToTag} disabled={!selectedTagId || !selectedContactForTag || tagLoading} className="after:bg-[#011910] before:bg-[#01191080]  w-full primary-button">
                  {tagLoading ? 'جاري الإضافة...' : 'إضافة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={(emoji) => {
          setTestMessage(prev => prev + emoji);
          setShowEmojiPicker(false);
        }}
      />
    </>
  );
}