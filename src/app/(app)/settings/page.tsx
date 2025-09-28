"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { checkPlatformConnections } from "@/lib/api";

const PLATFORMS = {
  facebook: { name: "Facebook", icon: "👥", connectUrl: "/auth/facebook" },
  instagram: { name: "Instagram", icon: "📷", connectUrl: "/auth/instagram" },
  youtube: { name: "YouTube", icon: "▶️", connectUrl: "/auth/youtube" },
  tiktok: { name: "TikTok", icon: "🎵", connectUrl: "/auth/tiktok" },
  linkedin: { name: "LinkedIn", icon: "💼", connectUrl: "/auth/linkedin" },
  pinterest: { name: "Pinterest", icon: "📌", connectUrl: "/auth/pinterest" }
};

export default function SettingsPage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    checkPlatformConnections(token)
      .then((res) => {
        if (res.success) {
          const connected = Object.entries(res.connections)
            .filter(([_, isConnected]) => isConnected)
            .map(([platform, _]) => platform);
          setConnectedPlatforms(connected);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const isPlatformConnected = (platformKey: string) => {
    return connectedPlatforms.includes(platformKey);
  };

  const handleConnect = (platformKey: string) => {
    const platform = PLATFORMS[platformKey as keyof typeof PLATFORMS];
    if (platform) {
      window.location.href = platform.connectUrl;
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
                          <Button variant="secondary" size="sm" className="w-full">
                            قطع الاتصال
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
                          >
                            ربط الحساب
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