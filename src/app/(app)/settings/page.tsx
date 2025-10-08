"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  checkPlatformConnections, 
  exchangeLinkedInCode, 
  exchangePinterestCode,
  exchangeFacebookCode,
  exchangeYouTubeCode,
  exchangeTikTokCode,
  listPlatformCredentials,
  getPlatformCredential,
  upsertPlatformCredential,
  deletePlatformCredential,
  getAvailableFacebookPages,
  getCurrentFacebookPage,
  switchFacebookPage,
  getFacebookPageDetails,
  getLinkedInProfileDetails,
  getTwitterAccountDetails,
  getYouTubeChannelDetails,
  getPinterestAccountDetails,
  getInstagramAccountInfo
} from "@/lib/api";
import { exchangeTwitterCode } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import FacebookPageSelection from "@/components/FacebookPageSelection";
import YouTubeChannelSelection from "@/components/YouTubeChannelSelection";

const PLATFORMS = {
  facebook: { name: "Facebook", icon: "👥", connectUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/facebook` },
  instagram: { name: "Instagram", icon: "📷", connectUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/instagram` },
  youtube: { name: "YouTube", icon: "▶️", connectUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/youtube` },
  tiktok: { name: "TikTok", icon: "🎵", connectUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/tiktok` },
  linkedin: { name: "LinkedIn", icon: "💼", connectUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/linkedin` },
  pinterest: { name: "Pinterest", icon: "📌", connectUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/pinterest` },
  twitter: { name: "Twitter (X)", icon: "𝕏", connectUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/twitter` }
};

function SettingsContent() {
  const { hasActiveSubscription, hasPlatformAccess, loading: permissionsLoading } = usePermissions();
  
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showFacebookSelection, setShowFacebookSelection] = useState<boolean>(false);
  const [showYouTubeSelection, setShowYouTubeSelection] = useState<boolean>(false);
  const [availableFacebookPages, setAvailableFacebookPages] = useState<any[]>([]);
  const [currentFacebookPage, setCurrentFacebookPage] = useState<{pageId: string, pageName: string, fanCount: number} | null>(null);
  const [showFacebookPageManager, setShowFacebookPageManager] = useState<boolean>(false);
  const [creds, setCreds] = useState<Record<string, { clientId: string; redirectUri?: string }>>({});
  const [edit, setEdit] = useState<{ platform: string; clientId: string; clientSecret: string; redirectUri?: string } | null>(null);
  const [platformDetails, setPlatformDetails] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token") || "";
      setToken(token);
      
      // Get user ID from token (decode JWT)
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(payload.sub);
        } catch (e) {
          console.error('Failed to decode token:', e);
        }
      }
    }
  }, []);

  // Handle OAuth callbacks
  useEffect(() => {
    if (!token) return;

    const platform = searchParams.get('platform');
    const linkedinCode = searchParams.get('linkedin_code');
    const pinterestCode = searchParams.get('pinterest_code');
    const facebookCode = searchParams.get('fb_code');
    const youtubeCode = searchParams.get('youtube_code');
    const tiktokCode = searchParams.get('tiktok_code');
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const twitterCode = searchParams.get('twitter_code');
    const codeVerifier = searchParams.get('code_verifier') || undefined;

    if (error) {
      console.error('OAuth error:', error, message);
      alert(`OAuth Error: ${message || error}`);
      return;
    }

    const handleOAuthCallback = async () => {
      if (!platform) return;

      setProcessing(platform);
      
      try {
        let result;
        switch (platform) {
          case 'linkedin':
            if (linkedinCode) {
              result = await exchangeLinkedInCode(token, linkedinCode);
            }
            break;
          case 'pinterest':
            if (pinterestCode) {
              result = await exchangePinterestCode(token, pinterestCode);
            }
            break;
          case 'facebook':
            if (facebookCode) {
              result = await exchangeFacebookCode(token, facebookCode);
            }
            break;
          case 'instagram':
            // Instagram uses Facebook OAuth, so use the same exchange function
            if (facebookCode) {
              result = await exchangeFacebookCode(token, facebookCode);
            }
            break;
          case 'youtube':
            if (youtubeCode) {
              result = await exchangeYouTubeCode(token, youtubeCode);
            }
            break;
          case 'tiktok':
            if (tiktokCode) {
              result = await exchangeTikTokCode(token, tiktokCode);
            }
            
            break;
          case 'twitter':
            if (twitterCode) {
              result = await exchangeTwitterCode(token, twitterCode, codeVerifier || undefined);
            }
            break;
        }

        if (result?.message) {
          console.log(`${platform} connection:`, result.message);
          
          // If Facebook connection, show page selection modal
          if (platform === 'facebook' || platform === 'instagram') {
            setShowFacebookSelection(true);
          } else if (platform === 'youtube') {
            // If YouTube connection, show channel selection modal
            setShowYouTubeSelection(true);
          } else {
            // For other platforms, just refresh connections
            loadPlatformConnections();
          }
        }
      } catch (error) {
        console.error(`Error connecting ${platform}:`, error);
        alert(`Error connecting ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setProcessing(null);
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleOAuthCallback();
  }, [token, searchParams]);

  const loadPlatformConnections = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await checkPlatformConnections(token);
      if (res.success) {
        const connected = Object.entries(res.connections)
          .filter(([_, isConnected]) => isConnected)
          .map(([platform, _]) => platform);
        setConnectedPlatforms(connected);
      }
    } catch (error) {
      console.error('Error loading platform connections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformConnections();
  }, [token]);

  const loadCredentials = async () => {
    if (!token) return;
    try {
      const res = await listPlatformCredentials(token);
      if (res.success) {
        const map: Record<string, { clientId: string; redirectUri?: string }> = {};
        for (const c of res.credentials) map[c.platform] = { clientId: c.clientId, redirectUri: c.redirectUri };
        setCreds(map);
      }
    } catch {}
  };

  useEffect(() => { loadCredentials(); }, [token]);

  // Load Facebook pages and current page
  const loadFacebookPages = async () => {
    try {
      if (!token) return;
      
      // Load available pages
      const pagesData = await getAvailableFacebookPages(token);
      if (pagesData.success) {
        setAvailableFacebookPages(pagesData.pages || []);
      }
      
      // Load current page
      const currentPageData = await getCurrentFacebookPage(token);
      if (currentPageData.success) {
        setCurrentFacebookPage({
          pageId: currentPageData.pageId,
          pageName: currentPageData.pageName,
          fanCount: currentPageData.fanCount
        });
      }
    } catch (error) {
      console.error('Error loading Facebook pages:', error);
    }
  };

  // Switch Facebook page
  const handleSwitchFacebookPage = async (pageId: string, pageName: string) => {
    try {
      if (!token) return;
      
      await switchFacebookPage(token, pageId, pageName);
      setCurrentFacebookPage({
        pageId,
        pageName,
        fanCount: 0 // Will be updated when page info is fetched
      });
      setShowFacebookPageManager(false);
      
      // Reload pages to get updated info
      await loadFacebookPages();
    } catch (error) {
      console.error('Error switching Facebook page:', error);
      alert('فشل في تغيير صفحة Facebook');
    }
  };

  // Load Facebook pages when Facebook is connected
  useEffect(() => {
    if (connectedPlatforms.includes('facebook') && token) {
      loadFacebookPages();
    }
  }, [connectedPlatforms, token]);

  // Also load Facebook pages when component mounts if Facebook is connected
  useEffect(() => {
    if (connectedPlatforms.includes('facebook') && token && !currentFacebookPage) {
      loadFacebookPages();
    }
  }, [connectedPlatforms, token, currentFacebookPage]);

  // Load platform details
  const loadPlatformDetails = async (platform: string) => {
    if (!token || loadingDetails[platform]) return;
    
    setLoadingDetails(prev => ({ ...prev, [platform]: true }));
    
    try {
      let details = null;
      
      switch (platform) {
        case 'facebook':
          details = await getFacebookPageDetails(token);
          break;
        case 'linkedin':
          details = await getLinkedInProfileDetails(token);
          break;
        case 'twitter':
          details = await getTwitterAccountDetails(token);
          break;
        case 'youtube':
          details = await getYouTubeChannelDetails(token);
          break;
        case 'pinterest':
          details = await getPinterestAccountDetails(token);
          break;
        case 'instagram':
          details = await getInstagramAccountInfo(token);
          break;
      }
      
      if (details?.success) {
        setPlatformDetails(prev => ({ ...prev, [platform]: details }));
      }
    } catch (error) {
      console.error(`Error loading ${platform} details:`, error);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [platform]: false }));
    }
  };

  // Load all platform details when platforms are connected
  useEffect(() => {
    if (token && connectedPlatforms.length > 0) {
      connectedPlatforms.forEach(platform => {
        loadPlatformDetails(platform);
      });
    }
  }, [token, connectedPlatforms]);

  // Check permissions
  if (permissionsLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-white">إعدادات الحساب</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription()) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-white">إعدادات الحساب</h1>
        <Card className="bg-card border-none">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-white mb-2">لا يوجد اشتراك نشط</h3>
            <p className="text-gray-400 mb-4">تحتاج إلى اشتراك نشط للوصول إلى إعدادات الحساب</p>
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

  const isPlatformConnected = (platformKey: string) => {
    return connectedPlatforms.includes(platformKey);
  };

  const handleConnect = (platformKey: string) => {
    if (!userId) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }
    
    const platform = PLATFORMS[platformKey as keyof typeof PLATFORMS];
    if (platform) {
      // Add userId parameter to OAuth URL for platforms that need it
      if (['facebook', 'instagram', 'pinterest', 'youtube', 'twitter', 'tiktok'].includes(platformKey)) {
        window.location.href = `${platform.connectUrl}?userId=${userId}`;
      } else {
        window.location.href = platform.connectUrl;
      }
    }
  };

  const handleDisconnect = async (platformKey: string) => {
    if (!token) return;
    
    setProcessing(platformKey);
    try {
      // Call the appropriate disconnect endpoint for each platform
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/${platformKey}/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (result.success || result.message) {
        console.log(`${platformKey} disconnected successfully`);
        await loadPlatformConnections();
      } else {
        throw new Error(result.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error(`Error disconnecting ${platformKey}:`, error);
      alert(`Error disconnecting ${platformKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">الإعدادات</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-6 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">إعدادات النظام</h1>
            <p className="text-gray-300 text-lg">إدارة شاملة لاتصالات المنصات الاجتماعية والتكاملات</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">الحالة</div>
            <div className="text-green-400 font-medium">🟢 متصل</div>
          </div>
        </div>
      </div>
      
      {/* Platform Connections */}
      <Card className="card-gradient-green-teal card-hover-effect">
        <CardHeader className="border-b border-teal-500/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">اتصالات المنصات</h2>
            <div className="text-teal-400">🔗</div>
          </div>
          <p className="text-sm text-gray-300">إدارة اتصالاتك مع المنصات الاجتماعية</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(PLATFORMS)
              .filter(([key, platform]) => hasPlatformAccess(key))
              .map(([key, platform]) => {
              const isConnected = isPlatformConnected(key);
              
              return (
                <Card key={key} className={`card-hover-effect ${
                  isConnected ? 'card-gradient-green' : 'card-default'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex flex-col items-center justify-center space-x-3">
                        <div className="text-2xl">{platform.icon}</div>
                        <div>
                          <h3 className="font-semibold text-primary">{platform.name}</h3>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              isConnected ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm ${
                              isConnected ? 'status-online' : 'status-offline'
                            }`}>
                              {isConnected ? 'متصل' : 'غير متصل'}
                            </span>
            </div>
                  </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 ">
                      {isConnected ? (
                        <div className="space-y-2 ">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleDisconnect(key)}
                            disabled={processing === key}
                          >
                            {processing === key ? 'جاري قطع الاتصال...' : 'قطع الاتصال'}
                          </Button>
                          <p className="text-xs text-green-600 text-center">
                            يمكنك الآن النشر على {platform.name}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            size="sm" 
                            className="w-full button-primary"
                            onClick={() => handleConnect(key)}
                            disabled={processing === key}
                          >
                            {processing === key ? 'جاري المعالجة...' : 'ربط الحساب'}
                          </Button>
                          <p className="text-xs text-gray-500 text-center">
                            قم بربط حسابك للنشر على {platform.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
        </CardContent>
      </Card>

      {/* Facebook Page Management */}
      {connectedPlatforms.includes('facebook') && (
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">
            <h2 className="text-lg font-semibold">إدارة صفحة Facebook</h2>
            <p className="text-sm text-gray-400">اختر صفحة Facebook للنشر عليها</p>
          </CardHeader>
          <CardContent>
            {currentFacebookPage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">👥</div>
                    <div>
                      <div className="font-semibold text-blue-900">{currentFacebookPage.pageName}</div>
                      <div className="text-sm text-blue-700">
                        {currentFacebookPage.fanCount} معجب • الصفحة النشطة للنشر
                      </div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                
                <Button 
                  onClick={() => {
                    setShowFacebookPageManager(true);
                    loadFacebookPages(); // Load pages when opening modal
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  تغيير صفحة Facebook
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد صفحة محددة</h3>
                <p className="text-sm text-gray-500 mb-4">
                  اختر صفحة Facebook للنشر عليها
                </p>
                <Button 
                  onClick={() => {
                    setShowFacebookPageManager(true);
                    loadFacebookPages(); // Load pages when opening modal
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  اختيار صفحة Facebook
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h2 className="text-lg font-semibold">تكوين تطبيقات المنصات لكل مستخدم</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PLATFORMS).map(([key, platform]) => (
              <Card key={`creds-${key}`} className="border-none bg-semidark-custom">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-xl">{platform.icon}</div>
                      <div className="font-semibold text-primary">{platform.name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300">
                    <div>Client ID: {creds[key]?.clientId ? <span className="text-green-500">محدد</span> : <span className="text-red-500">غير محدد</span>}</div>
                    {creds[key]?.redirectUri && (<div>Redirect URI: <span className="break-all">{creds[key]?.redirectUri}</span></div>)}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="button-primary flex-1" onClick={() => setEdit({ platform: key, clientId: creds[key]?.clientId || '', clientSecret: '', redirectUri: creds[key]?.redirectUri })}>تعيين/تعديل</Button>
                    {creds[key]?.clientId && (
                      <Button size="sm" variant="secondary" className="flex-1" onClick={async () => { await deletePlatformCredential(token, key); await loadCredentials(); }}>حذف</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Show message if no platforms are available */}
          {Object.entries(PLATFORMS).filter(([key, platform]) => hasPlatformAccess(key)).length === 0 && (
            <div className="text-center py-8">
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
            </div>
          )}

          {edit && (
            <div className="mt-4 p-4 bg-light-custom rounded-lg space-y-3">
              <div className="text-sm text-primary font-semibold">تعديل إعدادات {PLATFORMS[edit.platform as keyof typeof PLATFORMS].name}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="px-3 py-2 rounded bg-white text-black" placeholder="Client ID" value={edit.clientId} onChange={e => setEdit({ ...edit, clientId: e.target.value })} />
                <input className="px-3 py-2 rounded bg-white text-black" placeholder="Client Secret" value={edit.clientSecret} onChange={e => setEdit({ ...edit, clientSecret: e.target.value })} />
                <input className="px-3 py-2 rounded bg-white text-black" placeholder="Redirect URI (اختياري)" value={edit.redirectUri || ''} onChange={e => setEdit({ ...edit, redirectUri: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="button-primary" onClick={async () => { await upsertPlatformCredential(token, edit.platform, { clientId: edit.clientId, clientSecret: edit.clientSecret, redirectUri: edit.redirectUri }); setEdit(null); await loadCredentials(); }}>حفظ</Button>
                <Button size="sm" variant="secondary" onClick={() => setEdit(null)}>إلغاء</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Details Section */}
      {connectedPlatforms.length > 0 && (
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">
            <h2 className="text-lg font-semibold">تفاصيل المنصات المحددة</h2>
            <p className="text-sm text-gray-400">معلومات مفصلة عن المنصات المتصلة</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Facebook Page */}
              {isPlatformConnected('facebook') && (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-3xl">👥</div>
                    <div>
                      <h3 className="font-bold text-blue-900">صفحة Facebook</h3>
                      <p className="text-sm text-blue-700">الصفحة المحددة للنشر</p>
                    </div>
                  </div>
                  {loadingDetails.facebook ? (
                    <div className="text-sm text-blue-600">جاري تحميل التفاصيل...</div>
                  ) : platformDetails.facebook ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold text-blue-900">اسم الصفحة:</span>
                        <span className="text-blue-700 ml-2">{platformDetails.facebook.pageName || 'غير محدد'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-blue-900">عدد المعجبين:</span>
                        <span className="text-blue-700 ml-2">{platformDetails.facebook.fanCount ? platformDetails.facebook.fanCount.toLocaleString() : '0'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-blue-900">معرف الصفحة:</span>
                        <span className="text-blue-700 ml-2 font-mono text-xs">{platformDetails.facebook.pageId || 'غير محدد'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-blue-600">فشل في تحميل التفاصيل</div>
                  )}
                </div>
              )}

              {/* Instagram Account */}
              {isPlatformConnected('facebook') && platformDetails.facebook?.instagramId && (
                <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-3xl">📷</div>
                    <div>
                      <h3 className="font-bold text-pink-900">حساب Instagram</h3>
                      <p className="text-sm text-pink-700">مرتبط بصفحة Facebook</p>
                    </div>
                  </div>
                  {loadingDetails.instagram ? (
                    <div className="text-sm text-pink-600">جاري تحميل التفاصيل...</div>
                  ) : platformDetails.instagram ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold text-pink-900">اسم المستخدم:</span>
                        <span className="text-pink-700 ml-2">@{platformDetails.instagram.username || 'غير محدد'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-pink-900">المتابعون:</span>
                        <span className="text-pink-700 ml-2">{platformDetails.instagram.followersCount ? platformDetails.instagram.followersCount.toLocaleString() : '0'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-pink-900">المنشورات:</span>
                        <span className="text-pink-700 ml-2">{platformDetails.instagram.mediaCount ? platformDetails.instagram.mediaCount.toLocaleString() : '0'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-pink-600">فشل في تحميل التفاصيل</div>
                  )}
                </div>
              )}

              {/* LinkedIn Profile */}
              {isPlatformConnected('linkedin') && (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-3xl">💼</div>
                    <div>
                      <h3 className="font-bold text-blue-900">ملف LinkedIn</h3>
                      <p className="text-sm text-blue-700">الملف الشخصي المتصل</p>
                    </div>
                  </div>
                  {loadingDetails.linkedin ? (
                    <div className="text-sm text-blue-600">جاري تحميل التفاصيل...</div>
                  ) : platformDetails.linkedin ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold text-blue-900">الاسم:</span>
                        <span className="text-blue-700 ml-2">
                          {platformDetails.linkedin.profile?.firstName || platformDetails.linkedin.profile?.firstName?.localized?.en_US || 'غير محدد'} {' '}
                          {platformDetails.linkedin.profile?.lastName || platformDetails.linkedin.profile?.lastName?.localized?.en_US || 'غير محدد'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-blue-900">اسم الحساب:</span>
                        <span className="text-blue-700 ml-2">{platformDetails.linkedin.name || 'غير محدد'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-blue-600">فشل في تحميل التفاصيل</div>
                  )}
                </div>
              )}

              {/* Twitter Account */}
              {isPlatformConnected('twitter') && (
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-3xl">𝕏</div>
                    <div>
                      <h3 className="font-bold text-gray-900">حساب Twitter</h3>
                      <p className="text-sm text-gray-700">الحساب المتصل</p>
                    </div>
                  </div>
                  {loadingDetails.twitter ? (
                    <div className="text-sm text-gray-600">جاري تحميل التفاصيل...</div>
                  ) : platformDetails.twitter ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">اسم المستخدم:</span>
                        <span className="text-gray-700 ml-2">@{platformDetails.twitter.username || 'غير محدد'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">المتابعون:</span>
                        <span className="text-gray-700 ml-2">{platformDetails.twitter.metrics?.followers_count ? platformDetails.twitter.metrics.followers_count.toLocaleString() : '0'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">التغريدات:</span>
                        <span className="text-gray-700 ml-2">{platformDetails.twitter.metrics?.tweet_count ? platformDetails.twitter.metrics.tweet_count.toLocaleString() : '0'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">فشل في تحميل التفاصيل</div>
                  )}
                </div>
              )}

              {/* YouTube Channel */}
              {isPlatformConnected('youtube') && (
                <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-3xl">▶️</div>
                    <div>
                      <h3 className="font-bold text-red-900">قناة YouTube</h3>
                      <p className="text-sm text-red-700">القناة المتصلة</p>
                    </div>
                  </div>
                  {loadingDetails.youtube ? (
                    <div className="text-sm text-red-600">جاري تحميل التفاصيل...</div>
                  ) : platformDetails.youtube ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold text-red-900">اسم القناة:</span>
                        <span className="text-red-700 ml-2">{platformDetails.youtube.title || 'غير محدد'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-red-900">المشتركون:</span>
                        <span className="text-red-700 ml-2">{platformDetails.youtube.statistics?.subscriberCount ? platformDetails.youtube.statistics.subscriberCount.toLocaleString() : '0'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-red-900">الفيديوهات:</span>
                        <span className="text-red-700 ml-2">{platformDetails.youtube.statistics?.videoCount ? platformDetails.youtube.statistics.videoCount.toLocaleString() : '0'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">فشل في تحميل التفاصيل</div>
                  )}
                </div>
              )}

              {/* Pinterest Account */}
              {isPlatformConnected('pinterest') && (
                <div className="p-6 bg-gradient-to-br from-red-50 to-pink-100 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-3xl">📌</div>
                    <div>
                      <h3 className="font-bold text-red-900">حساب Pinterest</h3>
                      <p className="text-sm text-red-700">الحساب المتصل</p>
                    </div>
                  </div>
                  {loadingDetails.pinterest ? (
                    <div className="text-sm text-red-600">جاري تحميل التفاصيل...</div>
                  ) : platformDetails.pinterest ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold text-red-900">اسم المستخدم:</span>
                        <span className="text-red-700 ml-2">@{platformDetails.pinterest.username || 'غير محدد'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-red-900">اسم الحساب:</span>
                        <span className="text-red-700 ml-2">{platformDetails.pinterest.user?.username || 'غير محدد'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">فشل في تحميل التفاصيل</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Facebook Page Selection Modal */}
      <FacebookPageSelection
        isOpen={showFacebookSelection}
        onClose={() => setShowFacebookSelection(false)}
        onComplete={() => {
          setShowFacebookSelection(false);
          loadPlatformConnections();
        }}
      />

      {/* YouTube Channel Selection Modal */}
      <YouTubeChannelSelection
        isOpen={showYouTubeSelection}
        onClose={() => setShowYouTubeSelection(false)}
        onComplete={() => {
          setShowYouTubeSelection(false);
          loadPlatformConnections();
        }}
      />

      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h2 className="text-lg font-semibold">ملخص الاتصالات</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/10 rounded-lg border border-green-500/30">
              <div className="text-2xl font-bold text-green-400">{connectedPlatforms.length}</div>
              <div className="text-sm text-white">منصات متصلة</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-lg border border-green-600/30">
              <div className="text-2xl font-bold text-green-600">{Object.keys(PLATFORMS).length - connectedPlatforms.length}</div>
              <div className="text-sm text-gray-300">منصات غير متصلة</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-lg border border-green-200/30">
              <div className="text-2xl font-bold text-green-100">{Math.round((connectedPlatforms.length / Object.keys(PLATFORMS).length) * 100)}%</div>
              <div className="text-sm text-white">نسبة الاتصال</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-lg border border-green-100/30">
              <div className="text-2xl font-bold text-green-50">{Object.keys(PLATFORMS).length}</div>
              <div className="text-sm text-white">إجمالي المنصات</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facebook Page Manager Modal */}
      {showFacebookPageManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle>اختيار صفحة Facebook</CardTitle>
              <p className="text-sm text-muted-foreground">
                اختر صفحة Facebook للنشر عليها
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableFacebookPages.map((page) => (
                  <div
                    key={page.id}
                    className={`flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      currentFacebookPage?.pageId === page.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleSwitchFacebookPage(page.id, page.name)}
                  >
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-sm text-gray-500">
                        {page.fan_count ? `${page.fan_count} معجب` : '0 معجب'}
                      </p>
                    </div>
                    {currentFacebookPage?.pageId === page.id && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowFacebookPageManager(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">الإعدادات</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}