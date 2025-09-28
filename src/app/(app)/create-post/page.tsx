"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, listPinterestBoards, checkPlatformConnections } from "@/lib/api";
import FacebookPageSelection from "@/components/FacebookPageSelection";
import YouTubeChannelSelection from "@/components/YouTubeChannelSelection";

// Platform configuration with icons and supported content types
const PLATFORMS = {
  instagram: {
    name: "Instagram",
    icon: "📷",
    supportedTypes: ['photo', 'video', 'text'],
    supportedFormats: ['feed', 'story', 'reel'],
    color: "from-pink-500 to-purple-600"
  },
  facebook: {
    name: "Facebook", 
    icon: "👥",
    supportedTypes: ['photo', 'video', 'text', 'link'],
    supportedFormats: ['feed', 'story'],
    color: "from-blue-600 to-blue-800"
  },
  youtube: {
    name: "YouTube",
    icon: "▶️", 
    supportedTypes: ['video'],
    supportedFormats: ['feed'],
    color: "from-red-500 to-red-700"
  },
  tiktok: {
    name: "TikTok",
    icon: "🎵",
    supportedTypes: ['video'],
    supportedFormats: ['feed'],
    color: "from-black to-gray-800"
  },
  linkedin: {
    name: "LinkedIn",
    icon: "💼",
    supportedTypes: ['photo', 'video', 'text', 'link'],
    supportedFormats: ['feed'],
    color: "from-blue-700 to-blue-900"
  },
   pinterest: {
     name: "Pinterest",
     icon: "📌",
     supportedTypes: ['photo', 'link'],
     supportedFormats: ['feed'],
     color: "from-red-600 to-pink-600"
   },
   telegram: {
     name: "Telegram",
     icon: "✈️",
     supportedTypes: ['photo', 'video', 'text', 'link'],
     supportedFormats: ['feed', 'channel'],
     color: "from-blue-500 to-blue-700"
   }
};

