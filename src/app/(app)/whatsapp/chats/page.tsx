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
  listEmployees,
  markChatAsRead,
  toggleAiBlock,
} from "@/lib/api";
import React, { useMemo, useCallback } from "react";
import { listTags, addContactToTag, createTag, listContactsByTag } from "@/lib/tagsApi";
import { sendWhatsAppMedia } from "@/lib/mediaApi";
import { getBotStatus, pauseBot, resumeBot, BotStatus } from "@/lib/botControlApi";
import AnimatedEmoji, { EmojiPickerInline } from "@/components/AnimatedEmoji";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import { 
  getPendingEscalationContacts, 
  resolveEscalationByContact,
  escalateChat,
  ChatEscalation
} from "@/lib/escalationApi";

import { Input } from "@/components/ui/input";
import { Search, Filter, Smile, Plus, SendHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { createPortal } from "react-dom";

// Memoized Contact Item Component moved outside to prevent re-creation on render
const ContactItem = React.memo(({ contact, isSelected, isEscalated, isOpenNote, mentionName, tags, onClick, cachedProfilePicture }: any) => {
  const handleClick = useCallback(() => {
    onClick(contact.contactNumber);
  }, [contact.contactNumber, onClick]);

  // Use cached profile picture to prevent disappearing
  const profilePic = cachedProfilePicture || contact.profilePicture;

  return (
    <div
      onClick={handleClick}
      className={`p-1 ml-1 rounded-md cursor-pointer transition-colors flex items-center justify-between relative overflow-hidden ${
        isSelected ? ' inner-shadow' : 'bg-secondry'
      }`}
    >
      {/* Escalation Indicator (Red Corner Triangle - Top Right) */}
      {isEscalated && (
        <div 
          className="absolute top-0 right-0 w-6 h-6 bg-red-500/90 z-20" 
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
        />
      )}

      {/* Note Indicator (Yellow Corner Triangle - Top Left) */}
      {isOpenNote && (
        <div 
          className="absolute top-0 right-0 w-6 h-6 bg-yellow-500/90 z-20" 
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
        />
      )}
      
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          {profilePic ? (
            <img width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover" src={profilePic} alt={contact.contactName || contact.contactNumber} loading="lazy" />
          ) : (
            <img width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" src="/user.gif" alt="" loading="lazy" />
          )}
          {contact.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse z-10 border-1 border-white/20">
              {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-start overflow-hidden min-w-0 flex-1">
          <div className="font-medium text-sm sm:text-md text-white truncate w-full">{contact.contactName || 'عميل جديد'}</div>
          {contact.lastMessage && (
            <div className="text-[10px] sm:text-xs text-white/40 truncate w-full mt-0.5">
              {contact.lastMessage}
            </div>
          )}
          <div className="text-[10px] text-white/30 truncate w-full text-right" dir="ltr">
            {contact.contactNumber?.replace(/@(s\.whatsapp\.net|c\.us|g\.us|lid)$/, '')}
          </div>
          {(tags && tags.length > 0 || mentionName) && (
            <div className="flex items-center justify-between w-full mt-1 gap-1">
              <div className="flex flex-wrap gap-1 min-w-0">
                {tags && tags.slice(0, 3).map((tag: string, index: number) => (
                  <span key={index} className="text-[8px] sm:text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-300 px-1 py-0 rounded-sm truncate max-w-[50px]">
                    {tag}
                  </span>
                ))}
                {tags && tags.length > 3 && <span className="text-[8px] text-gray-400">+{tags.length - 3}</span>}
              </div>
              {mentionName && (
                <span className="text-[8px] sm:text-[9px] bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-1 py-0 rounded-sm flex items-center gap-0.5 flex-shrink-0">
                   {mentionName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.contact.contactNumber === next.contact.contactNumber &&
         prev.contact.lastMessageTime === next.contact.lastMessageTime &&
         prev.contact.lastMessage === next.contact.lastMessage &&
         prev.isSelected === next.isSelected &&
         prev.isEscalated === next.isEscalated &&
         prev.isOpenNote === next.isOpenNote &&
         prev.mentionName === next.mentionName &&
         prev.cachedProfilePicture === next.cachedProfilePicture &&
         prev.onClick === next.onClick &&
         JSON.stringify(prev.tags) === JSON.stringify(next.tags);
});

interface WhatsAppContact {
  contactNumber: string;
  messageCount: number;
  lastMessageTime: string;
  profilePicture?: string | null;
  contactName?: string | null;
  isGroup?: boolean;
  unreadCount?: number;
  isAiBlocked?: boolean;
  lastMessage?: string | null;
}

export default function WhatsAppChatsPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
  useEffect(() => {
    if (inputRef.current && !testMessage) {
      inputRef.current.style.height = '48px';
    }
  }, [testMessage]);
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
  // Contacts state with localStorage persistence
  const [contacts, setContacts] = useState<WhatsAppContact[]>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('whatsapp_contacts_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          // Only use cache if it's less than 5 minutes old
          if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            console.log('[Cache] Loaded contacts from localStorage:', parsed.data.length);
            return parsed.data;
          }
        }
      } catch (e) {
        console.error('[Cache] Failed to load contacts:', e);
      }
    }
    return [];
  });

  // Save contacts to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && contacts.length > 0) {
      try {
        localStorage.setItem('whatsapp_contacts_cache', JSON.stringify({
          data: contacts,
          timestamp: Date.now()
        }));
        console.log('[Cache] Saved contacts to localStorage:', contacts.length);
      } catch (e) {
        console.error('[Cache] Failed to save contacts:', e);
      }
    }
  }, [contacts]);
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
  const [availableTags, setAvailableTags] = useState<Array<{ id: number; name: string }>>([]);
  const [filterTagId, setFilterTagId] = useState<string>("");
  const [showOnlyEscalated, setShowOnlyEscalated] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [contactsInSelectedFilter, setContactsInSelectedFilter] = useState<Set<string> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Notes state
  const [openNoteContacts, setOpenNoteContacts] = useState<Set<string>>(new Set());
  const [openNoteMentions, setOpenNoteMentions] = useState<{[key: string]: string}>({});
  const [activeNote, setActiveNote] = useState<{ id: number; contactNumber: string; note: string; status: 'open' | 'resolved' } | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedMentionEmployeeId, setSelectedMentionEmployeeId] = useState<string>("none");
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("all");

  // Escalation state
  const [escalatedContacts, setEscalatedContacts] = useState<Set<string>>(new Set());
  const [isEscalating, setIsEscalating] = useState(false);

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  
  // Contacts pagination
  const [contactsOffset, setContactsOffset] = useState(0);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [loadingMoreContacts, setLoadingMoreContacts] = useState(false);
  const CONTACTS_PER_PAGE = 50;

  // Search effect to reload contacts from server
  useEffect(() => {
    if (token) {
      const delayDebounceFn = setTimeout(() => {
        loadChatContacts(true, true);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, token]);
  
  // Profile picture cache to prevent disappearing - with localStorage persistence
  const [profilePictureCache, setProfilePictureCache] = useState<{[key: string]: string}>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('whatsapp_profile_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          // Only use cache if it's less than 24 hours old
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            console.log('[Cache] Loaded profile pictures from localStorage:', Object.keys(parsed.data).length);
            return parsed.data;
          }
        }
      } catch (e) {
        console.error('[Cache] Failed to load from localStorage:', e);
      }
    }
    return {};
  });

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(profilePictureCache).length > 0) {
      try {
        localStorage.setItem('whatsapp_profile_cache', JSON.stringify({
          data: profilePictureCache,
          timestamp: Date.now()
        }));
        console.log('[Cache] Saved profile pictures to localStorage:', Object.keys(profilePictureCache).length);
      } catch (e) {
        console.error('[Cache] Failed to save to localStorage:', e);
      }
    }
  }, [profilePictureCache]);

  // Mobile detection for full-screen chat
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // iOS Safari viewport height fix
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (selectedContact && isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [selectedContact, isMobile]);

  // Ref for messages container to scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
      // ✅ CRITICAL: Only load if we don't have contacts already
      if (contacts.length === 0) {
        loadChatContacts(true, true); // Initial load with pagination
      }
      loadBotStatus();
      loadEmployees();
      // Load open notes for highlighting
      (async () => {
        try {
          // Load open notes
          const data = await getOpenChatNotes(token);
          if (data.success) {
            setOpenNoteContacts(new Set(data.contacts || []));
            const mentions: {[key: string]: string} = {};
            (data.notes || []).forEach((note: any) => {
              if (note.mentionEmployeeName) {
                mentions[note.contactNumber] = note.mentionEmployeeName;
              }
            });
            setOpenNoteMentions(mentions);
          }
          
          // Load escalated contacts
          const escalationData = await getPendingEscalationContacts();
          if (escalationData.success) {
            setEscalatedContacts(new Set(escalationData.contacts || []));
          }
          
          // Load available tags for filter
          const tagsRes = await listTags();
          if (tagsRes.success) {
            setAvailableTags(tagsRes.data || []);
          }
        } catch (_) {}
      })();
    }
  }, [token]); // ✅ Remove contacts.length from dependencies to prevent re-render loop

  async function loadEmployees() {
    try {
      const res = await listEmployees(token);
      if (res.success) {
        setEmployees(res.employees || []);
      }
    } catch (e) {
      console.error("Failed to load employees:", e);
    }
  }

  // Load chat data when contact is selected
  useEffect(() => {
    if (selectedContact && token) {
      setOffset(0);
      setHasMore(true);
      setInitialLoading(true);
      loadChatHistory(selectedContact, false, false, true);
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

  // Auto-refresh chat list (contacts) - Less frequent to reduce load
  useEffect(() => {
    if (!token) return;
    
    // ✅ CRITICAL: Only refresh if user is on the page (not in background)
    let isActive = true;
    
    const handleVisibilityChange = () => {
      isActive = !document.hidden;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Refresh contacts list every 30 seconds (only if page is visible)
    const interval = setInterval(() => {
      if (isActive && !document.hidden) {
        console.log('[Auto-refresh] Refreshing contacts...');
        loadChatContacts(false, false);
      }
    }, 30000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token]);

  // Scroll to bottom when chats are loaded or updated
  useEffect(() => {
    if (chats.length > 0 && messagesContainerRef.current) {
      if (initialLoading) {
        // Force scroll to bottom on initial load
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
          setInitialLoading(false);
        }, 150);
      } else {
        // Smart scroll: only scroll if user is near bottom
        const container = messagesContainerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        
        if (isNearBottom) {
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 150);
        }
      }
    }
  }, [chats, selectedContact, initialLoading]);

  async function loadChatHistory(contactNumber: string, isAutoRefresh: boolean = false, isLoadMore: boolean = false, isNewContact: boolean = false) {
    // Immediately mark as read on opening a chat (optimistic UI)
    if (!isAutoRefresh && !isLoadMore && token) {
      markChatAsRead(token, contactNumber).catch(e => console.error("Failed to mark as read:", e));
      setContacts(prev => prev.map(c => 
        c.contactNumber === contactNumber ? { ...c, unreadCount: 0 } : c
      ));
    }

    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
      }
      
      if (isLoadMore) {
        setLoadingMore(true);
      }
      
      const currentOffset = isLoadMore ? offset : 0;
      console.log(`[WhatsApp] Loading chat history for: ${contactNumber}, offset: ${currentOffset}`);
      const data = await getChatHistory(token, contactNumber, 50, currentOffset);
      console.log(`[WhatsApp] Chat history response:`, data);
      
      if (data.success) {
        const currentCount = (isLoadMore ? offset : 0) + data.chats.length;
        setHasMore(currentCount < data.total);
        
        if (isLoadMore) {
          setOffset(prev => prev + data.chats.length);
        } else if (isNewContact) {
          setOffset(data.chats.length);
        }

        const processedChats = data.chats.map((chat: any) => ({
          ...chat,
          contentType: chat.contentType || 'text',
          mediaUrl: chat.mediaUrl || undefined,
          mediaFilename: chat.mediaFilename || undefined,
          mediaMimetype: chat.mediaMimetype || undefined
        }));
        
        const serverChats = processedChats.reverse();
        
        // Save scroll height if loading more to preserve position
        const prevScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
        const prevScrollTop = messagesContainerRef.current?.scrollTop || 0;

        setChats(prev => {
          if (isLoadMore) {
            // Filter out existing messages to avoid duplicates (though offset should handle this)
            const existingIds = new Set(prev.map(c => c.id));
            const newChats = serverChats.filter(c => !existingIds.has(c.id));
            return [...newChats, ...prev];
          }
          
          if (isNewContact) {
            return serverChats;
          }
          
          // Original refresh/merge logic
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
          
          // Preserve existing messages that are not being updated by the current refresh
          const serverIds = new Set(serverChats.map(c => c.id));
          const prevWithoutServerOrOptimistic = prev.filter(msg => {
            const isOptimistic = (typeof msg.id === 'number' && msg.id > 1000000000000) || (msg as any)._isOptimistic === true;
            return !serverIds.has(msg.id) && !matchedOptimisticIds.has(msg.id) && !isOptimistic;
          });

          // Combine all messages and sort by timestamp
          const allChats = [...prevWithoutServerOrOptimistic, ...mergedChats, ...unmatchedOptimistic];
          return allChats.sort((a, b) => {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          });
        });

        // After setting chats, if it was isLoadMore, adjust scroll to stay in place
        if (isLoadMore) {
          setTimeout(() => {
            if (messagesContainerRef.current) {
              const newScrollHeight = messagesContainerRef.current.scrollHeight;
              messagesContainerRef.current.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
            }
          }, 0);
        }
        
        console.log(`[WhatsApp] Loaded ${data.chats.length} messages`);
      } else {
        console.log(`[WhatsApp] Failed to load chat history:`, data);
      }
    } catch (e: any) {
      console.error(`[WhatsApp] Chat history error:`, e);
      setError(e.message);
    } finally {
      setIsAutoRefreshing(false);
      setLoadingMore(false);
    }
  }

  async function loadChatContacts(showLoader: boolean = true, isInitialLoad: boolean = false) {
    try {
      if (showLoader && isInitialLoad) {
        setLoadingContacts(true);
      } else if (!isInitialLoad) {
        setLoadingMoreContacts(true);
      }
      
      const currentOffset = isInitialLoad ? 0 : contactsOffset;
      
      // ✅ Call paginated API with search
      const data = await getChatContacts(token, CONTACTS_PER_PAGE, currentOffset, searchTerm);
      console.log('=== getChatContacts API Response (Paginated) ===');
      console.log('Contacts array length:', data.contacts?.length);
      console.log('Pagination info:', data.pagination);
      
      if (data.success) {
        // Helper to extract clean number for comparison
        const getCleanNumber = (num: string) => {
          let clean = num.replace(/@(s\.whatsapp\.net|c\.us|g\.us|lid)$/, '').replace(/\D/g, '');
          // Extract from LID if possible
          if (clean.length >= 15) {
             const egyptMatch = clean.match(/20\d{10}/);
             if (egyptMatch) return egyptMatch[0];
             const saudiMatch = clean.match(/966\d{9}/);
             if (saudiMatch) return saudiMatch[0];
             if (clean.length >= 12) {
                const last12 = clean.slice(-12);
                if (/^20\d{10}$/.test(last12)) return last12;
             }
             return clean.slice(-12);
          }
          return clean;
        };

        // Process and clean contacts from the current batch
        const cleanContacts = (data.contacts as any[]).filter(c => {
           if (c.isGroup) return false;
           if (c.contactNumber.includes('@lid')) return false;
           const clean = c.contactNumber.replace(/@(s\.whatsapp\.net|c\.us|g\.us|lid)$/, '').replace(/\D/g, '');
           if (clean.length > 13) return false;
           return true;
        });

        // Cache profile pictures
        let finalCache: {[key: string]: string} = {};
        setProfilePictureCache(prevCache => {
          const newCache = {...prevCache};
          cleanContacts.forEach((contact: any) => {
            if (contact.profilePicture && contact.contactNumber) {
              newCache[contact.contactNumber] = contact.profilePicture;
            }
          });
          finalCache = newCache;
          return newCache;
        });

        // Update pagination state
        if (data.pagination) {
          setHasMoreContacts(data.pagination.hasMore);
          if (isInitialLoad) {
            setContactsOffset(data.contacts.length);
          } else {
            setContactsOffset(prev => prev + data.contacts.length);
          }
        } else {
          // Fallback if pagination object is missing (shouldn't happen with new backend)
          setHasMoreContacts(data.contacts.length === CONTACTS_PER_PAGE);
          setContactsOffset(prev => isInitialLoad ? data.contacts.length : prev + data.contacts.length);
        }

        // Update contacts list
        const existingNumbers = new Set(contacts.map(c => c.contactNumber));
        const cleanAndMapped = cleanContacts.map(contact => ({
          ...contact,
          profilePicture: contact.profilePicture || finalCache[contact.contactNumber] || null
        }));
        
        const newContactsToAdd = cleanAndMapped.filter(c => !existingNumbers.has(c.contactNumber));
        
        // Check how many of the new contacts match current visibility filters
        const searchLower = searchTerm.toLowerCase();
        const visibleNewOnes = newContactsToAdd.filter(contact => {
          const matchesSearch = !searchTerm || 
            (contact.contactName || '').toLowerCase().includes(searchLower) || 
            (contact.contactNumber || '').toLowerCase().includes(searchLower);
          const matchesUnread = !showOnlyUnread || (contact.unreadCount && contact.unreadCount > 0);
          const matchesEscalation = !showOnlyEscalated || escalatedContacts.has(contact.contactNumber);
          return matchesSearch && matchesUnread && matchesEscalation;
        });
        
        const newVisibleCount = isInitialLoad ? visibleNewOnes.length : visibleNewOnes.length;
        
        setContacts(prev => {
          if (isInitialLoad) return cleanAndMapped;
          
          const prevNumbers = new Set(prev.map(c => c.contactNumber));
          const actualNew = cleanAndMapped.filter(c => !prevNumbers.has(c.contactNumber));
          
          const updatedPrev = prev.map(contact => ({
            ...contact,
            profilePicture: contact.profilePicture || finalCache[contact.contactNumber] || null
          }));
          
          return [...updatedPrev, ...actualNew];
        });
        
        // ✅ AUTO-FETCH: If we filtered everything out but there's more on the server, get next page automatically
        if (!isInitialLoad && visibleNewOnes.length === 0 && (data.pagination?.hasMore ?? (data.contacts.length === CONTACTS_PER_PAGE))) {
          console.log('[Pagination] No new visible contacts after filtering, fetching next batch...');
          setTimeout(() => loadChatContacts(false, false), 100);
          return;
        }

        // Load tags for the new contacts
        if (cleanContacts.length > 0) {
          setTimeout(() => loadContactTags(cleanContacts), 500);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (showLoader && isInitialLoad) {
        setLoadingContacts(false);
      } else {
        setLoadingMoreContacts(false);
      }
    }
  }

  async function loadContactTags(contacts: WhatsAppContact[]) {
    try {
      const tagsMap: {[key: string]: string[]} = {};
      
      // Load all tags first
      const tagsRes = await listTags();
      if (tagsRes.success) {
        const tags = tagsRes.data;
        
        // OPTIMIZATION: Instead of N*M calls (contacts * tags), we do M calls (tags)
        // This is much faster and reduces backend load
        // Use Promise.allSettled to prevent one failure from blocking all
        const promises = tags.map(async (tag: any) => {
          try {
            const contactsRes = await listContactsByTag(tag.id);
            if (contactsRes.success && contactsRes.data) {
              return { tagName: tag.name, contacts: contactsRes.data };
            }
          } catch (e) {
            console.error(`Failed to load contacts for tag ${tag.id}:`, e);
          }
          return null;
        });
        
        const results = await Promise.allSettled(promises);
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            result.value.contacts.forEach((c: any) => {
              if (!tagsMap[c.contactNumber]) tagsMap[c.contactNumber] = [];
              tagsMap[c.contactNumber].push(result.value.tagName);
            });
          }
        });
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

  function openNoteModal() {
    setNoteText("");
    setSelectedMentionEmployeeId("none");
    setShowNoteModal(true);
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

  // Fetch contacts for selected tag filter
  useEffect(() => {
    async function loadFilterContacts() {
      if (!filterTagId) {
        setContactsInSelectedFilter(null);
        return;
      }
      
      try {
        const res = await listContactsByTag(parseInt(filterTagId));
        if (res.success && res.data) {
          setContactsInSelectedFilter(new Set((res.data as any[]).map((c: any) => c.contactNumber)));
        } else {
          setContactsInSelectedFilter(new Set());
        }
      } catch (e) {
        console.error("Failed to filter by tag", e);
        setContactsInSelectedFilter(new Set());
      }
    }
    
    loadFilterContacts();
  }, [filterTagId]);

  // Filter contacts based on search and tag
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const searchLower = searchTerm.toLowerCase();
      const contactName = (contact.contactName || '').toLowerCase();
      const contactNumber = (contact.contactNumber || '').toLowerCase();
      
      // Search filter
      const matchesSearch = !searchTerm || 
        contactName.includes(searchLower) || 
        contactNumber.includes(searchLower);
        
      // Tag filter
      const matchesTag = !filterTagId || 
        (contactsInSelectedFilter && contactsInSelectedFilter.has(contact.contactNumber));

      // Escalation filter
      const matchesEscalation = !showOnlyEscalated || escalatedContacts.has(contact.contactNumber);

      // Mention filter
      const matchesMention = filterEmployeeId === "all" || 
        (openNoteMentions[contact.contactNumber] === employees.find(e => e.id.toString() === filterEmployeeId)?.name);

      // Unread filter
      const matchesUnread = !showOnlyUnread || (contact.unreadCount && contact.unreadCount > 0);

      return matchesSearch && matchesTag && matchesEscalation && matchesMention && matchesUnread;
    });
  }, [contacts, searchTerm, filterTagId, contactsInSelectedFilter, showOnlyEscalated, escalatedContacts, filterEmployeeId, openNoteMentions, employees, showOnlyUnread]);

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
            // Refresh contacts too to update order (move to top)
            loadChatContacts();
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

  async function handleToggleAiBlock() {
    if (!selectedContact || !token) return;
    try {
      setBotControlLoading(true);
      const res = await toggleAiBlock(token, selectedContact);
      if (res.success) {
        showToast(res.message, 'success');
        // Update contact state
        setContacts(prev => prev.map(c => 
          c.contactNumber === selectedContact ? { ...c, isAiBlocked: res.isAiBlocked } : c
        ));
      } else {
        showToast(res.message || 'فشل في تغيير حالة ردود الذكاء الاصطناعي', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setBotControlLoading(false);
    }
  }

  // Stable callback for contact item clicks
  const handleContactItemClick = useCallback((contactNumber: string) => {
    if (contactNumber) {
      setSelectedContact(contactNumber);
      loadChatHistory(contactNumber);
    }
  }, [token]); // Dependencies needed for inside loadChatHistory if any, but token is stable enough

  return (
    <>
      <div className={`space-y-2 ${(showTagModal || showNoteModal) ? 'blur-sm' : ''}`}>
        <div className="w-full h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
          {/* Main Chat Container */}
          <Card  className=" border-none  flex flex-col lg:flex-row h-full gradient-border">
          {/* Contacts List */}
          <div className="flex flex-col w-full lg:w-full h-full">
        
          <CardContent className=" overflow-y-auto h-full w-full flex flex-col lg:flex-row p-0 lg:p-2">
            <div className={`space-y-2 w-full lg:w-[20%] border-b lg:border-b-0 lg:border-l border-text-primary/50 h-full lg:h-auto overflow-y-auto scrollbar-hide p-2 ${selectedContact ? 'hidden lg:block' : 'block'}`}>
              {/* Desktop Search and Filter inside sidebar */}
              <div className="hidden lg:flex flex-col gap-2 mb-4 p-1">
                <div className="relative">
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث باسم العميل أو الرقم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8 h-9 text-[10px] bg-[#01191040] border-text-primary/30"
                  />
                </div>
              </div>
              {loadingContacts && contacts.length === 0 ? (
                <div className="space-y-3 p-3">
                  {/* Beautiful Skeleton Loader */}
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-secondry animate-pulse">
                      {/* Avatar Skeleton */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-shimmer"></div>
                      
                      {/* Content Skeleton */}
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded w-3/4 animate-shimmer"></div>
                        <div className="h-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded w-1/2 animate-shimmer"></div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading Text */}
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-blue-400">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-medium">جاري تحميل جهات الاتصال...</span>
                    </div>
                  </div>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {contacts.length === 0 ? 'لا توجد محادثات بعد' : 'لا توجد جهات اتصال مطابقة'}
                </div>
              ) : (
                <>
                  {filteredContacts.map((contact, index) => (
                    <ContactItem
                      key={contact.contactNumber}
                      contact={contact}
                      isSelected={selectedContact === contact.contactNumber}
                      isEscalated={escalatedContacts.has(contact.contactNumber)}
                      isOpenNote={openNoteContacts.has(contact.contactNumber)}
                      mentionName={openNoteMentions[contact.contactNumber]}
                      tags={contact.contactNumber ? contactTags[contact.contactNumber] : []}
                      cachedProfilePicture={contact.profilePicture || profilePictureCache[contact.contactNumber]}
                      onClick={handleContactItemClick}
                    />
                  ))}
                  
                  {/* Load More Button */}
                  {hasMoreContacts && !searchTerm && !filterTagId && (
                    <div className="flex justify-center py-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => loadChatContacts(false, false)}
                        disabled={loadingMoreContacts}
                        className="text-xs border-text-primary/30 bg-transparent text-white"
                      >
                        {loadingMoreContacts ? (
                          <div className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جاري التحميل...
                          </div>
                        ) : (
                          'عرض المزيد من جهات الاتصال'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}

            </div>
            {/* Chat Messages */}
          <div 
            className={`flex flex-col flex-1 min-h-0 ${selectedContact ? 'mobile-fullscreen-chat bg-dark-custom lg:!bg-transparent lg:!static lg:!z-auto lg:!h-full lg:flex-1' : 'hidden lg:flex h-full'}`}
          >
            {/* Mobile Header (Back button, Contact Info, and Actions) */}
            <div className="lg:hidden flex flex-col border-b border-text-primary/50 bg-secondry/50 backdrop-blur-md z-10">
              {/* Top Row: Navigation and Info */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedContact(null)} 
                    className="p-1 text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 rtl:rotate-180">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    {selectedContact && contacts.find(c => c.contactNumber === selectedContact)?.profilePicture ? 
                      <img width={40} height={40} className="w-10 h-10 rounded-full object-cover" src={`${contacts.find(c => c.contactNumber === selectedContact)?.profilePicture}`} alt="" /> : 
                      <img width={40} height={40} className="w-10 h-10 rounded-full" src="/user.gif" alt="" />
                    }
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-white font-medium text-xs truncate max-w-[120px]">
                        {(() => {
                          const found = contacts.find(c => c.contactNumber === selectedContact);
                          return found?.contactName || (selectedContact ? selectedContact.replace(/\D/g, '').slice(-11) : '');
                        })()}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${botStatus?.isPaused ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-[9px] text-gray-400">{botStatus?.isPaused ? 'البوت متوقف' : 'البوت متصل الآن'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Compact Refresh Button */}
                {/* <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => selectedContact && loadChatHistory(selectedContact)}
                  className="p-1 h-auto text-white/70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </Button> */}
              </div>

              {/* Bottom Row: Actions Scrollable */}
              <div className="grid grid-cols-4 gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
                {botStatus?.isPaused ? (
                  <Button 
                    size="sm" 
                    onClick={handleResumeBot}
                    disabled={botControlLoading}
                    className="bg-green-500 hover:bg-green-600 text-[10px] h-8 whitespace-nowrap"
                  >
                    استئناف البوت
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handlePauseBot(30)}
                      disabled={botControlLoading}
                      className="bg-transparent text-white border border-text-primary/50 inner-shadow text-[10px] h-8 whitespace-nowrap"
                    >
                      إيقاف 30 د
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handlePauseBot(60)}
                      disabled={botControlLoading}
                      className="bg-transparent text-white border border-text-primary/50 inner-shadow text-[10px] h-8 whitespace-nowrap"
                    >
                      إيقاف ساعة
                    </Button>
                  </>
                )}
                <Button 
                  size="sm" 
                  onClick={openTagModal}
                  className="text-[10px] h-8 whitespace-nowrap primary-button"
                >
                  + تصنيف
                </Button>
                <Button 
                  size="sm"
                  onClick={handleToggleAiBlock}
                  disabled={botControlLoading}
                  className={`text-[10px] h-8 whitespace-nowrap border border-text-primary/50 inner-shadow ${
                    contacts.find(c => c.contactNumber === selectedContact)?.isAiBlocked 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {contacts.find(c => c.contactNumber === selectedContact)?.isAiBlocked 
                    ? 'تفعيل AI' 
                    : 'تعطيل AI'}
                </Button>
                <Button 
                  size="sm"
                   onClick={openNoteModal}
                  className="text-[10px] h-8 whitespace-nowrap bg-transparent text-white border border-text-primary/50 inner-shadow"
                >
                  أضف ملاحظة
                </Button>
              </div>
            </div>
            {/* Chat Header */}
            
            {/* Active Escalation - Fixed at top */}
            {selectedContact && escalatedContacts.has(selectedContact) && (
              <div className="flex-shrink-0 p-2 sm:p-4 pb-0">
                <div className="p-3 rounded-md bg-red-900/30 border border-red-500 text-red-100 flex items-center justify-between gap-3 animate-pulse-slow">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🆘</span>
                    <div className="text-sm font-medium">
                      هذه المحادثة محولة لموظف وبانتظار الحل. البوت متوقف حالياً.
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      if (!selectedContact) return;
                      try {
                        const res = await resolveEscalationByContact(selectedContact);
                        if (res.success) {
                          setEscalatedContacts(prev => {
                            const s = new Set(prev);
                            s.delete(selectedContact);
                            return s;
                          });
                          showToast('تم حل المشكلة واستئناف البوت بنجاح', 'success');
                        }
                      } catch (e: any) {
                        showToast(e.message || 'فشل في حل المشكلة', 'error');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                  >
                    تم الحل (استئناف البوت)
                  </Button>
                </div>
              </div>
            )}

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
                        setOpenNoteMentions(prev => {
                          const next = { ...prev };
                          delete next[selectedContact];
                          return next;
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
                        {hasMore && (
                          <div className="flex justify-center mb-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => loadChatHistory(selectedContact, false, true)}
                              disabled={loadingMore}
                              className="text-xs border-text-primary/30 bg-transparent text-white"
                            >
                              {loadingMore ? 'جاري التحميل...' : 'عرض المزيد من الرسائل السابق'}
                            </Button>
                          </div>
                        )}
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
                                  <img width={32} height={32} 
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover" 
                                    src={profilePicture} 
                                    alt="Contact" 
                                  />
                                ) : (
                                  <img width={32} height={32} 
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" 
                                    src="/user.gif" 
                                    alt="Contact" 
                                  />
                                )}
                              </div>
                            )}
                            
                            <div
                              className={`max-w-[85%] sm:max-w-xs p-2 sm:p-3 rounded-lg relative ${
                                chat.messageType === 'outgoing'
                                  ? 'bg-[#005c4b]/80 inner-shadow text-white rounded-tr-none'
                                  : 'bg-[#202c33]/80 inner-shadow text-gray-200 rounded-tl-none'
                              }`}
                            >
                              {/* Media Content */}
                              {chat.contentType === 'image' && chat.mediaUrl && (
                                <div className="mb-2">
                                  <a 
                                    href={(() => {
                                      if (chat.mediaUrl?.startsWith('data:') || chat.mediaUrl?.startsWith('http')) return chat.mediaUrl;
                                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                                      const cleanPath = chat.mediaUrl?.replace(/\\/g, '/').replace(/^\//, '') || '';
                                      return `${apiUrl.replace(/\/$/, '')}/${cleanPath}`;
                                    })()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cursor-pointer"
                                  >
                                    <img 
                                      src={(() => {
                                        if (chat.mediaUrl?.startsWith('data:') || chat.mediaUrl?.startsWith('http')) return chat.mediaUrl;
                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                                        const cleanPath = chat.mediaUrl?.replace(/\\/g, '/').replace(/^\//, '') || '';
                                        return `${apiUrl.replace(/\/$/, '')}/${cleanPath}`;
                                      })()}
                                      alt="Sent image" 
                                      className="max-w-full h-auto rounded-lg hover:opacity-90 transition-opacity"
                                      onError={(e) => {
                                        console.error("Image load failed", chat.mediaUrl);
                                      }}
                                    />
                                  </a>
                                </div>
                              )}
                              
                              {chat.contentType === 'audio' && chat.mediaUrl && (
                                <div className="mb-2 p-2 bg-black bg-opacity-20 rounded min-w-[200px]">
                                  <audio 
                                    controls 
                                    className="w-full h-8"
                                    src={(() => {
                                      if (chat.mediaUrl?.startsWith('data:') || chat.mediaUrl?.startsWith('http')) return chat.mediaUrl;
                                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                                      const cleanPath = chat.mediaUrl?.replace(/\\/g, '/').replace(/^\//, '') || '';
                                      return `${apiUrl.replace(/\/$/, '')}/${cleanPath}`;
                                    })()}
                                  >
                                    Your browser does not support the audio element.
                                  </audio>
                                </div>
                              )}
                              
                              {chat.contentType === 'video' && chat.mediaUrl && (
                                <div className="mb-2">
                                  <a 
                                    href={(() => {
                                      if (chat.mediaUrl?.startsWith('data:') || chat.mediaUrl?.startsWith('http')) return chat.mediaUrl;
                                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                                      const cleanPath = chat.mediaUrl?.replace(/\\/g, '/').replace(/^\//, '') || '';
                                      return `${apiUrl.replace(/\/$/, '')}/${cleanPath}`;
                                    })()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <video 
                                      src={(() => {
                                        if (chat.mediaUrl?.startsWith('data:') || chat.mediaUrl?.startsWith('http')) return chat.mediaUrl;
                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                                        const cleanPath = chat.mediaUrl?.replace(/\\/g, '/').replace(/^\//, '') || '';
                                        return `${apiUrl.replace(/\/$/, '')}/${cleanPath}`;
                                      })()}
                                      controls 
                                      className="max-w-full h-auto rounded-lg cursor-pointer"
                                      onError={(e) => {
                                        console.error("Video load failed", chat.mediaUrl);
                                      }}
                                    >
                                      متصفحك لا يدعم علامة الفيديو.
                                    </video>
                                  </a>
                                </div>
                              )}
                              
                              {chat.contentType === 'document' && chat.mediaUrl && (
                                <div className="mb-2 p-2 bg-black bg-opacity-20 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">📄</span>
                                    <div>
                                      <div className="text-sm font-medium">
                                        {chat.mediaFilename || `${chat.contentType.toUpperCase()} File`}
                                      </div>
                                      <a 
                                        href={(() => {
                                          if (chat.mediaUrl?.startsWith('data:') || chat.mediaUrl?.startsWith('http')) return chat.mediaUrl;
                                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                                          const cleanPath = chat.mediaUrl?.replace(/\\/g, '/').replace(/^\//, '') || '';
                                          return `${apiUrl.replace(/\/$/, '')}/${cleanPath}`;
                                        })()}
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
                                <img 
                                  width={32}
                                  height={32}
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" 
                                  src="/Bot.gif" 
                                  alt="Bot" 
                                />
                              ) : (
                                <img width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" src="/user.gif" alt="User" />
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
                <p className="text-gray-300 text-center py-8">اختر جهة اتصال لعرض سجل المحادثة</p>
              )}
            </div>

            {/* Message Input - Fixed at bottom */}
            {selectedContact && (
              <div className="border-t border-gray-700 p-1 flex-shrink-0">
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
                        <img width={40} height={40} 
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

                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    {/* Emoji button inside */}
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-12 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-white transition-colors"
                      title="إضافة إيموجي"
                    >
                      <Smile className="w-6 h-6" />
                    </button>

                    <textarea
                      ref={(el) => {
                        inputRef.current = el;
                        if (el) {
                          el.style.height = '48px';
                          el.style.height = Math.min(el.scrollHeight, 150) + 'px';
                        }
                      }}
                      placeholder="اكتب رسالتك..."
                      value={testMessage}
                      onChange={(e) => {
                        setTestMessage(e.target.value);
                        e.target.style.height = '48px';
                        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                      }}
                      className="w-full pl-12 pr-24 bg-[#0b141a]/90 py-3 rounded-lg text-white placeholder-white/50 resize-none outline-none scrollbar-hide"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(selectedContact, testMessage);
                        }
                      }}
                      rows={1}
                      style={{ minHeight: '48px', maxHeight: '150px', overflowY: 'auto' }}
                    />
                    
                    {/* زر الوسائط على اليمين */}
                    <label className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-10 text-gray-400 hover:text-white transition-colors">
                      <Plus className="w-6 h-6" />
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaSelect}
                        className="hidden"
                      />
                    </label>
                    
                    {/* زر الإرسال على اليسار */}
                    <button 
                      onClick={() => handleSendMessage(selectedContact, testMessage)}
                      disabled={!testMessage.trim()}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-colors ${
                        testMessage.trim() 
                          ? 'text-blue-500 hover:text-blue-400' 
                          : 'text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <SendHorizontal className="w-6 h-6 rtl:rotate-180" />
                    </button>
                  </div>
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
          
          {/* Actions Sidebar - Right side on Desktop */}
          <div className="hidden lg:flex flex-col w-[20%] border-r border-text-primary/50 h-full p-4 gap-6 overflow-y-auto">
             <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-white border-b border-text-primary/30 pb-2 mb-2 flex justify-between items-center">
                  <span>إجراءات وفلاتر</span>
                  <span className="text-[10px] text-gray-200 font-normal">
                   <span className="text-yellow-500"> {contacts.length}</span> جهة اتصال
                  </span>
                </h3>

                {/* Filters Section (Moved from contacts sidebar) */}
                <div className="flex flex-col gap-2 p-3 rounded-lg border border-text-primary/20 bg-[#01191020]">
                  <p className="text-[10px] text-gray-400 mb-2">تصفية القائمة</p>
                  <div className="relative">
                    <Filter className="absolute right-2 top-2.5 h-4 w-4 text-primary scale-75" />
                    <select
                      value={filterTagId}
                      onChange={(e) => setFilterTagId(e.target.value)}
                      className="w-full h-8 pr-7 pl-2 text-[10px] bg-[#01191040] border border-text-primary/30 rounded-md text-white appearance-none focus:outline-none"
                    >
                      <option value="">كل التصنيفات</option>
                      {availableTags.map(tag => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowOnlyEscalated(!showOnlyEscalated)}
                    className={`h-8 px-2 text-[10px] border border-text-primary/30 flex items-center gap-1 transition-all ${
                      showOnlyEscalated ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-[#01191040] text-white'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${showOnlyEscalated ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    عرض المحولة بموظف
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                    className={`h-8 px-2 text-[10px] border border-text-primary/30 flex items-center gap-1 transition-all ${
                      showOnlyUnread ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-[#01191040] text-white'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${showOnlyUnread ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    غير مقروء
                  </Button>

                  <div className="relative">
                    <Filter className="absolute right-2 top-2.5 h-4 w-4 text-primary scale-75" />
                    <select
                      value={filterEmployeeId}
                      onChange={(e) => setFilterEmployeeId(e.target.value)}
                      className="w-full h-8 pr-7 pl-2 text-[10px] bg-[#01191040] border border-text-primary/30 rounded-md text-white appearance-none focus:outline-none"
                    >
                      <option value="all">فلترة باسم الموظف (منشن)</option>
                      {employees.filter(emp => emp.isActive).map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bot Status Card */}
                <div className="p-3 rounded-lg inner-shadow bg-secondry/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">حالة البوت:</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${botStatus?.isPaused ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="text-[10px] text-white">{botStatus?.isPaused ? 'متوقف' : 'نشط'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {botStatus?.isPaused ? (
                      <Button 
                        size="sm" 
                        onClick={handleResumeBot}
                        disabled={botControlLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-[10px]"
                      >
                        {botControlLoading ? 'جاري الاستئناف...' : 'استئناف البوت'}
                      </Button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handlePauseBot(30)}
                          disabled={botControlLoading}
                          className="bg-transparent text-white border border-text-primary/50 inner-shadow text-[9px] px-1"
                        >
                          إيقاف 30د
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handlePauseBot(60)}
                          disabled={botControlLoading}
                          className="bg-transparent text-white border border-text-primary/50 inner-shadow text-[9px] px-1"
                        >
                          إيقاف ساعة
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className={`flex flex-col gap-2 ${!selectedContact ? 'opacity-50 pointer-events-none' : ''}`}>
                   <p className="text-[10px] text-gray-400 mt-2">إجراءات سريعة للعميل</p>
                  <Button 
                    size="sm" 
                    onClick={openTagModal}
                    className="w-full text-xs primary-button justify-start gap-2"
                  >
                     إضافة إلى تصنيف
                  </Button>
                  
                  <Button 
                    size="sm"
                    onClick={handleToggleAiBlock}
                    disabled={botControlLoading}
                    className={`w-full text-xs border border-text-primary/50 inner-shadow justify-start gap-2 ${
                      contacts.find(c => c.contactNumber === selectedContact)?.isAiBlocked 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    
                    {contacts.find(c => c.contactNumber === selectedContact)?.isAiBlocked 
                      ? 'تفعيل الذكاء الاصطناعي' 
                      : 'تعطيل AI للعميل'}
                  </Button>
                  
                  <Button 
                    size="sm"
                    onClick={openNoteModal}
                    className="w-full text-xs bg-transparent text-white border border-text-primary/50 inner-shadow justify-start gap-2"
                  >
                    منشن لموظف
                  </Button>
                </div>

                {/* Selected Contact Mini Info */}
                <div className={`${!selectedContact ? 'hidden' : ''}`}>
                {selectedContact && (
                   <div className="mt-4 p-3 rounded-lg border border-text-primary/20 bg-[#01191020]">
                      <p className="text-[10px] text-gray-500 mb-2">معلومات العميل الحالية</p>
                      <div className="flex items-center gap-3">
                         {contacts.find(c => c.contactNumber === selectedContact)?.profilePicture ? 
                            <img width={32} height={32} className="w-8 h-8 rounded-full object-cover" src={`${contacts.find(c => c.contactNumber === selectedContact)?.profilePicture}`} alt="" /> : 
                            <img width={32} height={32} className="w-8 h-8 rounded-full" src="/user.gif" alt="" />
                         }
                         <div className="flex flex-col overflow-hidden">
                            <span className="text-white text-xs font-medium truncate">
                               {contacts.find(c => c.contactNumber === selectedContact)?.contactName || 'عميل جديد'}
                            </span>
                            <span className="text-[9px] text-gray-400 truncate" dir="ltr">
                               {selectedContact.replace(/@(s\.whatsapp\.net|c\.us|g\.us|lid)$/, '')}
                            </span>
                         </div>
                      </div>
                   </div>
                )}
                </div>
             </div>
          </div>
          </CardContent>
          </div>


        </Card>
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (typeof window !== 'undefined') && createPortal(
        <div className="fixed inset-0 z-[1000000000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80">
          <div className="absolute inset-0" onClick={() => setShowNoteModal(false)} />
          <div className="relative z-10 w-full max-w-lg gradient-border rounded-lg p-4 max-h-[90vh] overflow-y-auto border border-text-primary/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">إضافة ملاحظة على الشات</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-red-400 cursor-pointer text-xl">✕</button>
            </div>
            
            <div className="space-y-4">
              {selectedContact && (
                <div className="text-xs text-gray-400 mb-2">
                  لجهة الاتصال: {selectedContact}
                </div>
              )}
              
              <textarea 
                className="w-full h-32 p-3 rounded-md bg-[#01191040] text-white border border-blue-300/30 outline-none focus:border-blue-500 transition-colors"
                placeholder="اكتب ملاحظتك هنا..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />

              <div className="space-y-2">
                <label className="block text-sm text-gray-300">منشن لموظف </label>
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 bg-[#01191040] rounded px-3 py-2 text-white outline-none border border-blue-300/30 focus:border-blue-500"
                    value={selectedMentionEmployeeId}
                    onChange={(e) => setSelectedMentionEmployeeId(e.target.value)}
                  >
                    <option value="none">بدون منشن</option>
                    {employees.filter(emp => emp.isActive && emp.phone).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.phone})</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-gray-400">سيتم إرسال إشعار للموظف عبر الواتساب فور حفظ الملاحظة</p>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  className="px-4 py-2 text-white border border-text-primary rounded-md hover:bg-white/5 transition-colors"
                  onClick={() => setShowNoteModal(false)}
                >
                  إلغاء
                </button>
                <button 
                  onClick={async () => {
                    if (!selectedContact || !noteText.trim()) return;
                    try {
                      setSavingNote(true);
                      const employee = selectedMentionEmployeeId !== "none" ? employees.find(emp => emp.id.toString() === selectedMentionEmployeeId) : null;
                      
                      const res = await createChatNote(token, { 
                        contactNumber: selectedContact, 
                        note: noteText.trim(),
                        mentionEmployeeId: employee ? parseInt(selectedMentionEmployeeId) : undefined,
                        mentionEmployeeName: employee ? employee.name : undefined
                      } as any);

                      if (res.success) {
                        setActiveNote(res.note as any);
                        setOpenNoteContacts(prev => new Set(prev).add(selectedContact));
                        
                        // Update local mention state
                        if (employee) {
                          setOpenNoteMentions(prev => ({ ...prev, [selectedContact]: employee.name }));
                        }
                        
                        // Handle Mention Notification
                        if (employee && employee.phone) {
                          const mentionMsg = `🔔 *إشعار منشن جديد*\n\nقام المدير بمنشن لك في ملاحظة لعميل:\n*العميل:* ${selectedContact}\n*الملاحظة:* ${noteText.trim()}\n\n_يرجى مراجعة المحادثة في لوحة التحكم._`;
                          await sendWhatsAppMessage(token, employee.phone, mentionMsg);
                        }

                        showToast('تم حفظ الملاحظة بنجاح وإرسال الإشعار إن وجد', 'success');
                        setShowNoteModal(false);
                        setNoteText("");
                        setSelectedMentionEmployeeId("none");
                      }
                    } catch (e: any) {
                      showToast(e.message || 'فشل في حفظ الملاحظة', 'error');
                    } finally {
                      setSavingNote(false);
                    }
                  }}
                  disabled={savingNote || !noteText.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium shadow-lg"
                >
                  {savingNote ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Tag Modal */}
      {showTagModal && (typeof window !== 'undefined') && createPortal(
        <div className="fixed inset-0 z-[1000000000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80">
          <div className="absolute inset-0" onClick={() => setShowTagModal(false)} />
          <div className="relative z-10 w-full max-w-xl gradient-border rounded-lg p-4 max-h-[90vh] overflow-y-auto border border-text-primary/50">
            <h3 className="text-white text-lg font-medium mb-3">إضافة إلى تصنيف</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">جهة الاتصال</label>
                <select
                  className="w-full bg-[#01191040]  rounded px-3 py-2 text-white outline-none border border-blue-300/30"
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
                  className="w-full bg-[#01191040]  rounded px-3 py-2 text-white outline-none border border-blue-300/30"
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
                  className="flex-1 bg-[#01191040]  rounded px-3 py-2 text-white/50 placeholder-white/50 outline-none border border-blue-300/30"
                  placeholder=" أدخل اسم التصنيف "
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
        </div>,
        document.body
      )}

    </>
  );
}