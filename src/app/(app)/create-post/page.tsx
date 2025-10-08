"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, listPinterestBoards, checkPlatformConnections, getCurrentFacebookPage } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import YouTubeChannelSelection from "@/components/YouTubeChannelSelection";

// Platform configuration with icons and supported content types
const PLATFORMS = {
  instagram: {
    name: "Instagram",
    icon: "📷",
    supportedTypes: ['photo', 'video', 'text'],
    supportedFormats: ['feed', 'reel'],
    color: "from-pink-500 to-purple-600"
  },
  facebook: {
    name: "Facebook", 
    icon: "👥",
    supportedTypes: ['photo', 'video', 'text', 'link'],
    supportedFormats: ['feed'],
    color: "from-blue-600 to-blue-800"
  },
  youtube: {
    name: "YouTube",
    icon: "▶️", 
    supportedTypes: ['photo', 'video', 'text', 'link'],
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
  twitter: {
    name: "Twitter (X)",
    icon: "𝕏",
    supportedTypes: ['text', 'link', 'photo'],
    supportedFormats: ['feed'],
    color: "from-gray-900 to-gray-700"
  }
};

export default function CreatePostPage() {
  const { hasActiveSubscription, hasPlatformAccess, loading: permissionsLoading } = usePermissions();
  
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [when, setWhen] = useState<string>("");
  const [type, setType] = useState<'text' | 'link' | 'photo' | 'video'>("text");
  const [format, setFormat] = useState<'feed' | 'reel'>("feed");
  const [contentType, setContentType] = useState<'articles' | 'reels'>('articles');
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [hashtags, setHashtags] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [platforms, setPlatforms] = useState<string[]>(['facebook']);
  const [pinterestBoardId, setPinterestBoardId] = useState<string>("");
  const [pinterestBoards, setPinterestBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState<boolean>(true);
  const [isDevelopment, setIsDevelopment] = useState<boolean>(false);
  const [showYouTubeSelection, setShowYouTubeSelection] = useState<boolean>(false);
  const [currentFacebookPage, setCurrentFacebookPage] = useState<{pageName: string, fanCount: number} | null>(null);

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

  // Auto-load boards when Pinterest is selected
  useEffect(() => {
    if (platforms.includes('pinterest')) {
      loadPinterestBoards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms.includes('pinterest')]);

  // Load current Facebook page when Facebook is selected
  useEffect(() => {
    if (platforms.includes('facebook') && connectedPlatforms.includes('facebook')) {
      loadCurrentFacebookPage();
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
      
      // Ensure type is video for reels
      const finalType = contentType === 'reels' ? 'video' : type;
      const finalFormat = contentType === 'reels' ? 'reel' : 'feed';
      
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
      setMessage(post.status === "published" ? "تم النشر بنجاح!" : (post.status === "scheduled" ? "تم الجدولة بنجاح" : "تم الحفظ كمسودة"));
      setText("");
      setWhen("");
      setImage(null);
      setLinkUrl("");
      setHashtags("");
      setPinterestBoardId("");
    },
  });

  // Check permissions after all hooks
  if (permissionsLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-white">إنشاء منشور</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription()) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-white">إنشاء منشور</h1>
        <Card className="bg-card border-none">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-white mb-2">لا يوجد اشتراك نشط</h3>
            <p className="text-gray-400 mb-4">تحتاج إلى اشتراك نشط لإنشاء المنشورات</p>
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              تصفح الباقات
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
          fanCount: res.fanCount
        });
      }
    } catch (error) {
      console.error('Error loading current Facebook page:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">إنشاء منشور</h1>
      
      {/* Content Type Selection */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50">
          <h2 className="text-lg font-semibold text-white">خيارات النشر</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setContentType('articles'); setType('text'); setFormat('feed'); }}
              className={`p-4 rounded-lg transition-all ${
                contentType === 'articles' 
                  ? 'border-text-primary border bg-light-custom' 
                  : 'border-gray-200 border-gray-300 bg-semidark-custom'
              }`}
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm font-medium text-white">مقالات</div>
              <div className="text-xs text-gray-400 mt-1">نص مع صور/فيديو اختياري</div>
            </button>
            
            <button
              onClick={() => { setContentType('reels'); setType('video'); setFormat('reel'); }}
              className={`p-4 rounded-lg transition-all ${
                contentType === 'reels' 
                  ? 'border-text-primary border bg-light-custom' 
                  : 'border-gray-200 border-gray-300 bg-semidark-custom'
              }`}
            >
              <div className="text-2xl mb-2">🎬</div>
              <div className="text-sm font-medium text-white">فيديوهات قصيرة</div>
              <div className="text-xs text-gray-400 mt-1">ريلز فقط</div>
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
                {getAvailablePlatforms().map(([key, platform]) => {
                  const isConnected = isPlatformConnected(key);
                  const isSelected = isPlatformSelected(key);
                  
                  return (
                    <button
                      key={key}
                      onClick={() => isConnected ? togglePlatform(key) : null}
                      disabled={!isConnected}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50' 
                          : isConnected
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
                    </button>
                  );
                })}
          </div>
          
          {/* Platform Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{contentType === 'reels' ? 'المنصات المتاحة للريلز:' : 'المنصات المتاحة للمقالات:'}</strong>
              {contentType === 'reels' 
                ? ' Instagram و TikTok (فيديو قصير فقط)'
                : ' جميع المنصات المتصلة (Facebook, Instagram, LinkedIn, Pinterest, Twitter, YouTube)'
              }
            </p>
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
                        <div className="text-sm font-medium text-blue-900">
                          صفحة Facebook
                          {currentFacebookPage && (
                            <span className="ml-2 text-xs text-gray-600">
                              ({currentFacebookPage.pageName})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-700">
                          {currentFacebookPage ? 
                            `محددة: ${currentFacebookPage.pageName} (${currentFacebookPage.fanCount} معجب)` : 
                            'محددة تلقائياً للنشر'
                          }
                        </div>
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
                 
              </div>
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
          
              {platforms.length === 0 && (
                <div className="mt-4 text-center">
                  {connectionsLoading ? (
                    <p className="text-sm text-gray-600">جاري تحميل المنصات...</p>
                  ) : getAvailablePlatforms().length === 0 ? (
                    <div className="p-4 bg-red-200 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 mb-2">
                        <strong>لا توجد منصات متاحة في باقتك</strong>
                      </p>
                      <p className="text-xs text-red-700 mb-3">
                        باقتك الحالية لا تشمل أي منصات اجتماعية. يرجى ترقية باقتك للوصول إلى المنصات الاجتماعية.
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => window.location.href = '/plans'}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        ترقية الباقة
                      </Button>
                    </div>
                  ) : connectedPlatforms.length === 0 ? (
                    <div className="p-4 bg-yellow-200 border border-yellow-200 rounded-lg">
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
          
          {/* Content Type Selection for Articles */}
          {contentType === 'articles' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-white">نوع المحتوى</label>
              <select
                className="h-9 w-full rounded-md !border !border-text-primary !outline-none !bg-gray-700/30 !text-white px-3 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as 'text' | 'link' | 'photo' | 'video')}
              >
                <option value="text">نص فقط</option>
                <option value="link">رابط</option>
                <option value="photo">صورة</option>
                <option value="video">فيديو</option>
              </select>
            </div>
          )}

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
                {contentType === 'reels' ? 'فيديو (MP4 مُوصى به)' : 
                 contentType === 'articles' ? 'وسائط اختيارية (صورة/فيديو)' : 
                 'وسائط (صورة/فيديو)'}
              </label>
              <Input
                type="file"
                accept={contentType === 'reels' ? 'video/*' : 
                        contentType === 'articles' ? 'image/*,video/*' : 
                        'image/*,video/*'}
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="!border !border-text-primary !outline-none !bg-gray-700/30 !text-white"
              />
              {contentType === 'reels' && <p className="mt-1 text-xs text-gray-500">الريلز تتطلب ملف فيديو. الصور غير مدعومة للريلز.</p>}
              {contentType === 'articles' && <p className="mt-1 text-xs text-gray-500">الصور والفيديوهات اختيارية للمقالات.</p>}
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
              {mutation.isPending ? "جاري الحفظ..." : when ? "حفظ وجدولة" : "حفظ كمسودة"}
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