export default function CreatePostPage() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [when, setWhen] = useState<string>("");
  const [type, setType] = useState<'text' | 'link' | 'photo' | 'video'>("text");
  const [format, setFormat] = useState<'feed' | 'reel' | 'story'>("feed");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [hashtags, setHashtags] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [platforms, setPlatforms] = useState<string[]>(['facebook']);
  const [pinterestBoardId, setPinterestBoardId] = useState<string>("");
  const [pinterestBoards, setPinterestBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState<boolean>(true);
  const [isDevelopment, setIsDevelopment] = useState<boolean>(false);
  const [showFacebookSelection, setShowFacebookSelection] = useState<boolean>(false);
  const [showYouTubeSelection, setShowYouTubeSelection] = useState<boolean>(false);

  // Helper function to get all platforms (for initial display)
  const getAllPlatforms = () => {
    return Object.entries(PLATFORMS);
  };

  // Helper function to get available platforms based on content type and format
  const getAvailablePlatforms = () => {
    return Object.entries(PLATFORMS).filter(([key, platform]) => {
      const supportsType = platform.supportedTypes.includes(type);
      const supportsFormat = platform.supportedFormats.includes(format);
      return supportsType && supportsFormat;
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
  
  const mutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("auth_token") || "";
      const scheduledAt = when ? new Date(when).toISOString() : undefined;
      let mediaUrl: string | undefined = undefined;
      
      // Validation: Reels require a video file
      if (format === 'reel') {
        if (!image || !image.type?.startsWith('video')) {
          throw new Error('Reels require a video file. Please upload a video.');
        }
        // Force type to video for reels
        setType('video');
      }
      
      // Validation: Stories require photo or video
      if (format === 'story') {
        if (!image) {
          throw new Error('Stories require a photo or video file.');
        }
        if (type === 'text' || type === 'link') {
          throw new Error('Stories must be photo or video type.');
        }
      }
      
      // Validation: photo/video types require a file
      if ((type === 'photo' || type === 'video') && !image) {
        throw new Error('Please upload a media file for photo/video posts.');
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
        
        if (format === 'reel' && !isVideo) {
          throw new Error('Reels require a video file.');
        }
        
        if (type === 'photo' && isVideo) {
          // Auto-correct to video if user selected photo but uploaded a video
          setType('video');
        }
        
        if (type === 'video' && isImage) {
          throw new Error('You selected video type but uploaded an image. Switch type to Photo or upload a video.');
        }
      }
      
      // Ensure type is video for reels
      const finalType = format === 'reel' ? 'video' : type;
      
      // Debug logging
      console.log('Creating post with payload:', {
        type: finalType,
        content: text,
        linkUrl: linkUrl || undefined,
        mediaUrl,
        hashtags,
        format,
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
          format, 
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
      setMessage(post.status === "published" ? "Post published!" : (post.status === "scheduled" ? "Post scheduled" : "Draft saved"));
      setText("");
      setWhen("");
      setImage(null);
      setLinkUrl("");
      setHashtags("");
      setPinterestBoardId("");
    },
  });

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
      if (platform === 'pinterest') {
        setPinterestBoardId("");
      }
    } else {
      setPlatforms([...platforms, platform]);
      
      // If Facebook is selected and connected, show page selection modal
      if (platform === 'facebook' && isPlatformConnected('facebook')) {
        setShowFacebookSelection(true);
      }
      
      // If YouTube is selected and connected, show channel selection modal
      if (platform === 'youtube' && isPlatformConnected('youtube')) {
        setShowYouTubeSelection(true);
      }
    }
  };

  // Auto-filter platforms when type or format changes
  useEffect(() => {
    const availablePlatforms = getAvailablePlatforms();
    const availableKeys = availablePlatforms.map(([key]) => key);
    
    // Remove platforms that don't support current type/format
    const filteredPlatforms = platforms.filter(platform => availableKeys.includes(platform));
    if (filteredPlatforms.length !== platforms.length) {
      setPlatforms(filteredPlatforms);
    }
  }, [type, format]);

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
        // Fallback to no connections in case of error
        setConnectedPlatforms([]);
        setIsDevelopment(false);
        setPlatforms([]);
      } finally {
        setConnectionsLoading(false);
      }
    };

    loadConnections();
  }, []);

  // Auto-load boards when Pinterest is selected
  useEffect(() => {
    if (platforms.includes('pinterest')) {
      loadPinterestBoards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms.includes('pinterest')]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">إنشاء منشور</h1>
      
      {/* Content Type Selection */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50">
          <h2 className="text-lg font-semibold text-white">خيارات النشر</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setFormat('story')}
              className={`p-4  rounded-lg  transition-all ${
                format === 'story' 
                  ? 'border-text-primary border bg-light-custom' 
                  : 'border-gray-200 border-gray-300 bg-semidark-custom'
              }`}
            >
              <div className="text-2xl mb-2">📱</div>
              <div className="text-sm font-medium text-white">نشر ستوري</div>
            </button>
            
            <button
              onClick={() => { setFormat('feed'); setType('photo'); }}
              className={`p-4 rounded-lg  transition-all ${
                format === 'feed' && type === 'photo' 
                  ? 'border-text-primary border bg-light-custom' 
                  : 'border-gray-200 border-gray-300 bg-semidark-custom'
              }`}
            >
              <div className="text-2xl mb-2">📷</div>
              <div className="text-sm font-medium text-white">نشر صور</div>
            </button>
            
            <button
              onClick={() => { setFormat('reel'); setType('video'); }}
              className={`p-4 rounded-lg  transition-all ${
                format === 'reel' 
                  ? 'border-text-primary border bg-light-custom' 
                  : 'border-gray-200 border-gray-300 bg-semidark-custom'
              }`}
            >
              <div className="text-2xl mb-2">🎬</div>
              <div className="text-sm font-medium text-white">فيديوهات قصيرة</div>
            </button>
            
            <button
              onClick={() => { setFormat('feed'); setType('text'); }}
              className={`p-4 rounded-lg  transition-all ${
                format === 'feed' && type === 'text' 
                  ? 'border-text-primary border bg-light-custom' 
                  : 'border-gray-200 border-gray-300 bg-semidark-custom'
              }`}
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm font-medium text-white">مقالات</div>
            </button>
          </div>
        </CardContent>
      </Card>

          {/* Platform Selection */}
      <Card className="bg-card border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">اختر المنصات</h2>
            {isDevelopment && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                وضع التطوير
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {connectionsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 rounded-lg border-2 border-gray-200 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {getAllPlatforms().map(([key, platform]) => {
                  const isConnected = isPlatformConnected(key);
                  const isSelected = isPlatformSelected(key);
                  const isCompatible = getAvailablePlatforms().some(([k]) => k === key);
                  
                  return (
                    <button
                      key={key}
                      onClick={() => isConnected && isCompatible ? togglePlatform(key) : null}
                      disabled={!isConnected || !isCompatible}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50' 
                          : isConnected && isCompatible
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {/* Connection Status Indicator */}
                      {isConnected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                      
                      <div className="text-2xl mb-2">{platform.icon}</div>
                      <div className="text-sm font-medium">{platform.name}</div>
                      
                      {!isConnected && (
                        <div className="text-xs text-gray-400 mt-1">غير متصل</div>
                      )}
                      
                      {isConnected && !isCompatible && (
                        <div className="text-xs text-orange-500 mt-1">غير متوافق</div>
                      )}
                    </button>
                  );
                })}
          </div>
          
          {/* Platform Details */}
          {platforms.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">تفاصيل المنصات المحددة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Facebook Page and Instagram */}
                {platforms.includes('facebook') && isPlatformConnected('facebook') && (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">👥</div>
                      <div>
                        <div className="text-sm font-medium text-blue-900">صفحة Facebook</div>
                        <div className="text-xs text-blue-700">محددة تلقائياً للنشر</div>
                      </div>
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">📷</div>
                      <div>
                        <div className="text-sm font-medium text-blue-900">حساب Instagram</div>
                        <div className="text-xs text-blue-700">مرتبط بصفحة Facebook</div>
                      </div>
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Pinterest Board */}
                {platforms.includes('pinterest') && isPlatformConnected('pinterest') && (
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">📌</div>
                    <div>
                      <div className="text-sm font-medium text-blue-900">لوحة Pinterest</div>
                      <div className="text-xs text-blue-700">محددة تلقائياً للنشر</div>
                    </div>
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                )}
                
                {/* YouTube Channel */}
                {platforms.includes('youtube') && isPlatformConnected('youtube') && (
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">▶️</div>
                    <div>
                      <div className="text-sm font-medium text-blue-900">قناة YouTube</div>
                      <div className="text-xs text-blue-700">اختر القناة للنشر</div>
                    </div>
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                )}
                
                {/* LinkedIn Company */}
                {platforms.includes('linkedin') && isPlatformConnected('linkedin') && (
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">💼</div>
                    <div>
                      <div className="text-sm font-medium text-blue-900">شركة LinkedIn</div>
                      <div className="text-xs text-blue-700">محددة تلقائياً للنشر</div>
                    </div>
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                )}
                
                 {/* TikTok Account */}
                 {platforms.includes('tiktok') && isPlatformConnected('tiktok') && (
                   <div className="flex items-center space-x-3">
                     <div className="text-xl">🎵</div>
                     <div>
                       <div className="text-sm font-medium text-blue-900">حساب TikTok</div>
                       <div className="text-xs text-blue-700">محدد تلقائياً للنشر</div>
                     </div>
                     <div className="ml-auto">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     </div>
                   </div>
                 )}
                 
                 {/* Telegram Channel */}
                 {platforms.includes('telegram') && isPlatformConnected('telegram') && (
                   <div className="flex items-center space-x-3">
                     <div className="text-xl">✈️</div>
                     <div>
                       <div className="text-sm font-medium text-blue-900">قناة Telegram</div>
                       <div className="text-xs text-blue-700">محددة تلقائياً للنشر</div>
                     </div>
                     <div className="ml-auto">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          )}
          
          {/* Facebook Page Selection Modal */}
          <FacebookPageSelection
            isOpen={showFacebookSelection}
            onClose={() => setShowFacebookSelection(false)}
            onComplete={() => {
              setShowFacebookSelection(false);
              // Optionally refresh platform connections
            }}
          />
          
          {/* YouTube Channel Selection Modal */}
          <YouTubeChannelSelection
            isOpen={showYouTubeSelection}
            onClose={() => setShowYouTubeSelection(false)}
            onComplete={() => {
              setShowYouTubeSelection(false);
              // Optionally refresh platform connections
            }}
          />
          
              {platforms.length === 0 && (
                <div className="mt-4 text-center">
                  {connectionsLoading ? (
                    <p className="text-sm text-gray-600">جاري تحميل المنصات...</p>
                  ) : connectedPlatforms.length === 0 ? (
                    <div className="p-4 bg-red-200 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-2">
                        <strong>لا توجد منصات متصلة</strong>
                      </p>
                      <p className="text-xs text-yellow-700 mb-3">
                        يرجى ربط حساباتك الاجتماعية من صفحة الإعدادات أولاً
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => window.location.href = '/settings'}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        الذهاب للإعدادات
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">يرجى اختيار منصة واحدة على الأقل</p>
                  )}
                </div>
              )}
              
              {isDevelopment && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>وضع التطوير:</strong> يتم عرض جميع المنصات. المنصات المتصلة فقط يمكن اختيارها.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Content Creation */}
      <Card className="bg-card border-none">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">محتوى المنشور</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="اكتب منشورك مع الهاشتاغات والإيموجي"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] !border !border-text-primary outline-none !bg-gray-700/30 !text-white placeholder:text-gray-400"
          />

          {platforms.includes('pinterest') && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium mb-1">لوحة Pinterest</label>
                <Button size="sm" variant="secondary" onClick={loadPinterestBoards}>تحديث اللوحات</Button>
              </div>
              <select
                className="h-9 w-full rounded-md !border !border-text-primary !outline-none !bg-gray-700/30 !text-white px-3 text-sm"
                value={pinterestBoardId}
                onChange={(e) => setPinterestBoardId(e.target.value)}
                onFocus={() => { if (pinterestBoards.length === 0) loadPinterestBoards(); }}
              >
                <option value="">{pinterestBoards.length ? 'اختر لوحة...' : 'لم يتم العثور على لوحات (أنشئ واحدة في Pinterest)'}</option>
                {pinterestBoards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">مطلوب للنشر على Pinterest.</p>
            </div>
          )}
          
          {type === 'link' && (
            <div>
              <label className="block text-sm font-medium mb-1">رابط URL</label>
              <Input 
                placeholder="https://example.com" 
                value={linkUrl} 
                onChange={(e) => setLinkUrl(e.target.value)}
                className="!border !border-text-primary !outline-none !bg-gray-700/30 !text-white placeholder:text-gray-400"
              />
            </div>
          )}
          
          {/* <div>
            <label className="block text-sm font-medium mb-1">الهاشتاغات (مفصولة بفاصلة أو مسافة)</label>
            <Input 
              placeholder="#اجتماعي #تسويق" 
              value={hashtags} 
              onChange={(e) => setHashtags(e.target.value)}
              className="!border !border-text-primary !outline-none !bg-gray-700/30 !text-white placeholder:text-gray-400"
            />
          </div> */}
          
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1 text-white">
                {format === 'reel' ? 'فيديو (MP4 مُوصى به)' : 
                 format === 'story' ? 'وسائط (صورة/فيديو)' :
                 type === 'video' ? 'فيديو' : 
                 type === 'photo' ? 'صورة' : 'وسائط (صورة/فيديو)'}
              </label>
              <Input
                type="file"
                accept={format === 'reel' ? 'video/*' : 
                        format === 'story' ? 'image/*,video/*' :
                        type === 'video' ? 'video/*' : 
                        type === 'photo' ? 'image/jpeg,image/png' : 'image/jpeg,image/png,video/*'}
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="!border !border-text-primary !outline-none !bg-gray-700/30 !text-white"
              />
              {format === 'reel' && <p className="mt-1 text-xs text-gray-500">الريلز تتطلب ملف فيديو. الصور غير مدعومة من فيسبوك للريلز.</p>}
              {format === 'story' && <p className="mt-1 text-xs text-gray-500">الستوريز تدعم الصور والفيديوهات.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">الجدولة (التاريخ والوقت)</label>
              <Input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="!border !border-text-primary !outline-none !bg-gray-700/30 !text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || platforms.length === 0} className="flex-1 bg-yellow-300 text-white">
              {mutation.isPending ? "جاري الحفظ..." : when ? "حفظ وجدولة" : "حفظ وجدولة "}
            </Button>
            <Button  onClick={() => { setWhen(""); mutation.mutate(); }} disabled={mutation.isPending || platforms.length === 0} className="flex-1 bg-green-300 text-white">
              {mutation.isPending ? "جاري النشر..." : "نشر الآن"}
            </Button>
          </div>
          
          {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
