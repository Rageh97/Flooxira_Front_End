"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { startSallaOAuth, exchangeSallaCode, getSallaAccount, disconnectSalla, testSalla, startLinkedInOAuth, exchangeLinkedInCode, getLinkedInAccount, disconnectLinkedIn, testLinkedIn, inviteFacebookTester, exchangePinterestCode, getPinterestAccount } from "@/lib/api";

interface FacebookAccount {
  connected: boolean;
  name?: string;
  email?: string;
  pageId?: string;
  groupId?: string;
  destination?: string;
  instagramAccount?: {
    id: string;
    username: string;
  };
}

interface FacebookPage {
  id: string;
  name: string;
  accessToken: string; // deprecated when using Make
  hasInstagram: boolean;
  instagramAccount?: {
    id: string;
    username: string;
  };
}

interface InstagramAccount {
  pageId: string;
  pageName: string;
  instagramId: string;
  username: string;
  mediaCount: number;
  pageAccessToken?: string;
}

interface FacebookGroup {
  id: string;
  name: string;
  memberCount: number;
}

interface TikTokAccount {
  id: number;
  tiktokUserId: string;
  username: string;
  displayName: string;
  profilePicture: string;
  followerCount: number;
  followingCount: number;
  videoCount: number;
  isActive: boolean;
  lastSyncAt: string;
}

interface YouTubeAccount {
  id: number;
  email: string;
  channelId: string;
  channelTitle: string;
  isActive: boolean;
  lastSyncAt: string;
}

interface WabaStatus {
  phoneNumberId: string;
  phoneNumber?: string;
  wabaId?: string;
  isActive: boolean;
  lastSyncAt?: string;
}

interface LinkedInAccount {
  id: number;
  linkedinUserId: string;
  name: string;
  email?: string;
  profilePicture?: string;
  scope?: string;
  lastSyncAt?: string;
}

interface KnowledgeEntry {
  id: number;
  keyword: string;
  answer: string;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [facebookAccount, setFacebookAccount] = useState<FacebookAccount | null>(null);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [facebookGroups, setFacebookGroups] = useState<FacebookGroup[]>([]);
  const [tiktokAccount, setTiktokAccount] = useState<TikTokAccount | null>(null);
  const [youtubeAccount, setYoutubeAccount] = useState<YouTubeAccount | null>(null);
  const [sallaAccount, setSallaAccount] = useState<any | null>(null);
  const [linkedinAccount, setLinkedinAccount] = useState<LinkedInAccount | null>(null);
  const [wabaStatus, setWabaStatus] = useState<WabaStatus | null>(null);
  const [kbEntries, setKbEntries] = useState<KnowledgeEntry[]>([]);
  const [wabaPhoneNumberId, setWabaPhoneNumberId] = useState("");
  const [wabaAccessToken, setWabaAccessToken] = useState("");
  const [wabaVerifyToken, setWabaVerifyToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fbUserId, setFbUserId] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadFacebookAccount();
    loadTikTokAccount();
    loadYouTubeAccount();
    loadWabaStatus();
    loadKnowledgeBase();
    loadSallaAccount();
    loadLinkedInAccount();
    
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const fbCode = urlParams.get('fb_code');
    const tiktokCode = urlParams.get('tiktok_code');
    const platform = urlParams.get('platform');
    const youtubeCode = urlParams.get('youtube_code');
    const waCode = urlParams.get('wa_code');
    const sallaCode = urlParams.get('salla_code');
    const linkedinCode = urlParams.get('linkedin_code');
    const pinterestCode = urlParams.get('pinterest_code');
    const error = urlParams.get('error');
    const messageParam = urlParams.get('message');
    
