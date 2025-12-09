"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  sendWhatsAppMessage,
  getChatHistory,
  getChatContacts,
  getChatNote,
  getOpenChatNotes,
  createChatNote,
  resolveChatNote,
} from "@/lib/api";
import { listTags, addContactToTag, createTag, listContactsByTag } from "@/lib/tagsApi";
import { sendWhatsAppMedia } from "@/lib/mediaApi";
import { getBotStatus, pauseBot, resumeBot, BotStatus } from "@/lib/botControlApi";
import AnimatedEmoji, { EmojiPickerInline } from "@/components/AnimatedEmoji";
import { useAuth } from "@/lib/auth";
import Image from "next/image";

export default function WhatsAppChatsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const { user } = useAuth();
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
  const [contacts, setContacts] = useState<Array<{ contactNumber: string; messageCount: number; lastMessageTime: string; profilePicture?: string | null; contactName?: string | null }>>([]);
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
  // Notes state
  const [openNoteContacts, setOpenNoteContacts] = useState<Set<string>>(new Set());
  const [activeNote, setActiveNote] = useState<{ id: number; contactNumber: string; note: string; status: 'open' | 'resolved' } | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Ref for messages container to scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  // Linkify plain text into clickable anchors and keep line breaks
  const linkify = (text: string) => {
    if (!text) return "";
    const urlPattern = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}[^\s<>"']*)/gi;
    const withLinks = text.replace(urlPattern, (url) => {
      const cleanUrl = url.replace(/[.,;:!?]+$/, "");
      const trailing = url.slice(cleanUrl.length);
      const href = cleanUrl.match(/^https?:\/\//i)
        ? cleanUrl
        : cleanUrl.startsWith("www.")
        ? `https://${cleanUrl}`
        : `https://${cleanUrl}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="underline text-blue-300 break-all">${cleanUrl}</a>${trailing}`;
    });
    return withLinks.replace(/\n/g, "<br>");
  };

  useEffect(() => {
    if (token) {
      loadChatContacts();
      loadBotStatus();
      // Load open notes for highlighting
      (async () => {
        try {
          const data = await getOpenChatNotes(token);
          if (data.success) {
            setOpenNoteContacts(new Set(data.contacts || []));
          }
        } catch (_) {}
      })();
    }
  }, [token]);

  // Load chat data when contact is selected
  useEffect(() => {
    if (selectedContact && token) {
      loadChatHistory(selectedContact);
      // Load latest note for selected contact
      (async () => {
        try {
          const res = await getChatNote(token, selectedContact);
          setActiveNote(res?.note || null);
        } catch (_) {
          setActiveNote(null);
        }
      })();
    }
  }, [selectedContact, token]);

  // Auto-refresh chat - faster when bot is paused, slower when bot is active
  useEffect(() => {
    if (!selectedContact) return;

    // Use faster interval (3 seconds) when bot is paused, slower (15 seconds) when active
    const refreshInterval = botStatus?.isPaused ? 3000 : 15000;

    const interval = setInterval(() => {
      console.log(`[WhatsApp] Auto-refreshing chat for ${selectedContact} (bot paused: ${botStatus?.isPaused})`);
      loadChatHistory(selectedContact, true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [selectedContact, botStatus?.isPaused]);

  // Scroll to bottom when chats are loaded or updated
  useEffect(() => {
    if (chats.length > 0 && messagesContainerRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 150);
    }
  }, [chats, selectedContact]);

  async function loadChatHistory(contactNumber: string, isAutoRefresh: boolean = false) {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
      }
      
      console.log(`[WhatsApp] Loading chat history for: ${contactNumber}`);
      const data = await getChatHistory(token, contactNumber);
      console.log(`[WhatsApp] Chat history response:`, data);
      if (data.success) {
        const processedChats = data.chats.map((chat: any) => ({
          ...chat,
          contentType: chat.contentType || 'text',
          mediaUrl: chat.mediaUrl || undefined,
          mediaFilename: chat.mediaFilename || undefined,
          mediaMimetype: chat.mediaMimetype || undefined
        }));
        
        // Log media messages for debugging
        processedChats.forEach((chat: any) => {
          if (chat.contentType === 'image' || chat.contentType === 'video') {
            console.log(`[WhatsApp] Media message:`, {
              contentType: chat.contentType,
              messageContent: chat.messageContent,
              mediaUrl: chat.mediaUrl,
              hasMediaUrl: !!chat.mediaUrl
            });
          }
        });
        
        // Merge with existing optimistic messages (keep optimistic messages that don't have a match yet)
        setChats(prev => {
          const serverChats = processedChats.reverse();
          
          // Identify optimistic messages (those with temporary IDs > 1000000000000 or _isOptimistic flag)
          const optimisticMessages = prev.filter(msg => {
            return (typeof msg.id === 'number' && msg.id > 1000000000000) || 
                   (msg as any)._isOptimistic === true;
          });
          
          // For each optimistic message, try to find a matching server message
          const matchedOptimisticIds = new Set<number>();
          const mergedChats = serverChats.map((serverChat: any) => {
            // Try to find matching optimistic message
            const matchingOptimistic = optimisticMessages.find(optMsg => {
              if (matchedOptimisticIds.has(optMsg.id)) return false; // Already matched
              
              const timeDiff = Math.abs(new Date(serverChat.timestamp).getTime() - new Date(optMsg.timestamp).getTime());
              const sameContact = serverChat.contactNumber === optMsg.contactNumber;
              const sameType = serverChat.messageType === optMsg.messageType;
              
              // Match by contentType for media messages
              if (optMsg.contentType === 'image' || optMsg.contentType === 'video') {
                const sameContentType = serverChat.contentType === optMsg.contentType;
                const timeClose = timeDiff < 60000; // Within 60 seconds
                
                if (sameContact && sameType && sameContentType && timeClose) {
                  matchedOptimisticIds.add(optMsg.id);
                  return true;
                }
              } else {
                // For text messages, match by content
                const sameContent = serverChat.messageContent === optMsg.messageContent;
                const timeClose = timeDiff < 30000; // Within 30 seconds
                
                if (sameContact && sameType && sameContent && timeClose) {
                  matchedOptimisticIds.add(optMsg.id);
                  return true;
                }
              }
              
              return false;
            });
            
            // If found matching optimistic message, use server chat (which has real ID and mediaUrl)
            // But preserve mediaUrl from optimistic if server doesn't have it yet or if it's a data URL
            if (matchingOptimistic) {
              // For media messages, prefer server mediaUrl, but keep optimistic preview if server doesn't have it yet
              const optimisticPreview = (matchingOptimistic as any)._previewUrl || matchingOptimistic.mediaUrl;
              const finalMediaUrl = serverChat.mediaUrl 
                ? serverChat.mediaUrl 
                : optimisticPreview; // Use preview if server doesn't have URL yet
              
              return {
                ...serverChat,
                // Always preserve mediaUrl (from server or optimistic preview)
                mediaUrl: finalMediaUrl,
                // Also preserve other media fields from optimistic if missing
                mediaFilename: serverChat.mediaFilename || matchingOptimistic.mediaFilename,
                mediaMimetype: serverChat.mediaMimetype || matchingOptimistic.mediaMimetype,
                // Remove optimistic flag
                _isOptimistic: undefined,
                _previewUrl: undefined
              };
            }
            
            return serverChat;
          });
          
          // Keep unmatched optimistic messages
          const unmatchedOptimistic = optimisticMessages.filter(msg => !matchedOptimisticIds.has(msg.id));
          
          // Combine server chats with unmatched optimistic messages, then sort by timestamp
          const allChats = [...mergedChats, ...unmatchedOptimistic];
          return allChats.sort((a, b) => {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          });
        });
        
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
      console.log('=== getChatContacts API Response ===');
      console.log('Full API response:', data);
      console.log('Contacts array:', data.contacts);
      
      if (data.success) {
        // Log each contact to see all available fields
        data.contacts.forEach((contact, index) => {
          console.log(`Contact ${index + 1}:`, {
            contactNumber: contact.contactNumber,
            contactName: contact.contactName,
            profilePicture: contact.profilePicture,
            messageCount: contact.messageCount,
            lastMessageTime: contact.lastMessageTime,
            allKeys: Object.keys(contact),
            fullObject: contact
          });
        });
        
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
              const hasContact = contactsRes.data.some((c: any) => c.contactNumber === contact.contactNumber);
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
        
        // Clear input and scroll immediately for better UX
        setTestMessage("");
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 50);
      }
      
      // Send message in background without blocking UI
      const result = await sendWhatsAppMessage(token, targetPhone, targetMessage);
      
      if (result.success) {
        showToast("تم إرسال الرسالة بنجاح!", 'success');
        console.log(`[WhatsApp Frontend] Message sent successfully`);
        
        // If bot is paused or message is manual, refresh immediately without waiting for interval
        const isBotPaused = botStatus?.isPaused;
        const isManualMessage = true; // This is always a manual message from user
        
        if (selectedContact && phoneNumber && (isBotPaused || isManualMessage)) {
          // Immediate refresh for manual messages or when bot is paused
          console.log(`[WhatsApp Frontend] Immediate refresh (bot paused: ${isBotPaused}, manual: ${isManualMessage})`);
        setTimeout(() => {
            loadChatHistory(selectedContact);
          }, 300); // Quick refresh after sending
          
          // Also set up a few quick polls to catch any delayed responses
          let pollCount = 0;
          const maxPolls = 3;
          const pollInterval = setInterval(() => {
            pollCount++;
            if (pollCount <= maxPolls) {
              console.log(`[WhatsApp Frontend] Polling for new messages (${pollCount}/${maxPolls})`);
              loadChatHistory(selectedContact, true);
            } else {
              clearInterval(pollInterval);
            }
          }, 2000); // Poll every 2 seconds for 3 times (6 seconds total)
        } else {
          // Normal refresh for bot responses
        if (selectedContact && phoneNumber) {
          setTimeout(() => {
            console.log(`[WhatsApp Frontend] Refreshing chat history to sync with backend`);
            loadChatHistory(selectedContact);
            }, 500);
          }
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
      // Remove optimistic message on error
      if (selectedContact && phoneNumber === selectedContact) {
        setChats(prev => prev.filter(msg => msg.id !== Date.now()));
      }
    } finally {
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
    
    setError("");
    setSuccess("");
    
    try {
      // Add to sending set to prevent duplicates
      setSendingMessages(prev => new Set(prev).add(mediaKey));
      
      const isImage = mediaFile.type.startsWith('image/');
      const isVideo = mediaFile.type.startsWith('video/');
      const contentType = isImage ? 'image' : isVideo ? 'video' : 'document';
      
      // Optimistic update: Add media message to UI immediately
      if (selectedContact && contactNumber === selectedContact) {
        // Store preview in a ref or state to preserve it
        const optimisticId = Date.now();
        const optimisticMessage = {
          id: optimisticId, // Temporary ID - store it to track this message
          contactNumber: contactNumber,
          messageType: 'outgoing' as 'outgoing',
          messageContent: mediaCaption || (isImage ? 'image' : isVideo ? 'video' : 'document'),
          contentType: contentType as 'image' | 'video' | 'document',
          mediaUrl: mediaPreview || undefined, // Use preview as temporary URL (data URL)
          mediaFilename: mediaFile.name,
          mediaMimetype: mediaFile.type,
          responseSource: 'manual',
          knowledgeBaseMatch: null,
          timestamp: new Date().toISOString(),
          _isOptimistic: true, // Flag to identify optimistic messages
          _previewUrl: mediaPreview // Store preview URL separately
        };
        setChats(prev => [...prev, optimisticMessage]);
        console.log(`[WhatsApp Frontend] Added optimistic media message to UI with ID: ${optimisticId}`);
        console.log(`[WhatsApp Frontend] Added optimistic media message to UI`);
        
        // Clear media inputs and scroll immediately
        setMediaFile(null);
        setMediaPreview(null);
        setMediaCaption("");
        
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 50);
      }
      
      console.log(`[WhatsApp] Sending media to ${contactNumber}:`, mediaFile.name);
      const data = await sendWhatsAppMedia(contactNumber, mediaFile, mediaCaption || undefined);
      console.log(`[WhatsApp] Send media response:`, data);
      
      if (data.success) {
        showToast(`تم إرسال الوسائط بنجاح إلى ${contactNumber}`, 'success');
        
        // If bot is paused, set up quick polls to catch any responses
        const isBotPaused = botStatus?.isPaused;
        if (isBotPaused) {
          let pollCount = 0;
          const maxPolls = 3;
          const pollInterval = setInterval(() => {
            pollCount++;
            if (pollCount <= maxPolls) {
              console.log(`[WhatsApp Frontend] Polling for new messages after media (${pollCount}/${maxPolls})`);
              loadChatHistory(contactNumber, true);
            } else {
              clearInterval(pollInterval);
            }
          }, 2000); // Poll every 2 seconds for 3 times
        }
        
        // Refresh chat history to get the real message from backend (with correct URL)
        setTimeout(() => {
          loadChatHistory(contactNumber);
        }, 300);
      } else {
        showToast(data.message || "فشل في إرسال الوسائط", 'error');
        // Remove optimistic message on failure
        if (selectedContact && contactNumber === selectedContact) {
          setChats(prev => prev.filter(msg => msg.id !== Date.now()));
        }
      }
    } catch (error) {
      console.error("[WhatsApp] Error sending media:", error);
      showToast("فشل في إرسال الوسائط. حاول مرة أخرى.", 'error');
      // Remove optimistic message on error
      if (selectedContact && contactNumber === selectedContact) {
        setChats(prev => prev.filter(msg => msg.id !== Date.now()));
      }
    } finally {
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
        <div className="w-full h-[calc(100vh-8rem)] sm:h-[calc(100vh-8rem)]">
          {/* Main Chat Container */}
          <Card  className=" border-none  flex flex-col sm:flex-row h-full gradient-border">
          {/* Contacts List */}
          <div className="flex flex-col w-full sm:w-full h-full">
          <CardHeader className="border-text-primary/50 text-primary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">

          <div className="flex items-center gap-1 flex-wrap">
          <h3 className="text-xs sm:text-sm font-medium text-white p-1 rounded-md inner-shadow">جهات الاتصال {contacts.length}</h3>
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${botStatus?.isPaused ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-xs sm:text-sm text-white">
                {botStatus?.isPaused ? 'البوت متوقف' : 'البوت نشط'}
              </span>
              {botStatus?.isPaused && botStatus.timeRemaining > 0 && (
                <span className="text-xs text-yellow-500">
                  ({botStatus.timeRemaining} دقيقة متبقية)
                </span>
              )}  
            </div>
          <div className="flex items-center gap-2 sm:gap-3 sm:ml-70 flex-wrap">
           
           
           <div className="flex items-center gap-2">
                  {selectedContact && contacts.find(c => c.contactNumber === selectedContact)?.profilePicture ? <Image width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" src={`${contacts.find(c => c.contactNumber === selectedContact)?.profilePicture}`} alt="" /> : <Image width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" src="/user.gif" alt="" />}
                  <div className="flex flex-col">
                  {/* <span className="text-white text-xs sm:text-sm">
                      {selectedContact ? (() => {
                        const found = contacts.find(c => c.contactNumber === selectedContact);
                        return found?.contactName || '';
                      })() : ''}
                    </span> */}
           <span className="text-white font-medium text-xs sm:text-sm p-1 rounded-md truncate max-w-[150px] sm:max-w-none">
                    {selectedContact ? (() => {
                      // Prefer real contact name if available
                      const found = contacts.find(c => c.contactNumber === selectedContact);
                      if (found && found.contactNumber) return found.contactNumber;

                      // Fallback: format number as before
                      let num = selectedContact.replace(/@(s\.whatsapp\.net|c\.us|g\.us|lid)$/, '');
                      let cleanNum = num.replace(/\D/g, '');
                      
                      // Egypt numbers
                      if (cleanNum.startsWith('20') && cleanNum.length === 12) {
                        const localNum = '0' + cleanNum.substring(2);
                        if (localNum.length === 11 && localNum.startsWith('01')) {
                          return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                        }
                        return localNum;
                      } else if (cleanNum.startsWith('0') && cleanNum.length === 11) {
                        if (cleanNum.startsWith('01') || cleanNum.startsWith('02') || cleanNum.startsWith('03')) {
                          return cleanNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                        }
                        return cleanNum;
                      }
                      
                      // Saudi numbers
                      if (cleanNum.startsWith('966') && cleanNum.length === 12) {
                        const localNum = '0' + cleanNum.substring(3);
                        if (localNum.length === 10 && localNum.startsWith('05')) {
                          return localNum.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                        }
                        return localNum;
                      } else if (cleanNum.startsWith('05') && cleanNum.length === 10) {
                        return cleanNum.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                      }
                      
                      // LID numbers - try to extract real phone
                      if (cleanNum.length >= 15) {
                        const egyptMatch = cleanNum.match(/20\d{10}/);
                        if (egyptMatch) {
                          const egyptNum = egyptMatch[0];
                          const localNum = '0' + egyptNum.substring(2);
                          if (localNum.length === 11) {
                            return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                          }
                        }
                        
                        const saudiMatch = cleanNum.match(/966\d{9}/);
                        if (saudiMatch) {
                          const saudiNum = saudiMatch[0];
                          const localNum = '0' + saudiNum.substring(3);
                          if (localNum.length === 10) {
                            return localNum.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                          }
                        }
                        
                        // Try last digits
                        if (cleanNum.length >= 12) {
                          const last12 = cleanNum.slice(-12);
                          if (last12.startsWith('20') && /^20\d{10}$/.test(last12)) {
                            const localNum = '0' + last12.substring(2);
                            if (localNum.length === 11) {
                              return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                            }
                          }
                        }
                        
                        return cleanNum.length > 15 ? cleanNum.slice(-12) : cleanNum;
                      }
                      
                      return cleanNum || selectedContact;
                    })() : 'اختر جهة اتصال لعرض الرسائل'}
                  </span>
                   
                  </div>
           </div>
           
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {/* {botStatus?.isPaused 
              ? "Bot will not respond to incoming messages. Resume manually or wait for auto-resume."
              : "Bot is actively responding to incoming messages. Pause when you want to take over conversations."
            } */}
          </div>
      
          <div className="gap-2 sm:gap-3 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  
                  {/* {isAutoRefreshing && (
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>تحديث تلقائي</span>
                    </div>
                  )} */}
                </div>
                {selectedContact && (
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    {/* <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => loadChatHistory(selectedContact)}
                      className="text-xs"
                      disabled={isAutoRefreshing}
                    >
                      {isAutoRefreshing ? 'جاري التحديث...' : 'Refresh'}
                    </Button> */}
                     <div className="flex gap-1 sm:gap-2 flex-wrap">
              {botStatus?.isPaused ? (
                <Button 
                  size="sm" 
                  onClick={handleResumeBot}
                  disabled={botControlLoading}
                  className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
                >
                  {botControlLoading ? 'جاري الاستئناف...' : 'استئناف البوت'}
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    onClick={() => handlePauseBot(30)}
                    disabled={botControlLoading}
                    className="bg-transparent text-white border border-text-primary/50 inner-shadow text-xs sm:text-sm"
                  >
                    إيقاف البوت 30 د
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handlePauseBot(60)}
                    disabled={botControlLoading}
                    className="bg-transparent text-white border border-text-primary/50 inner-shadow text-xs sm:text-sm"
                  >
                    إيقاف البوت ساعة
                  </Button>
                </div>
              )}
            </div>
                    <Button 
                      size="sm" 
                      onClick={openTagModal}
                      className="text-xs primary-button"
                    >
                      + إضافة إلى تصنيف
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => { setNoteText(""); setShowNoteModal(true); }}
                      className="text-xs bg-transparent text-white border border-text-primary/50 inner-shadow"
                    >
                      أضف ملاحظة
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className=" overflow-y-auto h-full w-full flex flex-col sm:flex-row">
            <div className="space-y-2 w-full sm:w-1/3 border-b sm:border-b-0 sm:border-l border-text-primary/50 max-h-[300px] sm:max-h-none overflow-y-auto">
              {contacts.map((contact, index) => (
                <div
                  key={contact.contactNumber || `contact-${index}`}
                  onClick={() => {
                    if (contact.contactNumber) {
                      setSelectedContact(contact.contactNumber);
                      loadChatHistory(contact.contactNumber);
                    }
                  }}
                  className={`p-2 sm:p-3 rounded-md cursor-pointer transition-colors flex items-center justify-between ${
                    selectedContact === contact.contactNumber
                      ? ' inner-shadow'
                      : openNoteContacts.has(contact.contactNumber) ? 'bg-yellow-600/30' : 'bg-secondry'
                  }`}
                >
                   <div className="flex items-center gap-2">
                   {contact.profilePicture ? (
                    <Image width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" src={contact.profilePicture} alt={contact.contactName || contact.contactNumber} />
                  ) : contact.messageCount > 0 ? (
                    <Image width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" src="/belll.gif" alt="" />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondry flex items-center justify-center text-white font-medium">
                      {/* {contact.contactName 
                        ? contact.contactName.charAt(0).toUpperCase() 
                        : (contact.contactNumber && contact.contactNumber.length > 0)
                          ? contact.contactNumber.charAt(0).toUpperCase()
                          : '?'} */}
                          <Image width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" src="/user.gif" alt="" />
                    </div>
                  )}
                   <div className="flex flex-col">
                   <div className="font-medium text-sm sm:text-md text-white truncate max-w-[120px] sm:max-w-none">{contact.contactName || 'عميل جديد'}</div>
                    {/* <div className="font-medium text-sm text-white">
                      {(() => {
                        // Check if contactNumber exists
                        if (!contact.contactNumber) {
                          return 'رقم غير متاح';
                        }
                        
                        // Remove WhatsApp suffixes
                        let num = contact.contactNumber.replace(/@(s\.whatsapp\.net|c\.us|g\.us|lid)$/, '');
                        // Remove all non-digits to get clean number
                        let cleanNum = num.replace(/\D/g, '');
                        
                        // ✅ Egypt numbers - International format: 201234567890
                        if (cleanNum.startsWith('20') && cleanNum.length === 12) {
                          const localNum = '0' + cleanNum.substring(2);
                          // Format: 01XX XXX XXXX (Egypt mobile format)
                          if (localNum.length === 11 && localNum.startsWith('01')) {
                            return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                          }
                          // Format: 02XX XXX XXXX (Egypt landline format)
                          else if (localNum.length === 11 && localNum.startsWith('02')) {
                            return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                          }
                          // Format: 03XX XXX XXXX (Egypt mobile format)
                          else if (localNum.length === 11 && localNum.startsWith('03')) {
                            return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                          }
                          // Return formatted local number
                          return localNum;
                        }
                        // ✅ Egypt local format: 01234567890 or 02XXXXXXXXX
                        else if (cleanNum.startsWith('0') && cleanNum.length === 11) {
                          // Format: 01XX XXX XXXX (mobile)
                          if (cleanNum.startsWith('01')) {
                            return cleanNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                          }
                          // Format: 02XX XXX XXXX (landline)
                          else if (cleanNum.startsWith('02')) {
                            return cleanNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                          }
                          // Format: 03XX XXX XXXX (mobile)
                          else if (cleanNum.startsWith('03')) {
                            return cleanNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                          }
                          // Other Egypt formats
                          return cleanNum;
                        }
                        // ✅ Saudi - International format: 966501234567
                        else if (cleanNum.startsWith('966') && cleanNum.length === 12) {
                          const localNum = '0' + cleanNum.substring(3);
                          // Format: 05X XXX XXXX (Saudi mobile format)
                          if (localNum.length === 10 && localNum.startsWith('05')) {
                            return localNum.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                          }
                          return localNum;
                        }
                        // ✅ Saudi local format: 0501234567
                        else if (cleanNum.startsWith('05') && cleanNum.length === 10) {
                          return cleanNum.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                        }
                        // ✅ Check if it's a LID number (15+ digits) - try to extract real phone
                        else if (cleanNum.length >= 15) {
                          // This is likely a LID - try to extract real phone from it
                          // Sometimes LID contains the real phone number embedded
                          // Try to find a valid phone pattern within the LID
                          
                          // Try Egypt format: 20XXXXXXXXXX (12 digits)
                          const egyptMatch = cleanNum.match(/20\d{10}/);
                          if (egyptMatch) {
                            const egyptNum = egyptMatch[0];
                            const localNum = '0' + egyptNum.substring(2);
                            if (localNum.length === 11 && localNum.startsWith('01')) {
                              return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                            }
                            return localNum;
                          }
                          
                          // Try Saudi format: 966XXXXXXXXXX (12 digits)
                          const saudiMatch = cleanNum.match(/966\d{9}/);
                          if (saudiMatch) {
                            const saudiNum = saudiMatch[0];
                            const localNum = '0' + saudiNum.substring(3);
                            if (localNum.length === 10 && localNum.startsWith('05')) {
                              return localNum.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                            }
                            return localNum;
                          }
                          
                          // Try to find any 10-12 digit sequence that looks like a phone number
                          // Check if LID ends with a valid phone number pattern
                          if (cleanNum.length >= 12) {
                            // Try last 12 digits (Egypt international)
                            const last12 = cleanNum.slice(-12);
                            if (last12.startsWith('20') && /^20\d{10}$/.test(last12)) {
                              const localNum = '0' + last12.substring(2);
                              if (localNum.length === 11) {
                                return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                              }
                            }
                            
                            // Try last 11 digits (Egypt local)
                            const last11 = cleanNum.slice(-11);
                            if (last11.startsWith('0') && /^0\d{10}$/.test(last11)) {
                              if (last11.startsWith('01') || last11.startsWith('02') || last11.startsWith('03')) {
                                return last11.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                              }
                            }
                            
                            // Try last 10 digits (Saudi local)
                            const last10 = cleanNum.slice(-10);
                            if (last10.startsWith('05') && /^05\d{8}$/.test(last10)) {
                              return last10.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                            }
                          }
                          
                          // If we can't extract a real phone, show a shortened version
                          return cleanNum.length > 15 ? cleanNum.slice(-12) : cleanNum;
                        }
                        // ✅ Other numbers: Return as stored (preserve original format)
                        else {
                          return cleanNum || contact.contactNumber;
                        }
                      })()}
                    </div> */}
                    
                   </div>
                  {/* <div className="text-xs text-orange-300">
                    {contact.messageCount} رسالة • {new Date(contact.lastMessageTime).toLocaleDateString()}
                  </div> */}
                  </div>
                 
                  {contact.contactNumber && contactTags[contact.contactNumber] && contactTags[contact.contactNumber].length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contactTags[contact.contactNumber].map((tag, index) => (
                          <span key={index} className="text-xs bg-secondry border-1 border-blue-300 text-white px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
            {/* Chat Messages */}
          <div className="flex flex-col w-full h-full min-h-0">
            {/* Chat Header */}
            
            {/* Active Note - Fixed at top */}
            {selectedContact && activeNote && activeNote.status === 'open' && (
              <div className="flex-shrink-0 p-2 sm:p-4 pb-0">
                <div className="p-3 rounded-md bg-yellow-600/20 border border-yellow-500 text-yellow-200 flex items-start justify-between gap-3">
                  <div className="text-sm whitespace-pre-wrap flex-1">{activeNote.note}</div>
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      if (!activeNote) return;
                      try {
                        await resolveChatNote(token, activeNote.id);
                        setActiveNote(null);
                        setOpenNoteContacts(prev => {
                          const s = new Set(prev);
                          s.delete(selectedContact);
                          return s;
                        });
                        showToast('تم تعليم الملاحظة كمحلولة', 'success');
                      } catch (e: any) {
                        showToast(e.message || 'فشل في تحديث الملاحظة', 'error');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                   تعيين تم الحل ✓
                  </Button>
                </div>
              </div>
            )}
            
            {/* Messages Display */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 sm:p-4 scrollbar-hide">
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
                        {chats.map((chat) => {
                          // Get contact profile picture for incoming messages
                          const contactProfile = contacts.find(c => c.contactNumber === selectedContact);
                          const profilePicture = contactProfile?.profilePicture;
                          
                          return (
                          <div
                            key={chat.id}
                            className={`flex items-end gap-2 ${chat.messageType === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                          >
                            {/* Avatar for incoming messages (user's profile picture) */}
                            {chat.messageType === 'incoming' && (
                              <div className="flex-shrink-0">
                                {profilePicture ? (
                                  <Image width={40} height={40} 
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" 
                                    src={profilePicture} 
                                    alt="Contact" 
                                  />
                                ) : (
                                  <Image width={40} height={40} 
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" 
                                    src="/user.gif" 
                                    alt="Contact" 
                                  />
                                )}
                              </div>
                            )}
                            
                            <div
                              className={`max-w-[85%] sm:max-w-xs p-2 sm:p-3 rounded-lg ${
                                chat.messageType === 'outgoing'
                                  ? 'bg-card inner-shadow text-white'
                                  : ' inner-shadow text-gray-200'
                              }`}
                            >
                              {/* Media Content */}
                              {chat.contentType === 'image' && chat.mediaUrl && (
                                <div className="mb-2">
                                  <Image width={40} height={40} 
                                    src={chat.mediaUrl.startsWith('data:') || chat.mediaUrl.startsWith('http') 
                                      ? chat.mediaUrl 
                                      : `${process.env.NEXT_PUBLIC_API_URL}${chat.mediaUrl}`} 
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
                                    src={chat.mediaUrl.startsWith('data:') || chat.mediaUrl.startsWith('http') 
                                      ? chat.mediaUrl 
                                      : `${process.env.NEXT_PUBLIC_API_URL}${chat.mediaUrl}`} 
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
                                        href={chat.mediaUrl.startsWith('http') 
                                          ? chat.mediaUrl 
                                          : `${process.env.NEXT_PUBLIC_API_URL}${chat.mediaUrl}`} 
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
                              
                              {/* Text Content - Only show if not a media-only message */}
                              {(() => {
                                // Helper function to check if messageContent is just a media placeholder
                                const isMediaPlaceholder = (content: string, contentType: string) => {
                                  const normalized = content.trim().toLowerCase();
                                  const placeholders = [
                                    contentType.toLowerCase(),
                                    `[${contentType.toLowerCase()}]`,
                                    contentType,
                                    `[${contentType.toUpperCase()}]`,
                                    contentType.toUpperCase()
                                  ];
                                  return placeholders.includes(normalized) || placeholders.includes(content.trim());
                                };
                                
                                // Only show text if:
                                // 1. messageContent exists and is not empty
                                // 2. It's not a media placeholder when mediaUrl exists
                                const hasMedia = (chat.contentType === 'image' || chat.contentType === 'video' || chat.contentType === 'audio' || chat.contentType === 'document') && chat.mediaUrl;
                                const isPlaceholder = hasMedia && chat.messageContent && isMediaPlaceholder(chat.messageContent, chat.contentType);
                                
                                return chat.messageContent && 
                               chat.messageContent.trim() !== '' && 
                                  !isPlaceholder && (
                                <div
                                  className="text-sm whitespace-pre-wrap break-words"
                                  dangerouslySetInnerHTML={{ __html: linkify(chat.messageContent) }}
                                />
                                  );
                              })()}
                              <div className="text-xs mt-1 opacity-70">
                                {new Date(chat.timestamp).toLocaleTimeString()}
                                {chat.responseSource && (
                                  <span className="ml-2">
                                    ({chat.responseSource === 'knowledge_base' ? 'KB' : chat.responseSource === 'openai' || chat.responseSource=== "gemini" ? 'AI' : user?.name})
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Bot icon for outgoing messages (bot's response) */}
                            {chat.messageType === 'outgoing' && (
                              (chat.responseSource === 'gemini' || chat.responseSource === 'openai') ? (
                                <Image 
                                  width={40}
                                  height={40}
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" 
                                  src="/Bot.gif" 
                                  alt="Bot" 
                                />
                              ) : (
                                <Image width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" src="/user.gif" alt="User" />
                              )
                            )}
                          </div>
                        );
                        })}
                      </>
                    )}
                    {/* Invisible element to scroll to */}
                    <div ref={messagesEndRef} />
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">اختر جهة اتصال لعرض سجل المحادثة</p>
              )}
            </div>

            {/* Message Input - Fixed at bottom */}
            {selectedContact && (
              <div className="border-t border-gray-700 p-2 sm:p-4 flex-shrink-0">
                {/* Media Upload Section */}
                {mediaFile && (
                  <div className="mb-4 p-4 bg-dark-custom rounded-lg">
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
                        <Image width={40} height={40} 
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
                        className="w-full px-3 bg-[#01191040] py-2 border border-gray-500 rounded-md focus:outline-none  text-white placeholder-gray-400 "
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
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    
                    className="px-0 flex-shrink-0"
                    title="إضافة إيموجي"
                  >
                    <Image width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10" src="/imogi.gif" alt="" />
                    {/* <AnimatedEmoji emoji="😊" size={20} /> */}
                  </button>
                  <label className="text-white px-0 py-2 rounded cursor-pointer flex items-center flex-shrink-0">
                    <Image width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10" src="/img.gif" alt="" />
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaSelect}
                      className="hidden"
                    />
                  </label>
                  <button 
                    onClick={() => handleSendMessage(selectedContact, testMessage)}
                    disabled={!testMessage.trim()}
                    className="flex-shrink-0"
                  >
                    <Image width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10" src="/telegram.gif" alt="" />
                  </button>
                 
                  <input
                    type="text"
                    placeholder="اكتب رسالتك..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="flex-1 px-2 sm:px-3 bg-[#01191040] py-2 sm:py-4 border border-blue-300 rounded-2xl text-sm sm:text-base text-white placeholder-white/50 min-w-0"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage(selectedContact, testMessage);
                      }
                    }}
                  />
                </div>
                {showEmojiPicker && (
                  <div className="mt-2">
                    <EmojiPickerInline
                      isOpen={showEmojiPicker}
                      onClose={() => setShowEmojiPicker(false)}
                      onEmojiSelect={(emoji) => {
                        setTestMessage(prev => prev + emoji);
                      }}
                      position="bottom"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          </CardContent>
          </div>


          {/* Note Modal */}
          {showNoteModal && (
            <div className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-lg gradient-border rounded-lg p-4 border border-text-primary/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-lg font-semibold">إضافة ملاحظة على الشات</h3>
                  <button onClick={() => setShowNoteModal(false)} className="text-red-400 cursor-pointer">✕</button>
                </div>
                <textarea 
                  className="w-full h-32 p-3 rounded-md bg-[#01191040] text-white border-1 border-blue-300 outline-none"
                  placeholder="اكتب ملاحظتك هنا..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button 
                    variant="secondary"
                    onClick={() => setShowNoteModal(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!selectedContact || !noteText.trim()) return;
                      try {
                        setSavingNote(true);
                        const res = await createChatNote(token, { contactNumber: selectedContact, note: noteText.trim() });
                        if (res.success) {
                          setActiveNote(res.note as any);
                          setOpenNoteContacts(prev => new Set(prev).add(selectedContact));
                          showToast('تم حفظ الملاحظة بنجاح', 'success');
                          setShowNoteModal(false);
                          setNoteText("");
                        }
                      } catch (e: any) {
                        showToast(e.message || 'فشل في حفظ الملاحظة', 'error');
                      } finally {
                        setSavingNote(false);
                      }
                    }}
                    disabled={savingNote || !noteText.trim()}
                    className="bg-green-600 hover:bg-green-700 cursor-pointer"
                  >
                    {savingNote ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
        </Card>
        </div>
      </div>
      
      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowTagModal(false)} />
          <div className="relative z-10 w-full max-w-xl gradient-border rounded p-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-lg font-medium mb-3">إضافة إلى تصنيف</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">جهة الاتصال</label>
                <select
                  className="w-full bg-[#01191040]  rounded px-3 py-2 text-white"
                  value={selectedContactForTag}
                  onChange={(e) => setSelectedContactForTag(e.target.value)}
                >
                  <option value="">اختر جهة اتصال</option>
                  {contacts.map(c => (
                    <option key={c.contactNumber} value={c.contactNumber}>
                      {(() => {
                        // Remove WhatsApp suffixes
                        let num = c.contactNumber.replace(/@(s\.whatsapp\.net|c\.us|g\.us|lid)$/, '');
                        // Remove all non-digits
                        num = num.replace(/\D/g, '');
                        
                        // ✅ Egypt numbers: 20XXXXXXXXXX -> 01XXXXXXXXX or 01234567890
                        if (num.startsWith('20') && num.length === 12) {
                          num = '0' + num.substring(2);
                          // Format: 01XX XXX XXXX
                          if (num.length === 11 && num.startsWith('01')) {
                            return num.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                          }
                        }
                        // ✅ Egypt local: 01234567890
                        else if (num.startsWith('01') && num.length === 11) {
                          return num.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                        }
                        // ✅ Saudi: 966501234567 -> 0501234567
                        else if (num.startsWith('966') && num.length === 12) {
                          num = '0' + num.substring(3);
                          if (num.length === 10 && num.startsWith('05')) {
                            return num.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                          }
                        }
                        // ✅ Saudi local: 0501234567
                        else if (num.startsWith('05') && num.length === 10) {
                          return num.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                        }
                        
                        // ✅ Check if it's a LID number (15+ digits) - try to extract real phone
                        if (num.length >= 15) {
                          // Try to extract real phone from LID
                          const egyptMatch = num.match(/20\d{10}/);
                          if (egyptMatch) {
                            const egyptNum = egyptMatch[0];
                            const localNum = '0' + egyptNum.substring(2);
                            if (localNum.length === 11 && localNum.startsWith('01')) {
                              return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                            }
                            return localNum;
                          }
                          
                          const saudiMatch = num.match(/966\d{9}/);
                          if (saudiMatch) {
                            const saudiNum = saudiMatch[0];
                            const localNum = '0' + saudiNum.substring(3);
                            if (localNum.length === 10 && localNum.startsWith('05')) {
                              return localNum.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                            }
                            return localNum;
                          }
                          
                          // Try last digits
                          if (num.length >= 12) {
                            const last12 = num.slice(-12);
                            if (last12.startsWith('20') && /^20\d{10}$/.test(last12)) {
                              const localNum = '0' + last12.substring(2);
                              if (localNum.length === 11) {
                                return localNum.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                              }
                            }
                            
                            const last11 = num.slice(-11);
                            if (last11.startsWith('0') && /^0\d{10}$/.test(last11)) {
                              if (last11.startsWith('01') || last11.startsWith('02') || last11.startsWith('03')) {
                                return last11.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
                              }
                            }
                            
                            const last10 = num.slice(-10);
                            if (last10.startsWith('05') && /^05\d{8}$/.test(last10)) {
                              return last10.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
                            }
                          }
                          
                          // If we can't extract, show shortened version
                          return num.length > 15 ? num.slice(-12) : num;
                        }
                        
                        // Return as is if not in expected format
                        return num || c.contactNumber;
                      })()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">التصنيف</label>
                <select
                  className="w-full bg-[#01191040]  rounded px-3 py-2 text-white"
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
                  className="flex-1 bg-[#01191040]  rounded px-3 py-2 text-white placeholder-white"
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
                <button  onClick={handleAddToTag} disabled={!selectedTagId || !selectedContactForTag || tagLoading} className="after:bg-[#01191040] before:bg-[#01191080]  w-full primary-button">
                  {tagLoading ? 'جاري الإضافة...' : 'إضافة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}