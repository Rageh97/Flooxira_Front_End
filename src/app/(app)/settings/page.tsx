"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "@/lib/api";
import { exchangeTwitterCode } from "@/lib/api";
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
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string>("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [showFacebookSelection, setShowFacebookSelection] = useState<boolean>(false);
  const [showYouTubeSelection, setShowYouTubeSelection] = useState<boolean>(false);
  const [creds, setCreds] = useState<Record<string, { clientId: string; redirectUri?: string }>>({});
  const [edit, setEdit] = useState<{ platform: string; clientId: string; clientSecret: string; redirectUri?: string } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
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

  const isPlatformConnected = (platformKey: string) => {
    return connectedPlatforms.includes(platformKey);
  };

  const handleConnect = (platformKey: string) => {
    const platform = PLATFORMS[platformKey as keyof typeof PLATFORMS];
    if (platform) {
      window.location.href = platform.connectUrl;
    }
  };

  const handleDisconnect = async (platformKey: string) => {
    if (!token) return;
    
    setProcessing(platformKey);
    try {
      // Add disconnect API calls here when needed
      console.log(`Disconnecting ${platformKey}...`);
      // For now, just refresh the connections
      await loadPlatformConnections();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">الإعدادات</h1>
        <p className="text-sm text-gray-300">إدارة اتصالات المنصات الاجتماعية</p>
      </div>
      
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h2 className="text-lg font-semibold">اتصالات المنصات</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PLATFORMS).map(([key, platform]) => {
              const isConnected = isPlatformConnected(key);
              
              return (
                <Card key={key} className={`border-none ${
                  isConnected ? ' bg-green-50' : ' bg-semidark-custom'
                }`}>
                  <CardContent className="p-6 ">
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
                              isConnected ? 'text-green-700' : 'text-red-700'
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
      {(isPlatformConnected('facebook') || isPlatformConnected('pinterest') || isPlatformConnected('youtube') || isPlatformConnected('linkedin')) && (
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">
            <h2 className="text-lg font-semibold">تفاصيل المنصات المحددة</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Facebook Page and Instagram */}
              {isPlatformConnected('facebook') && (
                <>
                  <div className="p-4 bg-light-custom rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-2xl">👥</div>
                      <div>
                        <h3 className="font-semibold text-primary">صفحة Facebook</h3>
                        <p className="text-sm text-gray-300">اختر الصفحة للنشر</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>متصل - اختر الصفحة</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-light-custom rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-2xl">📷</div>
                      <div>
                        <h3 className="font-semibold text-primary">حساب Instagram</h3>
                        <p className="text-sm text-gray-300">اختر الحساب للنشر</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>متصل - اختر الحساب</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Pinterest Board */}
              {isPlatformConnected('pinterest') && (
                <div className="p-4 bg-light-custom rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-2xl">📌</div>
                    <div>
                      <h3 className="font-semibold text-primary">لوحة Pinterest</h3>
                      <p className="text-sm text-gray-300">اللوحة المحددة للنشر</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>متصل ومحدد تلقائياً</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* YouTube Channel */}
              {isPlatformConnected('youtube') && (
                <div className="p-4 bg-light-custom rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-2xl">▶️</div>
                    <div>
                      <h3 className="font-semibold text-primary">قناة YouTube</h3>
                      <p className="text-sm text-gray-300">اختر القناة للنشر</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>متصل - اختر القناة</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* LinkedIn Company */}
              {isPlatformConnected('linkedin') && (
                <div className="p-4 bg-light-custom rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-2xl">💼</div>
                    <div>
                      <h3 className="font-semibold text-primary">شركة LinkedIn</h3>
                      <p className="text-sm text-gray-300">الشركة المحددة للنشر</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>متصل ومحدد تلقائياً</span>
                    </div>
                  </div>
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
            <div className="text-center p-4 bg-light-custom rounded-lg">
              <div className="text-2xl font-bold text-green-600">{connectedPlatforms.length}</div>
              <div className="text-sm text-white  ">منصات متصلة</div>
            </div>
            <div className="text-center p-4 bg-light-custom rounded-lg">
              <div className="text-2xl font-bold text-red-500">{Object.keys(PLATFORMS).length - connectedPlatforms.length}</div>
              <div className="text-sm text-gray-300">منصات غير متصلة</div>
            </div>
            <div className="text-center p-4 bg-light-custom rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{Math.round((connectedPlatforms.length / Object.keys(PLATFORMS).length) * 100)}%</div>
              <div className="text-sm text-white">نسبة الاتصال</div>
            </div>
            <div className="text-center p-4 bg-light-custom rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(PLATFORMS).length}</div>
              <div className="text-sm text-white">إجمالي المنصات</div>
            </div>
          </div>
        </CardContent>
      </Card>
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