"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, listPinterestBoards, checkPlatformConnections, getCurrentFacebookPage, getInstagramAccountInfo, getYouTubeChannelDetails, getTwitterAccountDetails, getLinkedInProfileDetails, getPostUsageStats } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import YouTubeChannelSelection from "@/components/YouTubeChannelSelection";
import AnimatedEmoji, { EmojiPickerModal } from "@/components/AnimatedEmoji";
import { useToast } from "@/components/ui/toast-provider";

// Platform configuration with icons and supported content types
const PLATFORMS = {
  instagram: {
    name: "Instagram",
    icon: <img className="w-12 h-12" src="/insta.gif" alt="" />,
    supportedTypes: ['photo', 'video', 'text'],
    supportedFormats: ['feed', 'reel', 'story'],
    color: "from-pink-500 to-purple-600"
  },
  facebook: {
    name: "Facebook", 
    icon: <img className="w-12 h-12" src="/facebook.gif" alt="" />,
    supportedTypes: ['photo', 'video', 'text', 'link'],
    supportedFormats: ['feed', 'story'],
    color: "from-blue-600 to-blue-800"
  },
  youtube: {
    name: "YouTube",
    icon: <img className="w-12 h-12" src="/youtube.gif" alt="" />, 
    supportedTypes: ['photo', 'video', 'text', 'link'],
    supportedFormats: ['feed'],
    color: "from-red-500 to-red-700"
  },
  // tiktok: {
  //   name: "TikTok",
  //   icon: "🎵",
  //   supportedTypes: ['video'],
  //   supportedFormats: ['feed'],
  //   color: "from-black to-gray-800"
  // },
  telegram: {
    name: "Telegram",
    icon: <img className="w-12 h-12" src="/telegram.gif" alt="" />,
    supportedTypes: ['photo', 'video', 'text'],
    supportedFormats: ['story'],
    color: "from-blue-500 to-blue-700"
  },
  linkedin: {
    name: "LinkedIn",
    icon: <img className="w-12 h-12" src="/linkedin.gif" alt="" />,
    supportedTypes: ['photo', 'video', 'text', 'link'],
    supportedFormats: ['feed'],
    color: "from-blue-700 to-blue-900"
  },
  //  pinterest: {
  //    name: "Pinterest",
  //    icon: "📌",
  //    supportedTypes: ['photo', 'link'],
  //    supportedFormats: ['feed'],
  //    color: "from-red-600 to-pink-600"
  //  },
  twitter: {
    name: "Twitter (X)",
    icon: <img className="w-12 h-12" src="/x.gif" alt="" />,
    supportedTypes: ['text', 'link', 'photo'],
    supportedFormats: ['feed'],
    color: "from-gray-900 to-gray-700"
  }
};