    if (fbCode) {
      handleFacebookOAuthCallback(fbCode);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (tiktokCode && platform === 'tiktok') {
      handleTikTokOAuthCallback(tiktokCode);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (youtubeCode) {
      handleYouTubeOAuthCallback(youtubeCode);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (waCode && platform === 'whatsapp') {
      handleWhatsAppOAuthCallback(waCode);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (error === 'salla_oauth_failed') {
      setMessage(`Salla OAuth failed${messageParam ? `: ${messageParam}` : ''}`);
      // clean up
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (sallaCode && platform === 'salla') {
      handleSallaOAuthCallback(sallaCode);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error === 'linkedin_oauth_failed') {
      setMessage(`LinkedIn OAuth failed${messageParam ? `: ${messageParam}` : ''}`);
      // clean up
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (linkedinCode && platform === 'linkedin') {
      handleLinkedInOAuthCallback(linkedinCode);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (pinterestCode && platform === 'pinterest') {
      handlePinterestOAuthCallback(pinterestCode);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleFacebookOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setMessage("Completing Facebook connection...");
      
      // Get the auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      // Call the exchange endpoint to complete the OAuth flow
      const response = await apiFetch<{ success: boolean; message: string; account?: any }>("/api/facebook/exchange", {
        method: "POST",
        authToken: authToken,
        body: JSON.stringify({ code })
      });
      
      if (response.success) {
        setMessage("Facebook account connected successfully!");
        await loadFacebookAccount(); // Refresh account info
      } else {
        setMessage("Failed to complete Facebook connection");
      }
    } catch (error) {
      console.error("Failed to complete Facebook OAuth:", error);
      setMessage("Failed to complete Facebook connection");
    } finally {
      setLoading(false);
    }
  };

  const handleTikTokOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setMessage("Completing TikTok connection...");
      
      // Get the auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      // Call the exchange endpoint to complete the OAuth flow
      const response = await apiFetch<{ success: boolean; message: string; account?: any }>("/api/tiktok/exchange", {
        method: "POST",
        authToken: authToken,
        body: JSON.stringify({ code })
      });
      
      if (response.success) {
        setMessage("TikTok account connected successfully!");
        await loadTikTokAccount(); // Refresh account info
      } else {
        setMessage("Failed to complete TikTok connection");
      }
    } catch (error) {
      console.error("Failed to complete TikTok OAuth:", error);
      setMessage("Failed to complete TikTok connection");
    } finally {
      setLoading(false);
    }
  };

  const handleYouTubeOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setMessage("Completing YouTube connection...");
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      const response = await apiFetch<{ success: boolean; account?: any; message?: string }>("/api/youtube/exchange", {
        method: "POST",
        authToken,
        body: JSON.stringify({ code })
      });
      if (response.success) {
        setMessage("YouTube account connected successfully!");
        await loadYouTubeAccount();
      } else {
        setMessage(response.message || "Failed to complete YouTube connection");
      }
    } catch (error) {
      console.error("Failed to complete YouTube OAuth:", error);
      setMessage("Failed to complete YouTube connection");
    } finally {
      setLoading(false);
    }
  };

  const loadFacebookAccount = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.error('No auth token found');
        return;
      }
      
      const account = await apiFetch<FacebookAccount>("/api/facebook/account", {
        authToken: authToken
      });
      setFacebookAccount(account);
    } catch (error) {
      console.error("Failed to load Facebook account:", error);
    }
  };

  const loadTikTokAccount = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.error('No auth token found');
        return;
      }
      
      const account = await apiFetch<TikTokAccount>("/api/tiktok/account", {
        authToken: authToken
      });
      setTiktokAccount(account);
    } catch (error) {
      console.error("Failed to load TikTok account:", error);
      // Don't show error if no TikTok account is connected
      if (error instanceof Error && error.message !== 'No TikTok account connected') {
        console.error("Failed to load TikTok account:", error);
      }
    }
  };

  const loadSallaAccount = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      const res = await getSallaAccount(authToken);
      setSallaAccount(res.connected ? res.account : null);
    } catch {}
  };

  const loadLinkedInAccount = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      const res = await getLinkedInAccount(authToken);
      setLinkedinAccount(res.connected ? res.account : null);
    } catch {}
  };

  const loadWabaStatus = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      const status = await apiFetch<WabaStatus>("/api/whatsapp/status", { authToken });
      setWabaStatus(status);
    } catch (e) {
      // not configured yet
    }
  };

  const configureWaba = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      await apiFetch("/api/whatsapp/configure", {
        method: "POST",
        authToken,
        body: JSON.stringify({ phoneNumberId: wabaPhoneNumberId, accessToken: wabaAccessToken, verifyToken: wabaVerifyToken || undefined })
      });
      setMessage("WhatsApp Business configured successfully.");
      await loadWabaStatus();
    } catch (e) {
      setMessage("Failed to configure WhatsApp Business");
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      const res = await apiFetch<{ entries: KnowledgeEntry[] }>("/api/whatsapp/knowledge", { authToken });
      setKbEntries(res.entries || []);
    } catch (e) {
      // ignore if not configured
    }
  };

  const uploadKnowledge = async (file: File) => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      setMessage("No authentication token found. Please sign in again.");
      return;
    }
    const form = new FormData();
    form.append('file', file);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/whatsapp/knowledge/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Upload failed');
      setMessage(`Knowledge base uploaded (${data.count})`);
      await loadKnowledgeBase();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteKnowledge = async (id: number) => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) return;
    setLoading(true);
    try {
      await apiFetch(`/api/whatsapp/knowledge/${id}`, { method: 'DELETE', authToken });
      await loadKnowledgeBase();
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const loadYouTubeAccount = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.error('No auth token found');
        return;
      }
      const account = await apiFetch<YouTubeAccount>("/api/youtube/account", { authToken });
      setYoutubeAccount(account);
    } catch (error) {
      // likely not connected; ignore unless other error
      if (error instanceof Error && !error.message.includes('No YouTube account')) {
        console.error("Failed to load YouTube account:", error);
      }
    }
  };

  const loadFacebookPages = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      const response = await apiFetch<{ pages: FacebookPage[]; message?: string; solution?: string }>("/api/facebook/pages", {
        authToken: authToken
      });
      
      console.log('Facebook pages response:', response);
      console.log('Facebook pages data:', response.pages);
      
      setFacebookPages(response.pages);
      
      if (response.pages.length === 0 && response.message) {
        setMessage(`${response.message} ${response.solution || ''}`);
      } else {
        setMessage(`Loaded ${response.pages.length} Facebook pages`);
      }
    } catch (error) {
      console.error("Failed to load Facebook pages:", error);
      setMessage("Failed to load Facebook pages");
    } finally {
      setLoading(false);
    }
  };

  const loadInstagramAccounts = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      const response = await apiFetch<{ instagramAccounts: InstagramAccount[] }>("/api/facebook/instagram-accounts", {
        authToken: authToken
      });
      
      console.log('Instagram accounts response:', response);
      console.log('Instagram accounts data:', response.instagramAccounts);
      
      setInstagramAccounts(response.instagramAccounts);
      setMessage(`Loaded ${response.instagramAccounts.length} Instagram accounts`);
    } catch (error) {
      console.error("Failed to load Instagram accounts:", error);
      setMessage("Failed to load Instagram accounts");
    } finally {
      setLoading(false);
    }
  };

  const loadFacebookGroups = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      const response = await apiFetch<{ groups: FacebookGroup[] }>("/api/facebook/groups", {
        authToken: authToken
      });
      setFacebookGroups(response.groups);
      setMessage(`Loaded ${response.groups.length} Facebook groups`);
    } catch (error) {
      console.error("Failed to load Facebook groups:", error);
      setMessage("Failed to load Facebook groups");
    } finally {
      setLoading(false);
    }
  };

  const selectFacebookPage = async (page: FacebookPage) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      await apiFetch("/api/facebook/select-page", {
        method: "POST",
        authToken: authToken,
        body: JSON.stringify({
          pageId: page.id,
          pageName: page.name
        })
      });
      
      setMessage(`Selected Facebook page: ${page.name}`);
      await loadFacebookAccount(); // Refresh account info
    } catch (error) {
      console.error("Failed to select Facebook page:", error);
      setMessage("Failed to select Facebook page");
    } finally {
      setLoading(false);
    }
  };

  const selectInstagramAccount = async (instagramAccount: InstagramAccount, pageAccessToken: string) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      await apiFetch("/api/facebook/select-instagram", {
        method: "POST",
        authToken: authToken,
        body: JSON.stringify({
          pageId: instagramAccount.pageId,
          instagramId: instagramAccount.instagramId,
          accessToken: pageAccessToken
        })
      });
      
      setMessage(`Selected Instagram account: @${instagramAccount.username}`);
      await loadFacebookAccount(); // Refresh account info
    } catch (error) {
      console.error("Failed to select Instagram account:", error);
      setMessage("Failed to select Instagram account");
    } finally {
      setLoading(false);
    }
  };

  const selectFacebookGroup = async (group: FacebookGroup) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      await apiFetch("/api/facebook/select-group", {
        method: "POST",
        authToken: authToken,
        body: JSON.stringify({
          groupId: group.id
        })
      });
      
      setMessage(`Selected Facebook group: ${group.name}`);
      await loadFacebookAccount(); // Refresh account info
    } catch (error) {
      console.error("Failed to select Facebook group:", error);
      setMessage("Failed to select Facebook group");
    } finally {
      setLoading(false);
    }
  };

  const disconnectTikTok = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      await apiFetch("/api/tiktok/disconnect", {
        method: "POST",
        authToken: authToken
      });
      
      setMessage("TikTok account disconnected successfully!");
      setTiktokAccount(null);
    } catch (error) {
      console.error("Failed to disconnect TikTok account:", error);
      setMessage("Failed to disconnect TikTok account");
    } finally {
      setLoading(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      await apiFetch("/api/youtube/disconnect", { method: "POST", authToken });
      setMessage("YouTube account disconnected successfully!");
      setYoutubeAccount(null);
    } catch (error) {
      console.error("Failed to disconnect YouTube account:", error);
      setMessage("Failed to disconnect YouTube account");
    } finally {
      setLoading(false);
    }
  };

  const connectFacebook = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/facebook`;
  };

  const connectYouTube = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/youtube`;
  };
  
  const connectWhatsApp = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/whatsapp`;
  };

  const connectTikTok = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/tiktok`;
  };

  const connectSalla = () => {
    startSallaOAuth();
  };

  const connectLinkedIn = () => {
    startLinkedInOAuth();
  };

  const disconnectFacebook = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      
      console.log('Attempting to disconnect Facebook account...');
      
      const response = await apiFetch("/api/facebook/disconnect", {
        method: "POST",
        authToken: authToken
      });
      
      console.log('Disconnect response:', response);
      
      setMessage("Facebook account disconnected successfully. You can now reconnect with new permissions.");
      setFacebookAccount(null);
      setFacebookPages([]);
      setInstagramAccounts([]);
      setFacebookGroups([]);
    } catch (error) {
      console.error("Failed to disconnect Facebook:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`Failed to disconnect Facebook account: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setMessage("Completing WhatsApp connection...");
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setMessage("No authentication token found. Please sign in again.");
        return;
      }
      const response = await apiFetch<{ success: boolean; phoneNumberId?: string; wabaId?: string; accessToken?: string; requiresManualSetup?: boolean; message?: string }>("/api/whatsapp/exchange", {
        method: "POST",
        authToken,
        body: JSON.stringify({ code })
      });
      if (response.success) {
        if (response.requiresManualSetup) {
          setMessage("OAuth successful! Please enter your Phone Number ID and WABA ID below.");
          // Pre-fill with your credentials
          setWabaPhoneNumberId("752774164592361");
          setWabaAccessToken(response.accessToken || "");
          setWabaVerifyToken("24495347883484220");
        } else {
          setMessage("WhatsApp connected successfully!");
          await loadWabaStatus();
        }
      } else {
        setMessage(response.message || "Failed to complete WhatsApp connection");
      }
    } catch (error) {
      console.error("Failed to complete WhatsApp OAuth:", error);
      setMessage("Failed to complete WhatsApp connection");
    } finally {
      setLoading(false);
    }
  };

  const handleSallaOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setMessage("Completing Salla connection...");
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      const res = await exchangeSallaCode(authToken, code);
      setMessage(res.message || 'Salla connected');
      await loadSallaAccount();
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : 'Failed to complete Salla connection';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setMessage("Completing LinkedIn connection...");
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      const res = await exchangeLinkedInCode(authToken, code);
      setMessage(res.message || 'LinkedIn connected');
      await loadLinkedInAccount();
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : 'Failed to complete LinkedIn connection';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePinterestOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setMessage("Completing Pinterest connection...");
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      const res = await exchangePinterestCode(authToken, code);
      setMessage(res.message || 'Pinterest connected');
      // Optionally reload account info
      try { await getPinterestAccount(authToken); } catch {}
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : 'Failed to complete Pinterest connection';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      {/* User Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">User Information</h2>
        </CardHeader>
        <CardContent>
          <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        </CardContent>
      </Card>

      {/* YouTube Integration - Always visible */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">YouTube</h2>
          <p className="text-sm text-muted-foreground">Connect your YouTube account to upload and schedule videos.</p>
        </CardHeader>
        <CardContent>
          {!youtubeAccount ? (
            <div className="space-y-3">
              <Button onClick={connectYouTube} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                ▶️ Connect YouTube
              </Button>
            </div>
          ) : (
            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-green-800">{youtubeAccount.channelTitle || youtubeAccount.email}</p>
                  <p className="text-sm text-green-700">Channel ID: {youtubeAccount.channelId}</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={disconnectYouTube} 
                  disabled={loading}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facebook Integration */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Facebook Integration</h2>
          <p className="text-sm text-muted-foreground">Connect your Facebook to manage Pages, Groups, and Instagram.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!facebookAccount?.connected ? (
            <div>
              <p className="text-gray-600 mb-4">Connect your Facebook account to post to Pages and Groups.</p>
              <Button onClick={connectFacebook} disabled={loading}>
                Connect Facebook Account
              </Button>
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <p className="font-medium mb-2">هل ترى رسالة أن التطبيق غير متاح أو في وضع التطوير؟</p>
                <p className="text-sm text-gray-600">سجّل حسابك كمطور أولاً، ثم سنضيفك كتستر تلقائياً.</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => window.open("https://developers.facebook.com/settings/developer/", "_blank")}
                  >
                    سجل كمطور الآن
                  </Button>
                </div>
                <ol className="list-decimal list-inside text-sm text-gray-600 mt-3 space-y-1">
                  <li>اضغط على Get Started ووافق على الشروط.</li>
                  <li>أكمل التحقق (SMS/Email) إن طُلب.</li>
                  <li>ارجع واضغط أدناه لإضافتك كتستر ثم أعد محاولة تسجيل الدخول.</li>
                </ol>
                <div className="mt-4 grid gap-2 md:grid-cols-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Facebook User ID (رقم المستخدم)</label>
                    <Input
                      value={fbUserId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFbUserId(e.target.value)}
                      placeholder="123456789012345"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!fbUserId) { setMessage("يرجى إدخال Facebook User ID الرقمي"); return; }
                      setInviting(true);
                      try {
                        const res = await inviteFacebookTester(fbUserId);
                        if (res.status === 'pending') {
                          setMessage('تمت إضافتك كتستر.. أعد المحاولة بعد قليل');
                        } else if (res.status === 'invite') {
                          setMessage('تمت دعوتك كتستر. افتح رابط الدعوات ثم أعد المحاولة');
                          if (res.acceptUrl) window.open(res.acceptUrl, '_blank');
                        } else if (res.status === 'error') {
                          setMessage(res.message || 'فشل إرسال الدعوة');
                        } else {
                          setMessage('تم تجهيز حسابك. حاول تسجيل الدخول الآن');
                        }
                      } catch (e: any) {
                        setMessage(e?.message || 'فشل إرسال الدعوة');
                      } finally {
                        setInviting(false);
                      }
                    }}
                    disabled={inviting}
                  >
                    أضفني كتستر
                  </Button>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open('https://developers.facebook.com/settings/developer/requests/', '_blank')}
                  >
                    افتح صفحة الدعوات لقبول الطلب
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-800">
                      <strong>Connected:</strong> {facebookAccount.name || facebookAccount.email}
                    </p>
                    {facebookAccount.pageId && (
                      <p className="text-green-700 mt-1">
                        <strong>Page:</strong> {facebookAccount.pageId}
                      </p>
                    )}
                    {facebookAccount.groupId && (
                      <p className="text-green-700 mt-1">
                        <strong>Group:</strong> {facebookAccount.groupId}
                      </p>
                    )}
                    {facebookAccount.instagramAccount && (
                      <p className="text-green-700 mt-1">
                        <strong>Instagram:</strong> @{facebookAccount.instagramAccount.username}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={disconnectFacebook} 
                    disabled={loading}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h3 className="font-medium mb-2">Facebook Pages</h3>
                  <Button onClick={loadFacebookPages} disabled={loading} className="mb-3">
                    Load Pages
                  </Button>
                  {facebookPages.length > 0 ? (
                    <div className="space-y-2">
                      {facebookPages.map((page) => (
                        <div key={page.id} className="p-3 border rounded-lg">
                          <p className="font-medium">{page.name}</p>
                          <p className="text-sm text-gray-600">ID: {page.id}</p>
                          {page.hasInstagram && (
                            <p className="text-sm text-blue-600">📸 Has Instagram</p>
                          )}
                          <Button
                            size="sm"
                            onClick={() => selectFacebookPage(page)}
                            disabled={loading}
                            className="mt-2"
                          >
                            Select Page
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <p className="text-gray-600 mb-2">No Facebook Pages found</p>
                      <p className="text-sm text-gray-500 mb-3">
                        You need to create a Facebook Page first before connecting Instagram
                      </p>
                      <div className="space-y-2">
                        <a 
                          href="https://facebook.com/pages/create" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Facebook Page
                        </a>
                        <p className="text-xs text-gray-400">
                          After creating a page, connect Instagram to it, then reload here
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Instagram Accounts</h3>
                  <Button onClick={loadInstagramAccounts} disabled={loading} className="mb-3">
                    Load Instagram
                  </Button>
                  {instagramAccounts.length > 0 ? (
                    <div className="space-y-2">
                      {instagramAccounts.map((account) => (
                        <div key={account.instagramId} className="p-3 border rounded-lg">
                          <p className="font-medium">@{account.username}</p>
                          <p className="text-sm text-gray-600">
                            {account.mediaCount} posts • {account.pageName}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => {
                              // Use the pageAccessToken from the Instagram account if available
                              if (account.pageAccessToken) {
                                selectInstagramAccount(account, account.pageAccessToken);
                              } else {
                                // Fallback: try to find the page that this Instagram account belongs to
                                const page = facebookPages.find(p => p.id === account.pageId);
                                if (page && page.accessToken) {
                                  selectInstagramAccount(account, page.accessToken);
                                } else {
                                  console.error('No access token found for Instagram account:', {
                                    accountPageId: account.pageId,
                                    hasPageAccessToken: !!account.pageAccessToken,
                                    availablePages: facebookPages.map(p => ({ id: p.id, name: p.name })),
                                    hasPageAccessTokenFromPage: page?.accessToken ? 'yes' : 'no'
                                  });
                                  setMessage(`No access token found for Instagram account. Please reload Instagram accounts first.`);
                                }
                              }
                            }}
                            disabled={loading}
                            className="mt-2"
                          >
                            Select Instagram
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <p className="text-gray-600 mb-2">No Instagram accounts found</p>
                      <p className="text-sm text-gray-500">
                        Instagram accounts will appear here after you create a Facebook Page and connect Instagram to it
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Facebook Groups</h3>
                  <Button onClick={loadFacebookGroups} disabled={loading} className="mb-3">
                    Load Groups
                  </Button>
                  {facebookGroups.length > 0 && (
                    <div className="space-y-2">
                      {facebookGroups.map((group) => (
                        <div key={group.id} className="p-3 border rounded-lg">
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-gray-600">
                            {group.memberCount} members
                          </p>
                          <Button
                            size="sm"
                            onClick={() => selectFacebookGroup(group)}
                            disabled={loading}
                            className="mt-2"
                          >
                            Select Group
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                

                {/* YouTube block moved out to always show */}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Business Integration */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">WhatsApp Business</h2>
          <p className="text-sm text-muted-foreground">Connect Meta WhatsApp Business and manage webhook access.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {wabaStatus ? (
                <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <p className="text-green-800"><strong>Configured</strong> • Phone Number ID: {wabaStatus.phoneNumberId}</p>
                  {wabaStatus.phoneNumber && <p className="text-green-700">{wabaStatus.phoneNumber}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Not connected</p>
              )}
            </div>
            <Button onClick={connectWhatsApp} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">Connect Meta</Button>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Phone Number ID</label>
              <Input value={wabaPhoneNumberId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWabaPhoneNumberId(e.target.value)} placeholder="123456789012345" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium">Permanent Access Token</label>
              <Input value={wabaAccessToken} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWabaAccessToken(e.target.value)} placeholder="EAAD..." />
            </div>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Webhook Verify Token (optional)</label>
              <Input value={wabaVerifyToken} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWabaVerifyToken(e.target.value)} placeholder="my-verify-token" />
            </div>
            <div className="flex items-end">
              <Button onClick={configureWaba} disabled={loading || !wabaPhoneNumberId || !wabaAccessToken}>Save</Button>
            </div>
          </div>

          {wabaStatus ? (
            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
              <p className="text-green-800"><strong>Configured</strong> • Phone Number ID: {wabaStatus.phoneNumberId}</p>
              {wabaStatus.phoneNumber && <p className="text-green-700">{wabaStatus.phoneNumber}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Not configured yet.</p>
          )}

          <div className="space-y-3">
            <h3 className="font-medium">Knowledge Base (.xlsx)</h3>
            <Input type="file" accept=".xlsx" onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) uploadKnowledge(f); }} />
            {kbEntries.length > 0 ? (
              <div className="space-y-2">
                {kbEntries.slice(0, 20).map(entry => (
                  <div key={entry.id} className="p-2 border rounded flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{entry.keyword}</p>
                      <p className="text-xs text-gray-600 truncate max-w-[48ch]">{entry.answer}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteKnowledge(entry.id)}>Delete</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No entries yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TikTok Integration */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">TikTok</h2>
          <p className="text-sm text-muted-foreground">Connect TikTok to post and manage your content.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!tiktokAccount ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Not connected</p>
              <Button onClick={connectTikTok} disabled={loading} className="bg-black hover:bg-gray-800 text-white">
                🎵 Connect TikTok
              </Button>
            </div>
          ) : (
            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-green-800">@{tiktokAccount.username}</p>
                  <p className="text-sm text-green-700">{tiktokAccount.displayName}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {tiktokAccount.followerCount} followers • {tiktokAccount.videoCount} videos
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={disconnectTikTok} 
                  disabled={loading}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salla Integration */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Salla Store</h2>
          <p className="text-sm text-muted-foreground">Integrate your Salla store to sync data and actions.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sallaAccount ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Not connected</p>
              <Button onClick={connectSalla} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                🛍️ Connect Salla
              </Button>
            </div>
          ) : (
            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-green-800">{sallaAccount.storeName || 'Salla Store'}</p>
                  {sallaAccount.sallaStoreId && (
                    <p className="text-sm text-green-700">Store ID: {sallaAccount.sallaStoreId}</p>
                  )}
                  {sallaAccount.scope && (
                    <p className="text-xs text-green-700 mt-1 break-all">Scopes: {sallaAccount.scope}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={async () => { const authToken = localStorage.getItem('auth_token'); if (!authToken) return; await disconnectSalla(authToken); setSallaAccount(null); setMessage('Disconnected Salla'); }} 
                    disabled={loading}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={async () => { const authToken = localStorage.getItem('auth_token'); if (!authToken) return; const res = await testSalla(authToken); setMessage(res.message + (res.storeName ? `: ${res.storeName}` : '')); }} 
                    disabled={loading}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {sallaAccount && (
        <div className="flex justify-end">
          <a href="/salla" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Go to Salla Dashboard</a>
        </div>
      )}

      {/* LinkedIn Integration */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">LinkedIn</h2>
          <p className="text-sm text-muted-foreground">Connect LinkedIn to enable analytics and posting.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!linkedinAccount ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Not connected</p>
              <Button onClick={connectLinkedIn} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                💼 Connect LinkedIn
              </Button>
            </div>
          ) : (
            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-green-800">{linkedinAccount.name || 'LinkedIn User'}</p>
                  {linkedinAccount.email && (
                    <p className="text-sm text-green-700">Email: {linkedinAccount.email}</p>
                  )}
                  {linkedinAccount.linkedinUserId && (
                    <p className="text-sm text-green-700">LinkedIn ID: {linkedinAccount.linkedinUserId}</p>
                  )}
                  {linkedinAccount.scope && (
                    <p className="text-xs text-green-700 mt-1 break-all">Scopes: {linkedinAccount.scope}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={async () => { 
                      const authToken = localStorage.getItem('auth_token'); 
                      if (!authToken) return; 
                      await disconnectLinkedIn(authToken); 
                      setLinkedinAccount(null); 
                      setMessage('Disconnected LinkedIn'); 
                    }} 
                    disabled={loading}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={async () => { 
                      const authToken = localStorage.getItem('auth_token'); 
                      if (!authToken) return; 
                      const res = await testLinkedIn(authToken); 
                      setMessage(res.message + (res.user ? `: ${res.user}` : '')); 
                    }} 
                    disabled={loading}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {linkedinAccount && (
        <div className="flex justify-end">
          <a href="/linkedin" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go to LinkedIn Dashboard</a>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Failed') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}