export default function CreatePostPage() {
  const { hasActiveSubscription, hasPlatformAccess, loading: permissionsLoading } = usePermissions();
  const { showSuccess, showError } = useToast();
  
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [when, setWhen] = useState<string>("");
  const [type, setType] = useState<'text' | 'link' | 'photo' | 'video'>("text");
  const [format, setFormat] = useState<'feed' | 'reel' | 'story'>("feed");
  const [contentType, setContentType] = useState<'articles' | 'reels' | 'stories'>('articles');
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [hashtags, setHashtags] = useState<string>("");
  const [platforms, setPlatforms] = useState<string[]>(['facebook']);
  const [pinterestBoardId, setPinterestBoardId] = useState<string>("");
  const [pinterestBoards, setPinterestBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState<boolean>(true);
  const [isDevelopment, setIsDevelopment] = useState<boolean>(false);
  const [showYouTubeSelection, setShowYouTubeSelection] = useState<boolean>(false);
  const [currentFacebookPage, setCurrentFacebookPage] = useState<{pageName: string, fanCount: number, instagramId?: string, instagramUsername?: string} | null>(null);
  const [instagramAccount, setInstagramAccount] = useState<{username: string, followersCount: number, followingCount: number, mediaCount: number} | null>(null);
  const [youtubeChannel, setYoutubeChannel] = useState<{title: string, subscriberCount: string} | null>(null);
  const [twitterAccount, setTwitterAccount] = useState<{username: string} | null>(null);
  const [linkedinProfile, setLinkedinProfile] = useState<{name: string} | null>(null);
  
  // Post usage stats state
  const [postUsageStats, setPostUsageStats] = useState<{
    monthlyLimit: number;
    totalUsed: number;
    remaining: number;
    percentage: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
    planName: string;
  } | null>(null);
  
  // Telegram groups/channels state
  const [telegramGroups, setTelegramGroups] = useState<Array<{ id: number; chatId: string; name: string; type: string }>>([]);
  const [selectedTelegramGroups, setSelectedTelegramGroups] = useState<string[]>([]);
  const [telegramGroupsLoading, setTelegramGroupsLoading] = useState(false);
  
  // Connection status for stories
  const [telegramBotActive, setTelegramBotActive] = useState(false);
  const [checkingConnections, setCheckingConnections] = useState(false);
  
  // Emoji state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Helper function to get all platforms (for initial display)
  const getAllPlatforms = () => {
    return Object.entries(PLATFORMS);
  };

  // Helper function to get available platforms based on content type and user permissions
  const getAvailablePlatforms = () => {
    let availablePlatforms;
    
    if (contentType === 'reels') {
      // For reels, only show platforms that support video reels
      availablePlatforms = Object.entries(PLATFORMS).filter(([key, platform]) => {
        return platform.supportedFormats.includes('reel') && platform.supportedTypes.includes('video');
      });
    } else if (contentType === 'stories') {
      // For stories, only show platforms that support stories
      availablePlatforms = Object.entries(PLATFORMS).filter(([key, platform]) => {
        return platform.supportedFormats.includes('story');
      });
    } else {
      // For articles, show all platforms (they all support text content)
      availablePlatforms = Object.entries(PLATFORMS);
    }
    
    // Filter by user permissions
    return availablePlatforms.filter(([key, platform]) => {
      return hasPlatformAccess(key);
    });
  };

  // Helper function to check if platform is connected
  const isPlatformConnected = (platformKey: string) => {
    return connectedPlatforms.includes(platformKey);
  };

  // Helper function to check if platform is selected
  const isPlatformSelected = (platformKey: string) => {
    return platforms.includes(platformKey);
  };
  
  // Auto-filter platforms when content type changes
  useEffect(() => {
    const availablePlatforms = getAvailablePlatforms();
    const availableKeys = availablePlatforms.map(([key]) => key);
    
    // Remove platforms that don't support current content type
    const filteredPlatforms = platforms.filter(platform => availableKeys.includes(platform));
    if (filteredPlatforms.length !== platforms.length) {
      setPlatforms(filteredPlatforms);
    }
  }, [contentType]);

  // Load platform connections on component mount
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        if (!token) return;
        
        const res = await checkPlatformConnections(token);
        if (res.success) {
          const connected = Object.entries(res.connections)
            .filter(([_, isConnected]) => isConnected)
            .map(([platform, _]) => platform);
          
          setConnectedPlatforms(connected);
          setIsDevelopment((res as any).mode === 'development');
          
          // Don't auto-select platforms if none are connected
          if (connected.length === 0) {
            setPlatforms([]);
          }
        }
      } catch (error) {
        console.error('Failed to load platform connections:', error);
      } finally {
        setConnectionsLoading(false);
      }
    };

    loadConnections();
  }, []);

  // Load post usage stats
  useEffect(() => {
    const loadPostUsageStats = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        if (!token) return;
        
        const res = await getPostUsageStats(token);
        if (res.success) {
          setPostUsageStats(res.data);
        }
      } catch (error) {
        console.error('Failed to load post usage stats:', error);
      }
    };

    loadPostUsageStats();
  }, []);


  // Auto-load boards when Pinterest is selected
  useEffect(() => {
    if (platforms.includes('pinterest')) {
      loadPinterestBoards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms.includes('pinterest')]);

  // Check Telegram and load groups when stories are selected
  useEffect(() => {
    if (contentType === 'stories') {
      setCheckingConnections(true);
      
      // Check Telegram and load groups
      (async () => {
        const token = localStorage.getItem('auth_token') || '';
        if (!token) {
          setCheckingConnections(false);
          return;
        }
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/telegram/groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const data = await response.json();
          const hasGroups = data.success && data.groups && data.groups.length > 0;
          setTelegramBotActive(hasGroups);
          setTelegramGroups(data.groups || []);
          console.log('[Telegram] Bot active with groups:', hasGroups);
        } catch (error) {
          console.error('Error checking Telegram bot status:', error);
          setTelegramBotActive(false);
          setTelegramGroups([]);
        } finally {
          setCheckingConnections(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  // Load current Facebook page when Facebook or Instagram is selected
  useEffect(() => {
    if ((platforms.includes('facebook') || platforms.includes('instagram')) && connectedPlatforms.includes('facebook')) {
      loadCurrentFacebookPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, connectedPlatforms]);

  // Load Instagram account when Instagram is selected
  useEffect(() => {
    if (platforms.includes('instagram') && currentFacebookPage?.instagramId) {
      loadInstagramAccount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, currentFacebookPage?.instagramId]);

  // Load YouTube channel when YouTube is selected
  useEffect(() => {
    if (platforms.includes('youtube') && connectedPlatforms.includes('youtube')) {
      loadYouTubeChannel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, connectedPlatforms]);

  // Load Twitter account when Twitter is selected
  useEffect(() => {
    if (platforms.includes('twitter') && connectedPlatforms.includes('twitter')) {
      loadTwitterAccount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, connectedPlatforms]);

  // Load LinkedIn profile when LinkedIn is selected
  useEffect(() => {
    if (platforms.includes('linkedin') && connectedPlatforms.includes('linkedin')) {
      loadLinkedInProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, connectedPlatforms]);

  const mutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("auth_token") || "";
      const scheduledAt = when ? new Date(when).toISOString() : undefined;
      let mediaUrl: string | undefined = undefined;
      
      // Validation: Reels require a video file
      if (contentType === 'reels') {
        if (!image || !image.type?.startsWith('video')) {
          throw new Error('الريلز تتطلب ملف فيديو. يرجى رفع فيديو.');
        }
        // Force type to video for reels
        setType('video');
        setFormat('reel');
      }
      
      // Validation: Stories require a media file
      if (contentType === 'stories') {
        if (!image) {
          throw new Error('الستوري يتطلب صورة أو فيديو. يرجى رفع ملف وسائط.');
        }
        // Force type based on file type
        if (image.type?.startsWith('video')) {
          setType('video');
        } else {
          setType('photo');
        }
        setFormat('story');
      }
      
      // Validation: photo/video types require a file (only for articles, not reels)
      if (contentType === 'articles' && (type === 'photo' || type === 'video') && !image) {
        throw new Error('يرجى رفع ملف وسائط للمنشورات التي تحتوي على صور أو فيديو.');
      }
      
      // Upload file if present
      if (image) {
        console.log('Starting file upload for:', image.name, 'Type:', image.type, 'Size:', image.size);
        
        const form = new FormData();
        form.append("file", image);
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/uploads`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        
        console.log('Upload response status:', uploadRes.status);
        console.log('Upload response headers:', Object.fromEntries(uploadRes.headers.entries()));
        
        const uploadText = await uploadRes.text();
        console.log('Upload response text:', uploadText);
        
        let uploaded: any = null;
        try { 
          uploaded = uploadText ? JSON.parse(uploadText) : null; 
          console.log('Parsed upload response:', uploaded);
        } catch (e) {
          console.error('Failed to parse upload response:', e);
          throw new Error(`Upload failed (${uploadRes.status}): ${uploadText?.slice(0, 120)}`);
        }
        
        if (!uploadRes.ok) {
          const errorMsg = uploaded?.details || uploaded?.message || `Upload failed (${uploadRes.status})`;
          throw new Error(errorMsg);
        }
        
        mediaUrl = uploaded.url;
        console.log('Extracted mediaUrl:', mediaUrl);
        
        // Harmonize type with uploaded file if needed
        const isVideo = image.type?.startsWith('video');
        const isImage = image.type?.startsWith('image');
        
        if (contentType === 'reels' && !isVideo) {
          throw new Error('الريلز تتطلب ملف فيديو.');
        }
        
        if (contentType === 'articles' && type === 'photo' && isVideo) {
          // Auto-correct to video if user selected photo but uploaded a video
          setType('video');
        }
        
        if (contentType === 'articles' && type === 'video' && isImage) {
          throw new Error('لقد اخترت نوع فيديو ولكن رفعت صورة. غير النوع إلى صورة أو ارفع فيديو.');
        }
      }
      
      // Ensure type and format based on content type
      let finalType = type;
      let finalFormat = 'feed';
      
      if (contentType === 'reels') {
        finalType = 'video';
        finalFormat = 'reel';
      } else if (contentType === 'stories') {
        finalType = image?.type?.startsWith('video') ? 'video' : 'photo';
        finalFormat = 'story';
      }
      
      // Debug logging
      console.log('Creating post with payload:', {
        type: finalType,
        content: text,
        linkUrl: linkUrl || undefined,
        mediaUrl,
        hashtags,
        format: finalFormat,
        scheduledAt,
        platforms,
        pinterestBoardId: platforms.includes('pinterest') ? (pinterestBoardId || undefined) : undefined
      });
      
      const res = await apiFetch<{ post: any }>("/api/posts", {
        method: "POST",
        body: JSON.stringify({ 
          type: finalType, 
          content: text, 
          linkUrl: linkUrl || undefined, 
          mediaUrl, 
          hashtags, 
          format: finalFormat, 
          scheduledAt,
          timezoneOffset: scheduledAt ? new Date().getTimezoneOffset() : undefined,
          platforms,
          pinterestBoardId: platforms.includes('pinterest') ? (pinterestBoardId || undefined) : undefined
        }),
        authToken: token,
      });
      
      return res.post;
    },
    onSuccess: (post) => {
      // Show success toast
      if (post.status === "published") {
        showSuccess("تم النشر بنجاح! 🎉", "تم نشر المحتوى على جميع المنصات المحددة");
      } else if (post.status === "scheduled") {
        showSuccess("تم الجدولة بنجاح! 📅", "سيتم نشر المحتوى في الوقت المحدد");
      } else {
        showSuccess("تم الحفظ كمسودة! 📝", "يمكنك العودة وتعديله لاحقاً");
      }
      
      // Refresh post usage stats
      const refreshStats = async () => {
        try {
          const token = localStorage.getItem('auth_token') || '';
          if (!token) return;
          
          const res = await getPostUsageStats(token);
          if (res.success) {
            setPostUsageStats(res.data);
          }
        } catch (error) {
          console.error('Failed to refresh post usage stats:', error);
        }
      };
      
      refreshStats();
      
      // Clear form
      setText("");
      setWhen("");
      setImage(null);
      setLinkUrl("");
      setHashtags("");
      setPinterestBoardId("");
    },
    onError: (error: any) => {
      // Show error toast
      showError("حدث خطأ! ❌", error?.message || "فشل في نشر المحتوى. يرجى المحاولة مرة أخرى");
      
      // Check if error is related to post limits
      if (error?.message?.includes('limit') || error?.message?.includes('حد')) {
        // Refresh stats to show updated limits
        const refreshStats = async () => {
          try {
            const token = localStorage.getItem('auth_token') || '';
            if (!token) return;
            
            const res = await getPostUsageStats(token);
            if (res.success) {
              setPostUsageStats(res.data);
            }
          } catch (error) {
            console.error('Failed to refresh post usage stats:', error);
          }
        };
        
        refreshStats();
      }
    },
  });

  // Check permissions after all hooks
  if (permissionsLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">إنشاء منشور جديد</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="text-gray-400 mt-4">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">إنشاء منشور جديد</h1>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-xl">
          <CardContent className="text-center py-16">
            <div className="text-6xl mb-6">🔒</div>
            <h3 className="text-2xl font-bold text-red-900 mb-3">لا يوجد اشتراك نشط</h3>
            <p className="text-red-700 mb-6 text-lg">تحتاج إلى اشتراك نشط للوصول إلى ميزة إنشاء المنشورات</p>
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              استعراض الباقات المتاحة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
      if (platform === 'pinterest') {
        setPinterestBoardId("");
      }
    } else {
      setPlatforms([...platforms, platform]);
      
      // Facebook page selection is now handled in settings page
      
      // If YouTube is selected and connected, show channel selection modal
      if (platform === 'youtube' && isPlatformConnected('youtube')) {
        setShowYouTubeSelection(true);
      }
    }
  };

  // Load Pinterest boards when Pinterest is selected
  const loadPinterestBoards = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      if (!token) return;
      const res = await listPinterestBoards(token);
      setPinterestBoards(res.boards || []);
      // if no current selection, preselect first
      if (!pinterestBoardId && res.boards?.length) setPinterestBoardId(res.boards[0].id);
    } catch {}
  };

  // Load current Facebook page info
  const loadCurrentFacebookPage = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      if (!token) return;
      const res = await getCurrentFacebookPage(token);
      if (res.success) {
        setCurrentFacebookPage({
          pageName: res.pageName,
          fanCount: res.fanCount,
          instagramId: (res as any).instagramId,
          instagramUsername: (res as any).instagramUsername
        });
      }
    } catch (error) {
      console.error('Error loading current Facebook page:', error);
    }
  };

  // Load Instagram account info
  const loadInstagramAccount = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      if (!token) return;
      const res = await getInstagramAccountInfo(token);
      if (res.success) {
        setInstagramAccount({
          username: res.username,
          followersCount: res.followersCount,
          followingCount: res.followingCount,
          mediaCount: res.mediaCount
        });
      }
    } catch (error) {
      console.error('Error loading Instagram account:', error);
    }
  };

  // Load YouTube channel info
  const loadYouTubeChannel = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      if (!token) return;
      const res = await getYouTubeChannelDetails(token);
      if (res.success) {
        setYoutubeChannel({
          title: res.title,
          subscriberCount: res.statistics?.subscriberCount || '0'
        });
      }
    } catch (error) {
      console.error('Error loading YouTube channel:', error);
    }
  };

  // Load Twitter account info
  const loadTwitterAccount = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      if (!token) return;
      const res = await getTwitterAccountDetails(token);
      if (res.success) {
        setTwitterAccount({
          username: res.username
        });
      }
    } catch (error) {
      console.error('Error loading Twitter account:', error);
    }
  };

  // Load LinkedIn profile info
  const loadLinkedInProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      if (!token) return;
      const res = await getLinkedInProfileDetails(token);
      if (res.success) {
        setLinkedinProfile({
          name: res.name
        });
      }
    } catch (error) {
      console.error('Error loading LinkedIn profile:', error);
    }
  };

  // Load Telegram groups/channels
  const loadTelegramGroups = async () => {
    try {
      setTelegramGroupsLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      if (!token) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/telegram/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTelegramGroups(data.groups || []);
        console.log('[Telegram] Loaded groups:', data.groups);
      }
    } catch (error) {
      console.error('Error loading Telegram groups:', error);
    } finally {
      setTelegramGroupsLoading(false);
    }
  };

  // Sync Telegram groups from API
  const syncTelegramGroups = async () => {
    try {
      setTelegramGroupsLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      if (!token) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/telegram/sync-groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTelegramGroups(data.groups || []);
        setTelegramBotActive(data.groups && data.groups.length > 0);
        console.log('[Telegram] Synced groups:', data.groups);
        alert(`✅ تم المزامنة! تم العثور على ${data.groups?.length || 0} قناة/مجموعة`);
      } else {
        alert(`❌ فشلت المزامنة: ${data.message}`);
      }
    } catch (error) {
      console.error('Error syncing Telegram groups:', error);
      alert('❌ حدث خطأ أثناء المزامنة');
    } finally {
      setTelegramGroupsLoading(false);
    }
  };


  return (
    <div className="w-full mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">إنشاء منشور جديد</h1>
          <p className="text-gray-400">قم بإنشاء ونشر محتواك على منصات التواصل الاجتماعي</p>
        </div>
        
        {/* Post Usage Counter */}
        {postUsageStats && (
          <div className="flex items-center gap-3">
            <div className={`p-4 rounded-2xl flex  shadow-lg border-2 transition-all ${
              postUsageStats.isAtLimit 
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 ' 
                : postUsageStats.isNearLimit 
                ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
            }`}>
              <div className="text-center flex items-center">
                <div className={`text-2xl font-bold ${
                  postUsageStats.isAtLimit 
                    ? 'text-red-900' 
                    : postUsageStats.isNearLimit 
                    ? 'text-orange-900'
                    : 'text-green-900'
                }`}>
                  {postUsageStats.monthlyLimit === -1 ? '∞' : postUsageStats.remaining}
                </div>
                <div className={`text-sm font-semibold ${
                  postUsageStats.isAtLimit 
                    ? 'text-red-700' 
                    : postUsageStats.isNearLimit 
                    ? 'text-orange-700'
                    : 'text-green-700'
                }`}>
                  منشور متبقي
                </div>
                {postUsageStats.monthlyLimit !== -1 && (
                  <div className={`text-xs mt-1 ${
                    postUsageStats.isAtLimit 
                      ? 'text-red-600' 
                      : postUsageStats.isNearLimit 
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}>
                    {postUsageStats.totalUsed} / {postUsageStats.monthlyLimit} ({postUsageStats.percentage}%)
                  </div>
                )}
               
              </div>
            </div>
            
            {/* Warning Messages */}
            {postUsageStats.isAtLimit && (
              <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                ⚠️ تم الوصول للحد الأقصى من المنشورات
              </div>
            )}
            {postUsageStats.isNearLimit && !postUsageStats.isAtLimit && (
              <div className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                ⚠️ تقترب من الحد الأقصى ({postUsageStats.remaining} منشور متبقي)
              </div>
            )}
          </div>
        )}
        
        {/* {isDevelopment && (
          <span className="text-xs bg-yellow-500 text-yellow-900 px-4 py-2 rounded-full font-semibold shadow-lg">
            🔧 وضع التطوير
          </span>
        )} */}
      </div>
      
      {/* Step 1: Content Type Selection */}
      <Card className="gradient-border ">
        <CardHeader className="border-b border-green-500/30 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold shadow-lg">
              1
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">اختر نوع المحتوى</h2>
              <p className="text-sm text-gray-300">حدد نوع المنشور الذي تريد إنشاءه</p>
            </div>
            </div>
            <div className="flex items-center gap-6">
            <button
              onClick={() => { setContentType('articles'); setType('text'); setFormat('feed'); }}
              className={`group relative p-4 inner-shadow rounded-2xl transition-all duration-300 flex items-center gap-2 ${
                contentType === 'articles' 
                  ? 'bg-green-700 scale-105 inner-shadow ' 
                  : 'bg-[#011910] inner-shadow'
              }`}
            >
              <div className="text-xl mb-4">📝</div>
             <div className="flex flex-col ">
             <div className={`text-xl font-bold  ${contentType === 'articles' ? 'text-white' : 'text-gray-200'}`}>
                مقالات ومنشورات
              </div>
              <div className={`text-sm ${contentType === 'articles' ? 'text-green-50' : 'text-gray-400'}`}>
                نصوص مع صور أو فيديو اختياري
              </div>

             </div>
            
            </button>
            
            {/* <button
              onClick={() => { setContentType('reels'); setType('video'); setFormat('reel'); }}
              className={`group relative p-8 rounded-2xl transition-all duration-300 ${
                contentType === 'reels' 
                  ? 'bg-green-700 scale-105' 
                  : 'bg-[#011910]'
              }`}
            >
              <div className="text-6xl mb-4">🎬</div>
              <div className={`text-xl font-bold mb-2 ${contentType === 'reels' ? 'text-white' : 'text-gray-200'}`}>
                فيديوهات قصيرة
              </div>
              <div className={`text-sm ${contentType === 'reels' ? 'text-green-50' : 'text-gray-400'}`}>
                ريلز لـ Instagram و TikTok
              </div>
              {contentType === 'reels' && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
              )}
            </button> */}
            
            {/* <button
              onClick={() => { setContentType('stories'); setType('photo'); setFormat('story'); }}
              className={`group relative p-8 rounded-2xl transition-all duration-300 ${
                contentType === 'stories' 
                  ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-2xl scale-105 ring-4 ring-green-400/50' 
                  : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 hover:scale-105 shadow-lg'
              }`}
            >
              <div className="text-6xl mb-4">📱</div>
              <div className={`text-xl font-bold mb-2 ${contentType === 'stories' ? 'text-white' : 'text-gray-200'}`}>
                ستوري
              </div>
              <div className={`text-sm ${contentType === 'stories' ? 'text-green-50' : 'text-gray-400'}`}>
                قصص على Telegram
              </div>
              {contentType === 'stories' && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
              )}
            </button> */}
            <button
  onClick={() => {
    setContentType('stories');
    setType('photo');
    setFormat('story');
  }}
  className={`group relative  flex items-center gap-2 p-4 rounded-2xl transition-all duration-300 overflow-hidden 
  ${contentType === 'stories'
    ? 'bg-green-700 scale-105 inner-shadow '
    : 'bg-[#011910] inner-shadow'
  }`}
>
  {/* خلفية زجاجية داخلية (تعمل فقط في الحالة المفعلة) */}
  {/* {contentType === 'stories' && (
    <div className="absolute inset-0 rounded-2xl glass-bg z-0"></div>
  )}
 */}
  <div className="relative z-10 text-xl mb-4">📱</div>
  <div className="flex flex-col gap-1">
    <div className={`relative z-10 text-xl font-bold ${contentType === 'stories' ? 'text-white' : 'text-gray-200'}`}>
      ستوري
    </div>
    <div className={`relative z-10 text-sm ${contentType === 'stories' ? 'text-emerald-50' : 'text-gray-400'}`}>
      قصص على Telegram
    </div>
  </div>

 
</button>

          </div>
          </div>
        </CardHeader>
       
      </Card>

      {/* Step 2: Platform Selection */}
      <Card className="gradient-border ">
        <CardHeader className="border-b border-green-500/30 pb-4">
          <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold shadow-lg">
              2
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {contentType === 'stories' ? 'اختر منصة الستوري' : 'اختر المنصات للنشر'}
              </h2>
              <p className="text-sm text-gray-400">
                {contentType === 'stories' 
                  ? 'Telegram فقط - يتم النشر على قنوات ومجموعات Telegram' 
                  : 'يمكنك اختيار منصة أو أكثر للنشر عليها'}
              </p>
            </div>

          </div>
            {platforms.length === 0 && (
                <div className="mt-1">
                  {connectionsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
                      <p className="text-gray-400 mt-3">جاري تحميل المنصات...</p>
                    </div>
                  ) : getAvailablePlatforms().length === 0 ? (
                    <div className="p-2 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-2xl text-center shadow-lg flex items-center justify-center gap-2">
                      <p className="text-xl font-bold text-red-900">لا توجد منصات متاحة في باقتك</p>
                      <p className="text-sm text-red-700">
                        باقتك الحالية لا تشمل أي منصات اجتماعية. يرجى ترقية باقتك للوصول إلى المنصات.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/plans'}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                      >
                        ترقية الباقة الآن
                      </Button>
                    </div>
                  ) : connectedPlatforms.length === 0 ? (
                    <div className="p-2 bg-red-500 rounded-2xl text-center shadow-lg flex items-center justify-center gap-2">
                    
                      <p className="text-xl font-bold text-white">لا توجد منصات متصلة</p>
                      <p className="text-sm text-white">
                        يرجى ربط حساباتك على منصات التواصل الاجتماعي من صفحة الإعدادات أولاً
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/settings'}
                        className="primary-button after:bg-[#011910] text-white px-8 py-3 text-lg font-semibold shadow-lg"
                      >
                        الذهاب إلى ادارة الحسابات
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-2xl text-center shadow-lg">
                     
                      <p className="text-lg font-bold text-orange-900">يرجى اختيار منصة واحدة على الأقل للنشر</p>
                </div>
              )}
                </div>
              )}
          </div>

         
        </CardHeader>
        <CardContent className="pt-6">
          {connectionsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-6 rounded-xl bg-gray-700/50 animate-pulse">
                  <div className="w-12 h-12 bg-gray-600 rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4 mx-auto"></div>
            </div>
              ))}
            </div>
          ) : (
            <>
              {contentType === 'stories' ? (
                /* Special story platform selection - Telegram only */
                <div className="space-y-6">
                  {/* Telegram Story Option */}
                  <button
                    onClick={() => {
                      if (telegramBotActive || isDevelopment) {
                        setPlatforms(['telegram']);
                        loadTelegramGroups();
                      }
                    }}
                    disabled={!telegramBotActive && !isDevelopment}
                    className={`w-full relative p-3 rounded-2xl transition-all duration-300 cursor-pointer ${
                      platforms.includes('telegram')
                        ? 'bg-green-700 scale-105' 
                        : (telegramBotActive || isDevelopment)
                        ? 'bg-[#011910]'
                        : 'bg-gray-800/50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                  
                    <div className="text-3xl font-bold mb-3 text-white">اضغط هنا لاختيار قنوات الستوري</div>
                    <div className={`text-lg font-semibold ${
                      checkingConnections ? 'text-gray-300' : 
                      telegramBotActive ? 'text-blue-100' : 
                      'text-red-300'
                    }`}>
                      {checkingConnections ? '⏳ جاري التحقق من الاتصال...' : 
                       telegramBotActive ? `✅ ${telegramGroups.length || '...'} قناة/مجموعة جاهزة للنشر` : 
                       '❌ لا توجد قنوات متاحة - أضف البوت كأدمن'}
                    </div>
                  </button>
                  
                  {/* Telegram Groups Display */}
                  {platforms.includes('telegram') && (
                    <div className="p-6 bg-[#011910] rounded-2xl shadow-lg">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                         
                          <div>
                            <h4 className="text-lg font-bold text-white">قنوات ومجموعات Telegram</h4>
                            <p className="text-sm text-gray-400">سيتم النشر على جميع القنوات والمجموعات التالية</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={loadTelegramGroups}
                          disabled={telegramGroupsLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 shadow-md"
                        >
                          {telegramGroupsLoading ? '⏳ جاري التحميل...' : 'تحديث'}
                        </Button>
                      </div>
                      
                      {telegramGroupsLoading ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                          <p className="text-blue-700 mt-3 font-semibold">جاري تحميل القنوات...</p>
                        </div>
                      ) : telegramGroups.length === 0 ? (
                        <div className="text-center py-10 space-y-4">
                     
                          <p className="text-lg font-bold text-red-700">
                            لا توجد قنوات أو مجموعات متاحة
                          </p>
                        
                          <Button 
                            onClick={syncTelegramGroups}
                            disabled={telegramGroupsLoading}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg font-semibold shadow-lg mt-4"
                          >
                            تحميل القنوات و المجموعات من تليجرام
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2">
                          {telegramGroups.map(group => (
                            <div 
                              key={group.id}
                              className="flex items-center gap-4 p-5 bg-light-custom rounded-xl  inner-shadow transition-all"
                            >
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-md">
                                {group.type === 'channel' ? '📢' : '👥'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-base font-bold text-white truncate">
                                  {group.name}
                                </div>
                                <div className="text-sm text-gray-400 font-medium">
                                  {group.type === 'channel' ? 'قناة Telegram' : 'مجموعة Telegram'}
                                </div>
                              </div>
                              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Regular platform selection for articles and reels */
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {getAvailablePlatforms().map(([key, platform]) => {
                  const isConnected = isPlatformConnected(key);
                  const isSelected = isPlatformSelected(key);
                  
                  return (
                    <button
                      key={key}
                      onClick={() => isConnected ? togglePlatform(key) : null}
                      disabled={!isConnected}
                          className={`relative p-6 rounded-xl transition-all duration-300 ${
                        isSelected
                              ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-2xl ring-4 ring-green-400/50' 
                          : isConnected
                              ? 'bg-card inner-shadow shadow-lg'
                              : 'bg-gray-800 opacity-70 cursor-not-allowed'
                      }`}
                    >
                      {/* Connection Status Indicator */}
                      {isConnected && (
                            <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                              isSelected ? 'bg-white' : 'bg-green-500'
                            }`}>
                              <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-green-500' : 'bg-white'}`}></div>
                            </div>
                          )}
                          
                         <div className="flex items-center flex-col gap-2">
                         <div className="text-xl shadow-xl">{platform.icon}</div>
                          <div className={`text-lg font-bold ${isSelected ? 'text-white' : isConnected ? 'text-gray-200' : 'text-gray-500'}`}>
                            {platform.name}
                          </div>
                         </div>
                      
                      {!isConnected && (
                            <div className={`absolute -top-2 -right-2 w-3 h-3 rounded-full flex items-center justify-center shadow-lg ${
                              isSelected ? 'bg-white' : 'bg-red-500'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-red-500' : 'bg-white'}`}></div>
                            </div>
                      )}
                    </button>
                  );
                })}
          </div>
          
          {/* Platform Details */}
          {platforms.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl shadow-lg">
                      <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">✓</span>
                        المنصات المحددة للنشر
                      </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.includes('facebook') && isPlatformConnected('facebook') && (
                            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                              <div className="text-3xl">👥</div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-gray-900">صفحة Facebook</div>
                                <div className="text-xs text-gray-600">
                          {currentFacebookPage ? 
                                    `${currentFacebookPage.pageName} (${currentFacebookPage.fanCount} معجب)` : 
                                    'محددة تلقائياً'}
                        </div>
                      </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                )}
                
                {platforms.includes('instagram') && isPlatformConnected('instagram') && currentFacebookPage?.instagramId && (
                            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                              <div className="text-3xl">📷</div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-gray-900">حساب Instagram</div>
                                <div className="text-xs text-gray-600">
                          {instagramAccount ? 
                                    `@${instagramAccount.username} (${instagramAccount.followersCount} متابع)` : 
                                    currentFacebookPage?.instagramUsername ? 
                                    `@${currentFacebookPage.instagramUsername}` :
                                    'جاري التحميل...'}
                        </div>
                      </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                )}
                
                {/* {platforms.includes('pinterest') && isPlatformConnected('pinterest') && (
                          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="text-3xl">📌</div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-900">لوحة Pinterest</div>
                              <div className="text-xs text-gray-600">محددة تلقائياً</div>
                    </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )} */}
                
                {platforms.includes('youtube') && isPlatformConnected('youtube') && (
                          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="text-3xl">▶️</div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-900">قناة YouTube</div>
                              <div className="text-xs text-gray-600">
                                {youtubeChannel ? 
                                  `${youtubeChannel.title} (${parseInt(youtubeChannel.subscriberCount).toLocaleString()} مشترك)` : 
                                  'جاري التحميل...'}
                              </div>
                    </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
                
                {platforms.includes('twitter') && isPlatformConnected('twitter') && (
                          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="text-3xl">𝕏</div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-900">حساب Twitter</div>
                              <div className="text-xs text-gray-600">
                                {twitterAccount ? 
                                  `@${twitterAccount.username}` : 
                                  'جاري التحميل...'}
                              </div>
                    </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
                
                {platforms.includes('linkedin') && isPlatformConnected('linkedin') && (
                          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="text-3xl">💼</div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-900">حساب LinkedIn</div>
                              <div className="text-xs text-gray-600">
                                {linkedinProfile ? 
                                  linkedinProfile.name : 
                                  'جاري التحميل...'}
                              </div>
                    </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
                
                 {/* {platforms.includes('tiktok') && isPlatformConnected('tiktok') && (
                          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="text-3xl">🎵</div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-900">حساب TikTok</div>
                              <div className="text-xs text-gray-600">محدد تلقائياً</div>
                     </div>
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                   </div>
                 )} */}
              </div>
                    </div>
                  )}
            </div>
          )}
          
          {/* YouTube Channel Selection Modal */}
          <YouTubeChannelSelection
            isOpen={showYouTubeSelection}
            onClose={() => setShowYouTubeSelection(false)}
            onComplete={() => {
              setShowYouTubeSelection(false);
              // Optionally refresh platform connections
            }}
          />
          
            
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Content Creation */}
      <Card className="gradient-border ">
        <CardHeader className="border-b border-green-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold shadow-lg">
              3
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">اكتب المحتوى</h2>
              <p className="text-sm text-gray-400">أضف النص والوسائط والتفاصيل الأخرى</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Text Content */}
          <div className="relative">
            <label className="block text-sm font-bold mb-3 text-white flex items-center gap-2">
              <span className="text-xl">✍️</span>
              نص المنشور
            </label>
            <Textarea
              placeholder="اكتب منشورك هنا... يمكنك إضافة إيموجي وهاشتاغات ونصوص طويلة"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[160px] bg-[#011910] rounded-xl text-white"
            />
            <Button
              type="button"
              onClick={() => setShowEmojiPicker(true)}
              className="absolute bottom-3 left-3 px-3 py-2 bg-green-600 hover:bg-green-700 shadow-lg rounded-lg"
              title="إضافة إيموجي"
            >
              <AnimatedEmoji emoji="😊" size={20} />
            </Button>
          </div>
          
          {/* Content Type Selection for Articles */}
          {contentType === 'articles' && (
            <div>
              <label className="block text-sm font-bold mb-3 text-white flex items-center gap-2">
                
                نوع المحتوى
              </label>
              <select
                className="h-12 w-full px-3 rounded-xl bg-[#011910] border appearance-none text-white"
                value={type}
                onChange={(e) => setType(e.target.value as 'text' | 'link' | 'photo' | 'video')}
              >
                <option  value="text"> نص فقط</option>
                {/* <option value="link">🔗 رابط</option> */}
                <option value="photo"> صورة</option>
                <option value="video"> فيديو</option>
              </select>
            </div>
          )}
          
          {/* Content Type Selection for Stories */}
          {contentType === 'stories' && (
            <div>
              <label className="block text-sm font-bold mb-3 text-white flex items-center gap-2">
           
                نوع الستوري
              </label>
              <select
                className="h-12 w-full px-3 rounded-xl bg-[#011910] border appearance-none text-white"
                value={type}
                onChange={(e) => setType(e.target.value as 'photo' | 'video')}
              >
                <option value="photo"> صورة</option>
                <option value="video"> فيديو</option>
              </select>
            </div>
          )}

          {/* Pinterest Board Selection */}
          {/* {platforms.includes('pinterest') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-xl">📌</span>
                  لوحة Pinterest
                </label>
                <Button 
                  size="sm" 
                  onClick={loadPinterestBoards}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 shadow-md text-sm"
                >
                  🔄 تحديث اللوحات
                </Button>
              </div>
              <select
                className="h-12 w-full rounded-xl !border-2 !border-green-500/50 focus:!border-green-500 !outline-none !bg-gray-800/50 !text-white px-4 text-base font-semibold shadow-lg"
                value={pinterestBoardId}
                onChange={(e) => setPinterestBoardId(e.target.value)}
                onFocus={() => { if (pinterestBoards.length === 0) loadPinterestBoards(); }}
              >
                <option value="">{pinterestBoards.length ? 'اختر لوحة...' : 'لم يتم العثور على لوحات'}</option>
                {pinterestBoards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2 font-semibold">مطلوب للنشر على Pinterest</p>
            </div>
          )} */}
          
          {/* Link URL Input */}
          {/* {type === 'link' && (
            <div>
              <label className="block text-sm font-bold mb-3 text-white flex items-center gap-2">
                <span className="text-xl">🔗</span>
                رابط URL
              </label>
              <Input 
                placeholder="https://example.com" 
                value={linkUrl} 
                onChange={(e) => setLinkUrl(e.target.value)}
                className="h-12 bg-secondry border appearance-none text-white"
              />
            </div>
          )}
           */}
          {/* Media and Schedule */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-bold mb-3 text-white flex items-center gap-2">
                {/* <span className="text-xl">
                  {contentType === 'reels' ? '🎬' : contentType === 'stories' ? '📸' : '🖼️'}
                </span> */}
                {contentType === 'reels' ? 'فيديو الريلز (مطلوب)' : 
                 contentType === 'stories' ? 'صورة أو فيديو (مطلوب)' :
                 'وسائط (اختياري)'}
              </label>
              <Input
                type="file"
                accept={contentType === 'reels' ? 'video/*' : 
                        contentType === 'stories' ? 'image/*,video/*' :
                        'image/*,video/*'}
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="h-12 w-full px-3 rounded-xl bg-[#011910] border appearance-none text-white"
              />
              {image && (
                <p className="mt-2 text-sm text-green-400 font-semibold flex items-center gap-2">
                  <span>✓</span>
                  تم اختيار: {image.name}
                </p>
              )}
              {contentType === 'reels' && (
                <p className="mt-2 text-xs text-gray-400">الريلز تتطلب ملف فيديو</p>
              )}
              {contentType === 'stories' && (
                <p className="mt-2 text-xs text-gray-400">الستوري يتطلب صورة أو فيديو</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-3 text-white flex items-center gap-2">
           
                الجدولة (اختياري)
              </label>
              <Input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="h-12 w-full px-3 rounded-xl bg-[#011910] border appearance-none text-white"
              />
              {when && (
                <p className="mt-2 text-sm text-green-400 font-semibold flex items-center gap-2">
                  <span>⏰</span>
                  سيتم النشر في: {new Date(when).toLocaleString('ar-EG')}
                </p>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={() => mutation.mutate()} 
              disabled={
                mutation.isPending || 
                platforms.length === 0 || 
                (contentType === 'stories' && platforms.includes('telegram') && telegramGroups.length === 0) ||
                (postUsageStats?.isAtLimit || false)
              }
              className=" h-14 primary-button after:bg-yellow-600 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  جاري الحفظ...
                </span>
              ) : when ? (
                <span className="flex items-center gap-2">
                
                  حفظ وجدولة
                </span>
              ) : (
                <span className="flex items-center gap-2">
               
               حفظ وجدولة
                </span>
              )}
            </Button>
            
            <Button  
              onClick={() => { setWhen(""); mutation.mutate(); }} 
              disabled={
                mutation.isPending || 
                platforms.length === 0 ||
                (contentType === 'stories' && platforms.includes('telegram') && telegramGroups.length === 0) ||
                (postUsageStats?.isAtLimit || false)
              }
              className=" h-14 primary-button text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  جاري النشر...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                 
                  نشر الآن
                </span>
              )}
            </Button>
          </div>
          
          {/* Validation messages for stories */}
          {contentType === 'stories' && platforms.length > 0 && (
            <div className="space-y-3">
              {platforms.includes('telegram') && telegramGroups.length === 0 && (
                <div className="p-5 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl shadow-lg">
                  <p className="text-base text-red-800 font-semibold flex items-center gap-2">
                    <span className="text-2xl">❌</span>
                    <span>لا توجد قنوات Telegram - يرجى إضافة البوت كأدمن ثم الضغط على مزامنة</span>
                  </p>
                </div>
              )}
              {platforms.includes('telegram') && telegramGroups.length > 0 && (
                <div className="p-5 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl shadow-lg">
                  <p className="text-base text-green-800 font-semibold flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span>جاهز للنشر على {telegramGroups.length} قناة/مجموعة في Telegram</span>
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Post limit validation messages */}
          {postUsageStats && postUsageStats.isAtLimit && (
            <div className="p-5 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl shadow-lg">
              <p className="text-base text-red-800 font-semibold flex items-center gap-2">
                <span className="text-2xl">🚫</span>
                <span>تم الوصول للحد الأقصى من المنشورات الشهرية ({postUsageStats.monthlyLimit} منشور)</span>
              </p>
              <p className="text-sm text-red-700 mt-2">
                يرجى ترقية باقتك أو انتظار بداية الشهر الجديد لإنشاء المزيد من المنشورات
              </p>
              <Button 
                onClick={() => window.location.href = '/plans'}
                className="mt-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 text-sm font-semibold shadow-lg"
              >
                ترقية الباقة
              </Button>
            </div>
          )}
          
          {postUsageStats && postUsageStats.isNearLimit && !postUsageStats.isAtLimit && (
            <div className="p-5 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl shadow-lg">
              <p className="text-base text-orange-800 font-semibold flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <span>تقترب من الحد الأقصى - متبقي {postUsageStats.remaining} منشور فقط</span>
              </p>
              <p className="text-sm text-orange-700 mt-2">
                استخدم منشوراتك بحكمة أو فكر في ترقية باقتك
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={(emoji) => {
          setText(prev => prev + emoji);
          setShowEmojiPicker(false);
        }}
      />
    </div>
  );
}




