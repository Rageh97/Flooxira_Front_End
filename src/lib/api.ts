export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type FetchOptions = RequestInit & { authToken?: string };

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const isFormData = typeof options.body !== 'undefined' && typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  if (options.authToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${options.authToken}`;
  }
  

  const url = `${API_URL}${path}`;
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {
    // ignore parse errors
  }
  if (!res.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with ${res.status} (${url})`;
    const fullMessage = data?.error ? `${data.message}: ${data.error}` : errorMessage;
    throw new Error(fullMessage);
  }
  return data as T;
}

export type AuthUser = { id: number; name?: string | null; email: string; phone?: string | null; role?: 'user' | 'admin' | 'employee' };

export async function signInRequest(email: string, password: string) {
  return apiFetch<{ user: AuthUser; token: string }>("/api/auth/sign-in", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signUpRequest(name: string, email: string, phone: string, password: string) {
  return apiFetch<{ user: AuthUser; token: string }>("/api/auth/sign-up", {
    method: "POST",
    body: JSON.stringify({ name, email, phone, password }),
  });
}

export async function meRequest(token: string) {
  return apiFetch<{ user: AuthUser }>("/api/auth/me", { authToken: token });
}

export async function forgotPasswordRequest(email: string) {
  return apiFetch<{ ok: boolean; token?: string }>("/api/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(email: string, token: string, password: string) {
  return apiFetch<{ ok: boolean }>("/api/auth/reset", {
    method: "POST",
    body: JSON.stringify({ email, token, password }),
  });
}

// Facebook helpers
export async function getFacebookAccount(token: string) {
  return apiFetch<{ account: any }>("/api/facebook", { authToken: token });
}




export async function getFacebookPages(token: string) {
  const bust = Date.now();
  return apiFetch<{ pages: Array<{ id: string; name: string; accessToken?: string; hasInstagram?: boolean; instagramAccount?: { id: string; username: string } }> }>(`/api/facebook/pages?t=${bust}` as string, { authToken: token });
}

export async function selectFacebookPage(token: string, pageId: string, pageName?: string) {
  return apiFetch<{ success: boolean; pageId: string; pageName: string }>("/api/facebook/select-page", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ pageId, pageName }),
  });
}

export async function getFacebookGroups(token: string) {
  const bust = Date.now();
  return apiFetch<{ groups: Array<{ groupId: string; name: string }> }>(`/api/facebook/groups?t=${bust}` as string, { authToken: token });
}

export async function selectFacebookGroup(token: string, groupId: string, name?: string) {
  return apiFetch<{ account: any }>("/api/facebook/select-group", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ groupId, name }),
  });
}

export async function getInstagramAccounts(token: string) {
  return apiFetch<{ instagramAccounts: Array<{ pageId: string; pageName: string; instagramId: string; username: string; mediaCount: number; pageAccessToken: string }> }>("/api/facebook/instagram-accounts", {
    authToken: token,
  });
}

export async function selectInstagramAccount(token: string, pageId: string, instagramId: string, username: string) {
  return apiFetch<{ success: boolean; message: string; instagramId: string; username: string }>("/api/facebook/select-instagram", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ pageId, instagramId, username }),
  });
}

// Plans API
export type Plan = { 
  id: number; 
  name: string; 
  priceCents: number; 
  interval: 'monthly' | 'yearly'; 
  features?: any; 
  permissions?: {
    platforms: string[];
    monthlyPosts: number;
    canSchedule: boolean;
    canAnalytics: boolean;
    canTeamManagement: boolean;
    maxTeamMembers: number;
    canCustomBranding: boolean;
    prioritySupport: boolean;
    canManageWhatsApp: boolean;
    whatsappMessagesPerMonth: number;
    canManageTelegram: boolean;
    canSallaIntegration: boolean;
    canManageContent: boolean;
    canManageCustomers: boolean;
    canMarketServices: boolean;
    maxServices: number;
  };
  isActive: boolean 
};

export async function listPlans(token: string) {
  return apiFetch<{ plans: Plan[] }>("/api/plans", { authToken: token });
}

export async function createPlan(token: string, plan: Partial<Plan>) {
  return apiFetch<{ plan: Plan }>("/api/plans", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(plan),
  });
}

export async function updatePlan(token: string, id: number, updates: Partial<Plan>) {
  return apiFetch<{ plan: Plan }>(`/api/plans/${id}`, {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(updates),
  });
}

export async function deletePlan(token: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/api/plans/${id}`, { method: "DELETE", authToken: token });
}

// Posts update/delete helpers
export async function updatePostRequest(token: string, id: number, updates: any) {
  return apiFetch<{ post: any }>(`/api/posts/${id}`, {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(updates),
  });
}

export async function deletePostRequest(token: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/api/posts/${id}`, { method: "DELETE", authToken: token });
}

// WhatsApp Web API functions
export async function startWhatsAppSession(token: string) {
  return apiFetch<{ success: boolean; message: string; qrCode?: string; status: string }>("/api/whatsapp/start", {
    method: "POST",
    authToken: token
  });
}

export async function getWhatsAppStatus(token: string) {
  return apiFetch<{ success: boolean; status: string; message: string; initializing?: boolean }>("/api/whatsapp/status", { authToken: token });
}

export async function getWhatsAppQRCode(token: string) {
  return apiFetch<{ success: boolean; qrCode?: string; message: string }>("/api/whatsapp/qr", { authToken: token });
}

export async function stopWhatsAppSession(token: string) {
  return apiFetch<{ success: boolean; message: string }>("/api/whatsapp/stop", {
    method: "POST",
    authToken: token
  });
}

export async function sendWhatsAppMessage(token: string, to: string, message: string) {
  return apiFetch<{ success: boolean; message: string }>("/api/whatsapp/send", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ to, message })
  });
}

export async function uploadKnowledgeBase(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiFetch<{ success: boolean; message: string; count: number }>("/api/whatsapp/knowledge/upload", {
    method: "POST",
    authToken: token,
    body: formData,
    headers: {} // Let browser set Content-Type for FormData
  });
}

export async function getKnowledgeBase(token: string) {
  return apiFetch<{ success: boolean; entries: Array<{ id: number; keyword: string; answer: string; isActive: boolean; createdAt: string }> }>("/api/whatsapp/knowledge", { authToken: token });
}

export async function deleteKnowledgeEntry(token: string, id: number) {
  return apiFetch<{ success: boolean; message: string }>(`/api/whatsapp/knowledge/${id}`, { method: "DELETE", authToken: token });
}

// Chat Management API functions
export async function getChatHistory(token: string, contactNumber?: string, limit = 50, offset = 0) {
  const params = new URLSearchParams();
  if (contactNumber) params.set('contactNumber', contactNumber);
  params.set('limit', limit.toString());
  params.set('offset', offset.toString());
  
  return apiFetch<{ success: boolean; chats: Array<{ id: number; contactNumber: string; messageType: 'incoming' | 'outgoing'; messageContent: string; responseSource: string; knowledgeBaseMatch: string | null; timestamp: string }> }>(`/api/whatsapp/chats?${params}`, { authToken: token });
}

export async function getChatContacts(token: string) {
  return apiFetch<{ success: boolean; contacts: Array<{ contactNumber: string; messageCount: number; lastMessageTime: string }> }>("/api/whatsapp/contacts", { authToken: token });
}

export async function getBotStats(token: string) {
  return apiFetch<{ success: boolean; stats: { totalMessages: number; incomingMessages: number; outgoingMessages: number; totalContacts: number; knowledgeBaseResponses: number; openaiResponses: number; fallbackResponses: number } }>("/api/whatsapp/stats", { authToken: token });
}

// Groups & Status
export async function listWhatsAppGroups(token: string) {
  return apiFetch<{ success: boolean; groups: Array<{ id: string; name: string; participantsCount: number }> }>("/api/whatsapp/groups", { authToken: token });
}

export async function sendToWhatsAppGroup(token: string, groupName: string, message: string) {
  return apiFetch<{ success: boolean; message?: string }>("/api/whatsapp/groups/send", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ groupName, message })
  });
}

export async function exportGroupMembers(token: string, groupName: string) {
  const url = `/api/whatsapp/groups/export?groupName=${encodeURIComponent(groupName)}`;
  return apiFetch<{ success: boolean; file?: string; message?: string }>(url, { authToken: token });
}

export async function sendToWhatsAppGroupsBulk(
  token: string,
  params: { groupNames: string[]; message?: string; mediaFile?: File | null; scheduleAt?: string | null }
) {
  const form = new FormData();
  form.append('groupNames', JSON.stringify(params.groupNames));
  if (params.message) form.append('message', params.message);
  if (params.mediaFile) form.append('media', params.mediaFile);
  if (params.scheduleAt) {
    form.append('scheduleAt', params.scheduleAt);
    // Include user's timezone offset
    const timezoneOffset = new Date().getTimezoneOffset();
    form.append('timezoneOffset', timezoneOffset.toString());
  }
  return apiFetch<{ success: boolean; message?: string }>(`/api/whatsapp/groups/send-bulk`, {
    method: 'POST',
    authToken: token,
    body: form,
    headers: {}
  });
}

export async function postWhatsAppStatus(token: string, image: File, caption?: string) {
  const formData = new FormData();
  formData.append('image', image);
  if (caption) formData.append('caption', caption);
  return apiFetch<{ success: boolean; message?: string }>("/api/whatsapp/status/post", {
    method: "POST",
    authToken: token,
    body: formData,
    headers: {}
  });
}

// Schedules API (WhatsApp + Posts)
export async function getMonthlySchedules(token: string, month: number, year: number) {
  const qs = new URLSearchParams({ month: String(month), year: String(year) });
  return apiFetch<{ success: boolean; month: number; year: number; whatsapp: any[]; posts: any[] }>(`/api/whatsapp/schedules/monthly?${qs.toString()}`, { authToken: token });
}

export async function updateWhatsAppSchedule(token: string, id: number, scheduledAt: string, newContent?: string, newMedia?: File | null) {
  const form = new FormData();
  form.append('scheduledAt', scheduledAt);
  form.append('timezoneOffset', new Date().getTimezoneOffset().toString());
  
  if (newContent) {
    form.append('payload', JSON.stringify({ message: newContent }));
  }
  
  if (newMedia) {
    form.append('media', newMedia);
  }
  
  return apiFetch<{ success: boolean; schedule: any }>(`/api/whatsapp/schedules/${id}`, {
    method: 'PUT',
    authToken: token,
    body: form,
    headers: {}
  });
}

export async function deleteWhatsAppSchedule(token: string, id: number) {
  return apiFetch<{ success: boolean }>(`/api/whatsapp/schedules/${id}`, {
    method: 'DELETE',
    authToken: token
  });
}

export async function updatePlatformPostSchedule(token: string, id: number, updates: { scheduledAt?: string; content?: string; platforms?: string[]; format?: string; media?: File }) {
  const form = new FormData();
  
  if (updates.scheduledAt) {
    form.append('scheduledAt', updates.scheduledAt);
    // Include user's timezone offset
    form.append('timezoneOffset', new Date().getTimezoneOffset().toString());
  }
  
  if (updates.content) {
    form.append('content', updates.content);
  }
  
  if (updates.platforms) {
    form.append('platforms', JSON.stringify(updates.platforms));
  }
  
  if (updates.format) {
    form.append('format', updates.format);
  }
  
  if (updates.media) {
    form.append('media', updates.media);
  }
  
  return apiFetch<{ success: boolean; post: any }>(`/api/whatsapp/schedules/post/${id}`, {
    method: 'PUT',
    authToken: token,
    body: form,
    headers: {}
  });
}

export async function deletePlatformPostSchedule(token: string, id: number) {
  return apiFetch<{ success: boolean }>(`/api/whatsapp/schedules/post/${id}`, {
    method: 'DELETE',
    authToken: token
  });
}

// ===== Content Management (Categories & Items) =====
export type ContentCategory = { id: number; name: string; description?: string | null; createdAt: string; updatedAt: string };
export type ContentItem = { id: number; categoryId: number; title: string; body?: string | null; attachments: Array<{ url: string; type: 'image' | 'video' | 'file' }>; status: 'draft' | 'ready'; platforms: string[]; scheduledAt?: string | null; createdAt: string; updatedAt: string };

export async function listContentCategories(token: string) {
  return apiFetch<{ categories: ContentCategory[] }>("/api/content/categories", { authToken: token });
}

export async function createContentCategory(token: string, payload: { name: string; description?: string }) {
  return apiFetch<{ category: ContentCategory }>("/api/content/categories", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function updateContentCategory(token: string, id: number, payload: Partial<{ name: string; description?: string }>) {
  return apiFetch<{ category: ContentCategory }>(`/api/content/categories/${id}` as string, {
    method: 'PUT',
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function deleteContentCategory(token: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/api/content/categories/${id}` as string, { method: 'DELETE', authToken: token });
}

export async function listContentItems(token: string, categoryId: number) {
  return apiFetch<{ items: ContentItem[] }>(`/api/content/categories/${categoryId}/items` as string, { authToken: token });
}

// ===== Bot Content (Dynamic fields + data) =====
export type BotField = { id: number; userId: number; fieldName: string; fieldType: 'string' | 'number' | 'boolean' | 'date' | 'text'; createdAt: string; updatedAt: string };
export type BotDataRow = { id: number; userId: number; data: Record<string, any>; createdAt: string; updatedAt: string };

export async function botAddField(token: string, payload: { fieldName: string; fieldType?: BotField['fieldType'] }) {
  return apiFetch<{ field: BotField }>(`/api/bot/fields`, { method: 'POST', authToken: token, body: JSON.stringify(payload) });
}

export async function botListFields(token: string) {
  return apiFetch<{ fields: BotField[] }>(`/api/bot/fields`, { authToken: token });
}

export async function botDeleteField(token: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/api/bot/fields/${id}`, { method: 'DELETE', authToken: token });
}

export async function botCreateRow(token: string, data: Record<string, any>) {
  return apiFetch<{ row: BotDataRow }>(`/api/bot/data`, { method: 'POST', authToken: token, body: JSON.stringify({ data }) });
}

export async function botListData(token: string, limit = 50, offset = 0) {
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiFetch<{ rows: BotDataRow[]; count: number; limit: number; offset: number }>(`/api/bot/data?${qs.toString()}`, { authToken: token });
}

export async function botUpdateRow(token: string, id: number, data: Record<string, any>) {
  return apiFetch<{ row: BotDataRow }>(`/api/bot/data/${id}`, { method: 'PUT', authToken: token, body: JSON.stringify({ data }) });
}

export async function botUploadExcel(token: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<{ success: boolean; fieldsCreated: number; rowsCreated: number }>(`/api/bot/upload`, { method: 'POST', authToken: token, body: form, headers: {} });
}

export async function botDeleteRow(token: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/api/bot/data/${id}`, { method: 'DELETE', authToken: token });
}

export async function botExportData(token: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/bot/export`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('فشل في تصدير البيانات');
  }
  
  return response.blob();
}

// Category management functions


// Usage Statistics API
export async function getUsageStats(token: string, platform: 'whatsapp' | 'telegram') {
  return apiFetch<{
    success: boolean;
    data: {
      platform: string;
      usage: {
        used: number;
        limit: number;
        remaining: number;
        percentage: number;
        isNearLimit: boolean;
        isAtLimit: boolean;
        canSend: boolean;
      };
      limits: {
        canManageWhatsApp: boolean;
        canManageTelegram: boolean;
        whatsappMessagesPerMonth: number;
        telegramMessagesPerMonth: number;
        planName: string;
      };
      warning: string | null;
    };
  }>(`/api/usage/stats?platform=${platform}`, { authToken: token });
}

export async function getAllUsageStats(token: string) {
  return apiFetch<{
    success: boolean;
    data: {
      limits: {
        canManageWhatsApp: boolean;
        canManageTelegram: boolean;
        whatsappMessagesPerMonth: number;
        telegramMessagesPerMonth: number;
        planName: string;
      };
      whatsapp: {
        used: number;
        limit: number;
        remaining: number;
        percentage: number;
        isNearLimit: boolean;
        isAtLimit: boolean;
        canSend: boolean;
      };
      telegram: {
        used: number;
        limit: number;
        remaining: number;
        percentage: number;
        isNearLimit: boolean;
        isAtLimit: boolean;
        canSend: boolean;
      };
      warnings: string[];
    };
  }>(`/api/usage/stats/all`, { authToken: token });
}

export async function createContentItem(token: string, categoryId: number, payload: { title: string; body?: string; attachments?: ContentItem['attachments']; status?: 'draft' | 'ready'; scheduledAt?: string | null }) {
  return apiFetch<{ item: ContentItem }>(`/api/content/categories/${categoryId}/items` as string, {
    method: 'POST',
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function getContentItem(token: string, id: number) {
  return apiFetch<{ item: ContentItem }>(`/api/content/items/${id}` as string, { authToken: token });
}

export async function updateContentItem(token: string, id: number, payload: Partial<Pick<ContentItem, 'title' | 'body' | 'attachments' | 'status' | 'platforms'>> & { scheduledAt?: string | null }) {
  return apiFetch<{ item: ContentItem }>(`/api/content/items/${id}` as string, {
    method: 'PUT',
    authToken: token,
    body: JSON.stringify({ ...payload, timezoneOffset: new Date().getTimezoneOffset() })
  });
}

export async function deleteContentItem(token: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/api/content/items/${id}` as string, { method: 'DELETE', authToken: token });
}

export async function scheduleContentItem(token: string, id: number, payload: { platforms: string[]; format?: 'feed' | 'reel' | 'story'; scheduledAt?: string | null }) {
  return apiFetch<{ post: any }>(`/api/content/items/${id}/schedule` as string, {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ ...payload, timezoneOffset: new Date().getTimezoneOffset() })
  });
}

// AI Content Generation
export async function generateAIContent(token: string, payload: { prompt: string; platform?: string; tone?: string; length?: string }) {
  return apiFetch<{ content: string; prompt: string; platform?: string; tone?: string; length?: string }>("/api/content/ai/generate", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(payload),
  });
}

// Campaigns
export async function startWhatsAppCampaign(token: string, formData: FormData) {
  return apiFetch<{ success: boolean; summary?: { sent: number; failed: number; total: number }; message?: string }>("/api/whatsapp/campaigns/start", {
    method: "POST",
    authToken: token,
    body: formData,
    headers: {}
  });
}

// Admin API
export async function adminListAgents(token: string) {
  return apiFetch<{ success: boolean; agents: Array<{ id: number; name?: string; email: string }> }>("/api/admin/agents", { authToken: token });
}

export async function adminListChats(token: string, params: { contactNumber?: string; assigneeId?: number; limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.contactNumber) qs.set('contactNumber', params.contactNumber);
  if (params.assigneeId) qs.set('assigneeId', String(params.assigneeId));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  return apiFetch<{ success: boolean; chats: any[] }>(`/api/admin/chats?${qs.toString()}`, { authToken: token });
}

export async function adminAssignChat(token: string, chatId: number, assigneeId?: number) {
  return apiFetch<{ success: boolean }>("/api/admin/chats/assign", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ chatId, assigneeId })
  });
}

export async function getAllUsers(token: string, page: number = 1, limit: number = 10) {
  return apiFetch<{ 
    success: boolean; 
    users: Array<{ id: number; name?: string; email: string; phone?: string; role: 'user' | 'admin'; isActive: boolean; createdAt: string; updatedAt: string }>;
    total: number;
    totalPages: number;
    currentPage: number;
  }>(`/api/admin/users?page=${page}&limit=${limit}`, { authToken: token });
}

export async function getUserDetails(token: string, userId: number) {
  return apiFetch<{ 
    success: boolean; 
    user: {
      id: number;
      name?: string;
      email: string;
      phone?: string;
      role: 'user' | 'admin';
      isActive: boolean;
      emailVerifiedAt?: string;
      botPaused: boolean;
      botPausedUntil?: string;
      createdAt: string;
      updatedAt: string;
      subscriptions: Array<{
        id: number;
        userId: number;
        planId: number;
        status: 'active' | 'expired' | 'cancelled';
        startedAt: string;
        expiresAt: string;
        autoRenew: boolean;
        createdAt: string;
        updatedAt: string;
        plan: {
          id: number;
          name: string;
          priceCents: number;
          interval: 'monthly' | 'yearly';
          features: any;
          permissions: any;
        };
      }>;
      subscriptionRequests: Array<{
        id: number;
        userId: number;
        planId: number;
        paymentMethod: 'usdt' | 'coupon';
        status: 'pending' | 'approved' | 'rejected';
        usdtWalletAddress?: string;
        receiptImage?: string;
        couponCode?: string;
        notes?: string;
        adminNotes?: string;
        processedAt?: string;
        processedBy?: number;
        createdAt: string;
        updatedAt: string;
        plan: {
          id: number;
          name: string;
          priceCents: number;
          interval: 'monthly' | 'yearly';
        };
      }>;
    }
  }>(`/api/admin/users/${userId}`, { authToken: token });
}

export async function updateUserStatus(token: string, userId: number, isActive: boolean) {
  return apiFetch<{ 
    success: boolean; 
    message: string;
    user: {
      id: number;
      name?: string;
      email: string;
      isActive: boolean;
    }
  }>(`/api/admin/users/${userId}/status`, { 
    method: 'PUT',
    body: JSON.stringify({ isActive }),
    authToken: token 
  });
}

export async function getAllSubscriptions(token: string, page: number = 1, limit: number = 10, filter: string = 'all') {
  return apiFetch<{ 
    success: boolean; 
    subscriptions: Array<{
      id: number;
      userId: number;
      planId: number;
      status: 'active' | 'expired' | 'cancelled';
      startedAt: string;
      expiresAt: string;
      autoRenew: boolean;
      createdAt: string;
      updatedAt: string;
      user: {
        id: number;
        name?: string;
        email: string;
        phone?: string;
        isActive: boolean;
      };
      plan: {
        id: number;
        name: string;
        priceCents: number;
        interval: 'monthly' | 'yearly';
        features: any;
        permissions: any;
      };
    }>;
    total: number;
    totalPages: number;
    currentPage: number;
  }>(`/api/admin/subscriptions?page=${page}&limit=${limit}&filter=${filter}`, { authToken: token });
}

// Platform connection status
export async function checkPlatformConnections(token: string) {
  return apiFetch<{ 
    success: boolean; 
    connections: {
      facebook: boolean;
      instagram: boolean;
      youtube: boolean;
      tiktok: boolean;
      linkedin: boolean;
      pinterest: boolean;
    };
    mode?: 'development' | 'production';
  }>("/api/platforms/connections", { authToken: token });
}

// Platform credentials (per-user app credentials)
export async function listPlatformCredentials(token: string) {
  return apiFetch<{ success: boolean; credentials: Array<{ id: number; platform: string; clientId: string; redirectUri?: string }> }>("/api/platforms/credentials", { authToken: token });
}

export async function getPlatformCredential(token: string, platform: string) {
  return apiFetch<{ success: boolean; credential?: { id: number; platform: string; clientId: string; redirectUri?: string; metadata?: any } }>(`/api/platforms/credentials/${platform}`, { authToken: token });
}

export async function upsertPlatformCredential(token: string, platform: string, payload: { clientId: string; clientSecret: string; redirectUri?: string; metadata?: any }) {
  return apiFetch<{ success: boolean }>(`/api/platforms/credentials/${platform}`, { method: 'PUT', authToken: token, body: JSON.stringify(payload) });
}

export async function deletePlatformCredential(token: string, platform: string) {
  return apiFetch<{ success: boolean }>(`/api/platforms/credentials/${platform}`, { method: 'DELETE', authToken: token });
}


// // Salla API helpers
// export async function startSallaOAuth() {
//   // server handles redirect building at /auth/salla
//   window.location.href = `${API_URL}/auth/salla`;
// }

// export async function exchangeSallaCode(token: string, code: string) {
//   return apiFetch<{ message: string; account?: any }>("/api/salla/exchange", {
//     method: "POST",
//     authToken: token,
//     body: JSON.stringify({ code })
//   });
// }

// export async function getSallaAccount(token: string) {
//   return apiFetch<{ connected: boolean; account?: any }>("/api/salla/account", { authToken: token });
// }

// export async function testSalla(token: string) {
//   return apiFetch<{ ok: boolean; message: string; storeName?: string }>("/api/salla/test", { authToken: token });
// }

// export async function disconnectSalla(token: string) {
//   return apiFetch<{ message: string }>("/api/salla/disconnect", { method: "POST", authToken: token });
// }

// export async function getSallaStore(token: string) {
//   return apiFetch<{ ok?: boolean; store?: { id: any; name?: string; email?: string }; scope?: string; message?: string }>("/api/salla/store", { authToken: token });
// }

// export async function listSallaProducts(token: string, page = 1, perPage = 20) {
//   return apiFetch<{ ok: boolean; data: any[]; message?: string }>(`/api/salla/products?page=${page}&per_page=${perPage}` as string, { authToken: token });
// }

// export async function createSallaProduct(token: string, payload: any) {
//   return apiFetch<{ ok: boolean; product?: any; message?: string }>("/api/salla/products", { method: "POST", authToken: token, body: JSON.stringify(payload) });
// }

// export async function updateSallaProduct(token: string, id: any, payload: any) {
//   return apiFetch<{ ok: boolean; product?: any; message?: string }>(`/api/salla/products/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// export async function listSallaOrders(token: string, page = 1, perPage = 20) {
//   return apiFetch<{ ok: boolean; data: any[]; message?: string }>(`/api/salla/orders?page=${page}&per_page=${perPage}` as string, { authToken: token });
// }

// export async function updateSallaOrder(token: string, id: any, payload: any) {
//   return apiFetch<{ ok: boolean; order?: any; message?: string }>(`/api/salla/orders/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// export async function listSallaCustomers(token: string, page = 1, perPage = 20) {
//   return apiFetch<{ ok: boolean; data: any[]; message?: string }>(`/api/salla/customers?page=${page}&per_page=${perPage}` as string, { authToken: token });
// }

// export async function updateSallaCustomer(token: string, id: any, payload: any) {
//   return apiFetch<{ ok: boolean; customer?: any; message?: string }>(`/api/salla/customers/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// // Categories API
// export async function listSallaCategories(token: string, page = 1, perPage = 20) {
//   return apiFetch<{ ok: boolean; categories?: any[]; message?: string }>(`/api/salla/categories?page=${page}&per_page=${perPage}` as string, { authToken: token });
// }

// export async function createSallaCategory(token: string, payload: any) {
//   return apiFetch<{ ok: boolean; category?: any; message?: string }>("/api/salla/categories", { method: "POST", authToken: token, body: JSON.stringify(payload) });
// }

// export async function updateSallaCategory(token: string, id: any, payload: any) {
//   return apiFetch<{ ok: boolean; category?: any; message?: string }>(`/api/salla/categories/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// export async function deleteSallaCategory(token: string, id: any) {
//   return apiFetch<{ ok: boolean; category?: any; message?: string }>(`/api/salla/categories/${id}` as string, { method: "DELETE", authToken: token });
// }

// // Brands API
// export async function listSallaBrands(token: string, page = 1, perPage = 20) {
//   return apiFetch<{ ok: boolean; brands?: any[]; message?: string }>(`/api/salla/brands?page=${page}&per_page=${perPage}` as string, { authToken: token });
// }

// export async function createSallaBrand(token: string, payload: any) {
//   return apiFetch<{ ok: boolean; brand?: any; message?: string }>("/api/salla/brands", { method: "POST", authToken: token, body: JSON.stringify(payload) });
// }

// export async function updateSallaBrand(token: string, id: any, payload: any) {
//   return apiFetch<{ ok: boolean; brand?: any; message?: string }>(`/api/salla/brands/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// export async function deleteSallaBrand(token: string, id: any) {
//   return apiFetch<{ ok: boolean; brand?: any; message?: string }>(`/api/salla/brands/${id}` as string, { method: "DELETE", authToken: token });
// }

// // Branches API
// export async function listSallaBranches(token: string, page = 1, perPage = 20) {
//   return apiFetch<{ ok: boolean; branches?: any[]; message?: string }>(`/api/salla/branches?page=${page}&per_page=${perPage}` as string, { authToken: token });
// }

// export async function createSallaBranch(token: string, payload: any) {
//   return apiFetch<{ ok: boolean; branch?: any; message?: string }>("/api/salla/branches", { method: "POST", authToken: token, body: JSON.stringify(payload) });
// }

// export async function updateSallaBranch(token: string, id: any, payload: any) {
//   return apiFetch<{ ok: boolean; branch?: any; message?: string }>(`/api/salla/branches/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// export async function deleteSallaBranch(token: string, id: any) {
//   return apiFetch<{ ok: boolean; branch?: any; message?: string }>(`/api/salla/branches/${id}` as string, { method: "DELETE", authToken: token });
// }

// // Payments API
// export async function listSallaPayments(token: string, page = 1, perPage = 20) {
//   return apiFetch<{ ok: boolean; payments?: any[]; message?: string }>(`/api/salla/payments?page=${page}&per_page=${perPage}` as string, { authToken: token });
// }

// export async function updateSallaPayment(token: string, id: any, payload: any) {
//   return apiFetch<{ ok: boolean; payment?: any; message?: string }>(`/api/salla/payments/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// // Settings API
// export async function getSallaSettings(token: string, entity = 'store') {
//   return apiFetch<{ ok: boolean; settings?: any; message?: string }>(`/api/salla/settings?entity=${entity}`, { authToken: token });
// }

// export async function updateSallaSettings(token: string, payload: any) {
//   return apiFetch<{ ok: boolean; settings?: any; message?: string }>("/api/salla/settings", { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// export async function getSallaSettingsField(token: string, slug: string) {
//   return apiFetch<{ ok: boolean; field?: any; message?: string }>(`/api/salla/settings/fields/${slug}`, { authToken: token });
// }

// export async function updateSallaSettingsField(token: string, slug: string, payload: any) {
//   return apiFetch<{ ok: boolean; field?: any; message?: string }>(`/api/salla/settings/fields/${slug}`, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// // Reviews API
// export async function listSallaReviews(token: string, page = 1, perPage = 20, type = 'rating') {
//   return apiFetch<{ ok: boolean; reviews?: any[]; message?: string }>(`/api/salla/reviews?page=${page}&per_page=${perPage}&type=${type}` as string, { authToken: token });
// }

// export async function updateSallaReview(token: string, id: any, payload: any) {
//   return apiFetch<{ ok: boolean; review?: any; message?: string }>(`/api/salla/reviews/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// // Questions API
// export async function listSallaQuestions(token: string, page = 1, perPage = 20) {
//   return apiFetch<{ ok: boolean; questions?: any[]; message?: string }>(`/api/salla/questions?page=${page}&per_page=${perPage}` as string, { authToken: token });
// }

// export async function updateSallaQuestion(token: string, id: any, payload: any) {
//   return apiFetch<{ ok: boolean; question?: any; message?: string }>(`/api/salla/questions/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
// }

// LinkedIn API helpers
export async function startLinkedInOAuth() {
  // server handles redirect building at /auth/linkedin
  window.location.href = `${API_URL}/auth/linkedin`;
}

export async function exchangeLinkedInCode(token: string, code: string) {
  return apiFetch<{ message: string; account?: any }>("/api/linkedin/exchange", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ code })
  });
}

export async function exchangeFacebookCode(token: string, code: string) {
  return apiFetch<{ message: string; account?: any }>("/api/facebook/exchange", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ code })
  });
}

export async function exchangeYouTubeCode(token: string, code: string) {
  return apiFetch<{ message: string; account?: any }>("/api/youtube/exchange", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ code })
  });
}

export async function getYouTubeChannels(token: string) {
  return apiFetch<{ channels: Array<{ id: string; title: string; description: string; thumbnail?: string; subscriberCount: number; videoCount: number }> }>("/api/youtube/channels", {
    authToken: token,
  });
}

export async function selectYouTubeChannel(token: string, channelId: string, channelTitle: string) {
  return apiFetch<{ success: boolean; message: string; channel: { id: string; title: string } }>("/api/youtube/select-channel", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ channelId, channelTitle }),
  });
}

export async function exchangeTikTokCode(token: string, code: string) {
  return apiFetch<{ message: string; account?: any }>("/api/tiktok/exchange", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ code })
  });
}

export async function getLinkedInAccount(token: string) {
  return apiFetch<{ connected: boolean; account?: any }>("/api/linkedin/account", { authToken: token });
}

export async function testLinkedIn(token: string) {
  return apiFetch<{ ok: boolean; message: string; user?: string }>("/api/linkedin/test", { authToken: token });
}

export async function disconnectLinkedIn(token: string) {
  return apiFetch<{ message: string }>("/api/linkedin/disconnect", { method: "POST", authToken: token });
}

// LinkedIn Posts API
export async function createLinkedInPost(token: string, text: string, visibility = 'PUBLIC') {
  return apiFetch<{ ok: boolean; post?: any; message?: string }>("/api/linkedin/posts", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ text, visibility })
  });
}

export async function getLinkedInPosts(token: string, count = 10) {
  return apiFetch<{ ok: boolean; posts?: any[]; message?: string }>(`/api/linkedin/posts?count=${count}`, { authToken: token });
}

// LinkedIn Analytics API
export async function getLinkedInAnalytics(token: string, timeRange = '30d') {
  return apiFetch<{ ok: boolean; analytics?: any; message?: string }>(`/api/linkedin/analytics?timeRange=${timeRange}`, { authToken: token });
}

// LinkedIn Companies API
export async function getLinkedInCompanies(token: string) {
  return apiFetch<{ ok: boolean; companies?: any[]; message?: string }>("/api/linkedin/companies", { authToken: token });
}



// Pinterest API helpers
export async function exchangePinterestCode(token: string, code: string) {
  return apiFetch<{ success: boolean; message: string; account?: any }>("/api/pinterest/exchange", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ code })
  });
}

export async function getPinterestAccount(token: string) {
  try {
    return await apiFetch<{ connected: boolean; username?: string; fullName?: string }>("/api/pinterest/account", { authToken: token });
  } catch (e) {
    // Gracefully handle 404 or non-JSON responses in environments without Pinterest backend
    return { connected: false } as any;
  }
}

export async function listPinterestBoards(token: string) {
  try {
    return await apiFetch<{ boards: Array<{ id: string; name: string }> }>("/api/pinterest/boards", { authToken: token });
  } catch (e: any) {
    // Surface message but return empty list structure so UI doesn't break
    return { boards: [] } as any;
  }
}


// Facebook connect flow (handles tester auto add)
export type ConnectFacebookResult =
  | { status: 'success'; user: { id: string; name?: string; email?: string } }
  | { status: 'pending'; message: string }
  | { status: 'invite'; message: string; acceptUrl?: string }
  | { status: 'error'; message: string };

export async function connectFacebook(authCode: string, facebookUserId?: string): Promise<ConnectFacebookResult> {
  try {
    return await apiFetch<ConnectFacebookResult>(`/connect-facebook`, {
      method: 'POST',
      body: JSON.stringify({ authCode, facebookUserId }),
    });
  } catch (e: any) {
    return { status: 'error', message: e?.message || 'Failed to connect Facebook' };
  }
}

export async function inviteFacebookTester(facebookUserId: string): Promise<ConnectFacebookResult> {
  try {
    return await apiFetch<ConnectFacebookResult>(`/connect-facebook/invite`, {
      method: 'POST',
      body: JSON.stringify({ facebookUserId }),
    });
  } catch (e: any) {
    return { status: 'error', message: e?.message || 'Failed to invite tester' };
  }
}

// ===== TELEGRAM API FUNCTIONS =====

export async function createTelegramBot(token: string, botToken: string) {
  return apiFetch<{ success: boolean; message: string; botInfo?: any }>("/api/telegram/create", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ botToken })
  });
}

export async function getTelegramStatus(token: string) {
  return apiFetch<{ success: boolean; status: string; message: string; botInfo?: any }>("/api/telegram/status", { authToken: token });
}

export async function getTelegramBotInfo(token: string) {
  return apiFetch<{ success: boolean; botInfo?: any; message?: string }>("/api/telegram/info", { authToken: token });
}

export async function stopTelegramBot(token: string) {
  return apiFetch<{ success: boolean; message: string }>("/api/telegram/stop", { method: "POST", authToken: token });
}

export async function sendTelegramMessage(token: string, chatId: string, message: string) {
  return apiFetch<{ success: boolean; message: string }>("/api/telegram/send", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ chatId, message })
  });
}

export async function listTelegramGroups(token: string) {
  return apiFetch<{ success: boolean; groups: Array<{ id: string; name: string; type: string; messageCount: number }> }>("/api/telegram/groups", { authToken: token });
}

export async function sendToTelegramGroup(token: string, groupId: string, message: string) {
  return apiFetch<{ success: boolean; message: string }>("/api/telegram/groups/send", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ groupId, message })
  });
}

// Export Telegram group/channel members as an Excel/CSV file
export async function exportTelegramMembers(token: string, chatId: string) {
  const path = `/api/telegram/members/export?chatId=${encodeURIComponent(chatId)}`;
  return apiFetch<{ success: boolean; file?: string; message?: string }>(path, { authToken: token });
}

export async function sendToTelegramGroupsBulk(
  token: string,
  data: {
    groupIds: string[];
    message?: string;
    mediaFile?: File | null;
    scheduleAt?: string;
  }
) {
  const formData = new FormData();
  formData.append('groupIds', JSON.stringify(data.groupIds));
  if (data.message) formData.append('message', data.message);
  if (data.mediaFile) formData.append('media', data.mediaFile);
  if (data.scheduleAt) formData.append('scheduleAt', data.scheduleAt);
  
  return apiFetch<{ success: boolean; message: string }>("/api/telegram/groups/send-bulk", {
    method: "POST",
    authToken: token,
    body: formData
  });
}

export async function startTelegramCampaign(
  token: string,
  file: File,
  messageTemplate: string,
  throttleMs = 3000,
  mediaFile?: File | null,
  scheduleAt?: string | null,
  dailyCap?: number | null,
  perNumberDelayMs?: number | null
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('messageTemplate', messageTemplate);
  formData.append('throttleMs', throttleMs.toString());
  if (mediaFile) formData.append('media', mediaFile);
  if (scheduleAt) formData.append('scheduleAt', scheduleAt);
  if (dailyCap) formData.append('dailyCap', dailyCap.toString());
  if (perNumberDelayMs) formData.append('perNumberDelayMs', perNumberDelayMs.toString());
  
  return apiFetch<{ success: boolean; message: string; summary?: { sent: number; failed: number; total: number } }>("/api/telegram/campaigns/start", {
    method: "POST",
    authToken: token,
    body: formData
  });
}

export async function getTelegramChatHistory(token: string, chatId?: string, limit = 50, offset = 0) {
  const params = new URLSearchParams();
  if (chatId) params.append('chatId', chatId);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  
  return apiFetch<{ success: boolean; chats: Array<{ id: number; chatId: string; chatType: string; chatTitle: string; messageType: 'incoming' | 'outgoing'; messageContent: string; responseSource: string; knowledgeBaseMatch: string | null; timestamp: string }> }>(`/api/telegram/chats?${params}`, { authToken: token });
}

export async function getTelegramChatContacts(token: string) {
  return apiFetch<{ success: boolean; contacts: Array<{ chatId: string; chatType: string; chatTitle: string; messageCount: number; lastMessageTime: string }> }>("/api/telegram/contacts", { authToken: token });
}

export async function getTelegramBotStats(token: string) {
  return apiFetch<{ success: boolean; stats: { totalMessages: number; incomingMessages: number; outgoingMessages: number; totalContacts: number; knowledgeBaseResponses: number; openaiResponses: number; fallbackResponses: number } }>("/api/telegram/stats", { authToken: token });
}

export async function uploadTelegramKnowledgeBase(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiFetch<{ success: boolean; message: string; count: number }>("/api/telegram/knowledge/upload", {
    method: "POST",
    authToken: token,
    body: formData
  });
}

export async function getTelegramKnowledgeBase(token: string) {
  return apiFetch<{ success: boolean; entries: Array<{ id: number; keyword: string; answer: string; isActive: boolean; createdAt: string }> }>("/api/telegram/knowledge", { authToken: token });
}

export async function deleteTelegramKnowledgeEntry(token: string, id: number) {
  return apiFetch<{ success: boolean; message: string }>(`/api/telegram/knowledge/${id}`, { method: "DELETE", authToken: token });
}

export async function listTelegramSchedules(token: string) {
  return apiFetch<{ success: boolean; schedules: Array<any> }>("/api/telegram/schedules", { authToken: token });
}

export async function cancelTelegramSchedule(token: string, id: number) {
  return apiFetch<{ success: boolean }>(`/api/telegram/schedules/${id}/cancel`, { method: "POST", authToken: token });
}

export async function updateTelegramSchedule(token: string, id: number, scheduledAt: string, payload?: any, mediaFile?: File | null) {
  const formData = new FormData();
  formData.append('scheduledAt', scheduledAt);
  if (payload) formData.append('payload', JSON.stringify(payload));
  if (mediaFile) formData.append('media', mediaFile);
  
  return apiFetch<{ success: boolean; schedule: any }>(`/api/telegram/schedules/${id}`, {
    method: "PUT",
    authToken: token,
    body: formData
  });
}

export async function deleteTelegramSchedule(token: string, id: number) {
  return apiFetch<{ success: boolean }>(`/api/telegram/schedules/${id}`, { method: "DELETE", authToken: token });
}

export async function listTelegramMonthlySchedules(token: string, month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());
  
  return apiFetch<{ success: boolean; month: number; year: number; telegram: Array<any>; posts: Array<any> }>(`/api/telegram/schedules/monthly?${params}`, { authToken: token });
}

// ===== Telegram Bot API (BotFather token) =====
export async function telegramBotConnect(token: string, botToken: string, baseUrl?: string) {
  return apiFetch<{ success: boolean; bot?: { botUserId: string; username?: string; name?: string }; message?: string }>("/api/telegram-bot/connect", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ token: botToken, baseUrl })
  });
}

export async function telegramBotInfo(token: string) {
  return apiFetch<{ success: boolean; bot: { botUserId: string; username?: string; name?: string } | null }>("/api/telegram-bot/info", { authToken: token });
}

export async function telegramBotTest(token: string) {
  return apiFetch<{ success: boolean; bot?: any; message?: string }>("/api/telegram-bot/test", { authToken: token });
}

export async function telegramBotSendMessage(token: string, chatId: string, text: string) {
  return apiFetch<{ success: boolean; message?: any }>("/api/telegram-bot/send", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ chatId, text })
  });
}

export async function telegramBotSendMedia(token: string, chatId: string, mediaType: string, mediaFile: File, caption?: string) {
  const formData = new FormData();
  formData.append('chatId', chatId);
  formData.append('mediaType', mediaType);
  formData.append('mediaFile', mediaFile);
  if (caption) formData.append('text', caption);
  
  return apiFetch<{ success: boolean; message?: any }>("/api/telegram-bot/send", {
    method: 'POST',
    authToken: token,
    body: formData,
    headers: {}
  });
}

export async function telegramBotSendSticker(token: string, chatId: string, stickerId: string) {
  return apiFetch<{ success: boolean; message?: any }>("/api/telegram-bot/send", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ chatId, stickerId })
  });
}

export async function telegramBotGetChat(token: string, chatId: string) {
  return apiFetch<{ success: boolean; chat?: any }>(`/api/telegram-bot/chat/${encodeURIComponent(chatId)}`, { authToken: token });
}

export async function telegramBotGetChatAdmins(token: string, chatId: string) {
  return apiFetch<{ success: boolean; administrators?: any[] }>(`/api/telegram-bot/chat/${encodeURIComponent(chatId)}/admins`, { authToken: token });
}

export async function telegramBotPromoteMember(token: string, chatId: string, memberId: string, permissions: any) {
  return apiFetch<{ success: boolean; result?: any }>("/api/telegram-bot/promote", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ chatId, memberId, permissions })
  });
}

export async function telegramBotGetUpdates(token: string, offset?: number, limit?: number) {
  const params = new URLSearchParams();
  if (offset !== undefined) params.set('offset', offset.toString());
  if (limit !== undefined) params.set('limit', limit.toString());
  return apiFetch<{ success: boolean; updates?: any[] }>(`/api/telegram-bot/updates?${params}`, { authToken: token });
}

export async function telegramBotGetChatHistory(token: string, chatId?: string, limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (chatId) params.set('chatId', chatId);
  if (limit !== undefined) params.set('limit', limit.toString());
  if (offset !== undefined) params.set('offset', offset.toString());
  return apiFetch<{ success: boolean; chats?: any[] }>(`/api/telegram-bot/chats?${params}`, { authToken: token });
}

export async function telegramBotGetStats(token: string) {
  return apiFetch<{ success: boolean; stats?: any }>("/api/telegram-bot/stats", { authToken: token });
}

export async function telegramBotGetContacts(token: string) {
  return apiFetch<{ success: boolean; contacts?: any[] }>("/api/telegram-bot/contacts", { authToken: token });
}

export async function telegramBotPollMessages(token: string) {
  return apiFetch<{ success: boolean; message?: string }>("/api/telegram-bot/poll-messages", {
    method: 'POST',
    authToken: token
  });
}

export async function telegramBotDisconnect(token: string) {
  return apiFetch<{ success: boolean; message?: string }>("/api/telegram-bot/disconnect", {
    method: 'POST',
    authToken: token
  });
}

export async function telegramBotGetChatMembers(token: string, chatId: string) {
  return apiFetch<{ success: boolean; totalCount?: number; members?: any[]; note?: string }>(`/api/telegram-bot/chat/${encodeURIComponent(chatId)}/members`, { authToken: token });
}

export async function telegramBotExportMembers(token: string, chatId: string) {
  const response = await fetch(`${API_URL}/api/telegram-bot/chat/${encodeURIComponent(chatId)}/export`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Export failed with status ${response.status}`);
  }
  
  // Create blob and download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Get filename from header or use default
  const contentDisposition = response.headers.get('content-disposition');
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] || `telegram_members_${new Date().getTime()}.xlsx`;
  
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  
  return { success: true, filename };
}

export async function telegramBotGetBotChats(token: string) {
  return apiFetch<{ success: boolean; chats?: any[]; total?: number; note?: string }>("/api/telegram-bot/bot-chats", { authToken: token });
}

export async function telegramBotCreateCampaign(token: string, payload: { targets?: string[]; tagIds?: number[]; message: string; scheduleAt?: string; throttleMs?: number; mediaUrl?: string; timezoneOffset?: number }) {
  return apiFetch<{ success: boolean; id: number }>("/api/telegram-bot/campaigns", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function telegramBotListCampaigns(token: string) {
  return apiFetch<{ success: boolean; jobs: any[] }>("/api/telegram-bot/campaigns", { authToken: token });
}

export async function telegramMonthlySchedules(token: string, month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.set('month', String(month));
  if (year) params.set('year', String(year));
  return apiFetch<{ success: boolean; month: number; year: number; telegram: any[] }>(`/api/telegram-bot/schedules/monthly?${params.toString()}`, { authToken: token });
}

export async function telegramUpdateSchedule(token: string, id: number, scheduledAt: string, payload?: any) {
  const body: any = { scheduledAt };
  if (payload) body.payload = payload;
  return apiFetch<{ success: boolean; schedule: any }>(`/api/telegram-bot/schedules/${id}`, {
    method: 'PUT',
    authToken: token,
    body: JSON.stringify(body)
  });
}

export async function telegramDeleteSchedule(token: string, id: number) {
  return apiFetch<{ success: boolean }>(`/api/telegram-bot/schedules/${id}`, {
    method: 'DELETE',
    authToken: token
  });
}

// ===== Telegram Web (puppeteer) =====
export async function tgWebStart(token: string, params?: { method?: 'qr' | 'code'; phone?: string }) {
  return apiFetch<{ success: boolean; status?: string; qrCode?: string; tgUrl?: string; webUrl?: string; message?: string }>("/api/telegram-web/start", { method: 'POST', authToken: token, body: JSON.stringify(params || {}) });
}

export async function tgWebStatus(token: string) {
  return apiFetch<{ success: boolean; status: string; message?: string }>("/api/telegram-web/status", { authToken: token });
}

export async function tgWebQR(token: string) {
  return apiFetch<{ success: boolean; qrCode?: string; message?: string }>("/api/telegram-web/qr", { authToken: token });
}

export async function tgWebStop(token: string) {
  return apiFetch<{ success: boolean; message: string }>("/api/telegram-web/stop", { method: 'POST', authToken: token });
}

export async function tgWebSend(token: string, to: string, message: string) {
  return apiFetch<{ success: boolean; message?: string; error?: string }>("/api/telegram-web/send", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ to, message })
  });
}

export async function tgWebGroups(token: string) {
  return apiFetch<{ success: boolean; groups: Array<{ id: string; name: string; type: string }> }>("/api/telegram-web/groups", { authToken: token });
}

export async function tgWebSendBulk(token: string, targets: string[], message: string) {
  return apiFetch<{ success: boolean; summary?: { sent: number; failed: number; total: number } }>("/api/telegram-web/send-bulk", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ targets, message })
  });
}

// ===== Telegram Personal (GramJS) endpoints =====
export async function tgWebVerify(token: string, code: string, password?: string) {
  return apiFetch<{ success: boolean; status?: string; message?: string }>("/api/telegram-web/verify", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ code, password })
  });
}

// ===== Twitter (X) helpers =====
export async function exchangeTwitterCode(token: string, code: string, codeVerifier?: string) {
  return apiFetch<{ success: boolean; message?: string; account?: any }>("/api/twitter/exchange", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ code, codeVerifier })
  });
}

export async function tweet(token: string, text: string) {
  return apiFetch<{ success: boolean; tweet?: any; message?: string }>("/api/twitter/tweet", {
    method: 'POST',
    authToken: token,
    body: JSON.stringify({ text })
  });
}

// ===== Salla helpers =====
export async function sallaUpsertStore(token: string, payload: { storeId: string; storeName?: string; webhookSecret?: string }) {
  return apiFetch<{ ok: boolean; store: any }>(`/api/salla/store`, {
    method: 'POST',
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function sallaListEvents(token: string, limit = 50, offset = 0) {
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiFetch<{ success: boolean; events: any[] }>(`/api/salla/events?${qs.toString()}`, { authToken: token });
}

// ===== SUBSCRIPTION REQUESTS API =====
export type SubscriptionRequest = {
  id: number;
  userId: number;
  planId: number;
  paymentMethod: 'usdt' | 'coupon';
  status: 'pending' | 'approved' | 'rejected';
  usdtWalletAddress?: string;
  receiptImage?: string;
  couponCode?: string;
  notes?: string;
  adminNotes?: string;
  processedAt?: string;
  processedBy?: number;
  createdAt: string;
  updatedAt: string;
  Plan?: Plan;
  User?: { id: number; name?: string; email: string };
};

export async function createSubscriptionRequest(token: string, payload: {
  planId: number;
  paymentMethod: 'usdt' | 'coupon';
  usdtWalletAddress?: string;
  couponCode?: string;
}) {
  return apiFetch<{ success: boolean; subscriptionRequest: SubscriptionRequest; message: string }>("/api/subscription-requests", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function uploadReceipt(token: string, requestId: number, file: File) {
  const formData = new FormData();
  formData.append('receipt', file);
  
  return apiFetch<{ success: boolean; message: string; receiptImage: string }>(`/api/subscription-requests/${requestId}/upload-receipt`, {
    method: "POST",
    authToken: token,
    body: formData,
    headers: {}
  });
}

export async function getUserSubscriptionRequests(token: string) {
  return apiFetch<{ success: boolean; requests: SubscriptionRequest[] }>("/api/subscription-requests/my-requests", { authToken: token });
}

export async function getAllSubscriptionRequests(token: string, params: { status?: string; page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  
  return apiFetch<{ success: boolean; requests: SubscriptionRequest[]; total: number; page: number; limit: number }>(`/api/subscription-requests/admin/all?${qs.toString()}`, { authToken: token });
}

export async function updateSubscriptionRequestStatus(token: string, requestId: number, payload: { status: 'pending' | 'approved' | 'rejected'; adminNotes?: string }) {
  return apiFetch<{ success: boolean; message: string; subscriptionRequest: SubscriptionRequest }>(`/api/subscription-requests/admin/${requestId}/status`, {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function validateCoupon(token: string, code: string, planId: number) {
  const qs = new URLSearchParams({ code, planId: String(planId) });
  return apiFetch<{ success: boolean; valid: boolean; coupon?: { id: number; code: string; plan: Plan } }>(`/api/subscription-requests/validate-coupon?${qs.toString()}`, { authToken: token });
}

export async function getUSDTWalletInfo(token: string) {
  return apiFetch<{ success: boolean; walletInfo: { address: string; network: string; instructions: string } }>("/api/subscription-requests/wallet-info", { authToken: token });
}

// ===== COUPONS API =====
export type Coupon = {
  id: number;
  code: string;
  planId: number;
  isActive: boolean;
  usedAt?: string;
  usedBy?: number;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
};

export async function createCoupon(token: string, payload: { 
  code: string; 
  planId: number; 
  expiresAt?: string; 
  notes?: string;
  discountKeyword?: string;
  discountKeywordValue?: number;
}) {
  return apiFetch<{ success: boolean; coupon: Coupon; message: string }>("/api/coupons", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function listCoupons(token: string, params: { planId?: number; isActive?: boolean; page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.planId) qs.set('planId', String(params.planId));
  if (params.isActive !== undefined) qs.set('isActive', String(params.isActive));
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  
  return apiFetch<{ success: boolean; coupons: Coupon[]; total: number; page: number; limit: number }>(`/api/coupons?${qs.toString()}`, { authToken: token });
}

export async function updateCoupon(token: string, couponId: number, payload: { isActive?: boolean; expiresAt?: string; notes?: string }) {
  return apiFetch<{ success: boolean; coupon: Coupon; message: string }>(`/api/coupons/${couponId}`, {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function deleteCoupon(token: string, couponId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/api/coupons/${couponId}`, { method: "DELETE", authToken: token });
}

export async function generateCoupons(token: string, payload: { 
  planId: number; 
  count?: number; 
  prefix?: string; 
  expiresAt?: string;
  discountKeyword?: string;
  discountKeywordValue?: number;
}) {
  return apiFetch<{ success: boolean; coupons: Coupon[]; message: string }>("/api/coupons/generate", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(payload)
  });
}

// ===== SERVICES API =====
export interface Service {
  id: number;
  userId: number;
  title: string;
  description?: string;
  price: number;
  currency: string;
  purchaseLink?: string;
  image?: string;
  isActive: boolean;
  viewsCount: number;
  clicksCount: number;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
}

export async function createService(token: string, formData: FormData) {
  return apiFetch<{ success: boolean; service: Service; message: string }>("/api/services", {
    method: "POST",
    authToken: token,
    body: formData
  });
}

export async function getUserServices(token: string) {
  return apiFetch<{ 
    success: boolean; 
    services: Service[]; 
    stats: {
      currentCount: number;
      maxServices: number;
      canMarketServices: boolean;
      canCreateMore: boolean;
    }
  }>("/api/services", { authToken: token });
}

export async function getAllActiveServices(page: number = 1, limit: number = 20, category?: string, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  
  return apiFetch<{ 
    success: boolean; 
    services: Service[]; 
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }>(`/api/services/public?${params.toString()}`, {});
}

export async function getService(serviceId: number) {
  return apiFetch<{ success: boolean; service: Service }>(`/api/services/${serviceId}/view`, {});
}

export async function updateService(token: string, serviceId: number, formData: FormData) {
  return apiFetch<{ success: boolean; service: Service; message: string }>(`/api/services/${serviceId}`, {
    method: "PUT",
    authToken: token,
    body: formData
  });
}

export async function deleteService(token: string, serviceId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/api/services/${serviceId}`, {
    method: "DELETE",
    authToken: token
  });
}

export async function incrementServiceClick(serviceId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/api/services/${serviceId}/click`, {
    method: "POST"
  });
}

export async function getServiceStats(token: string, serviceId: number) {
  return apiFetch<{ 
    success: boolean; 
    stats: {
      views: number;
      clicks: number;
      clickRate: string;
    }
  }>(`/api/services/${serviceId}/stats`, { authToken: token });
}

// ===== ANALYTICS API =====
export async function getAllAnalytics(token: string) {
  return apiFetch<{ 
    success: boolean; 
    analytics: any; 
    timestamp: string; 
    userId: number; 
    message: string 
  }>("/api/analytics", { authToken: token });
}

export async function getFacebookAnalytics(token: string) {
  return apiFetch<{ 
    success: boolean; 
    platform: string; 
    analytics: any; 
    userId: number; 
    message: string 
  }>("/api/analytics/facebook", { authToken: token });
}


export async function getTwitterAnalytics(token: string) {
  return apiFetch<{ 
    success: boolean; 
    platform: string; 
    analytics: any; 
    userId: number; 
    message: string 
  }>("/api/analytics/twitter", { authToken: token });
}

export async function getYouTubeAnalytics(token: string) {
  return apiFetch<{ 
    success: boolean; 
    platform: string; 
    analytics: any; 
    userId: number; 
    message: string 
  }>("/api/analytics/youtube", { authToken: token });
}

export async function getPinterestAnalytics(token: string) {
  return apiFetch<{ 
    success: boolean; 
    platform: string; 
    analytics: any; 
    userId: number; 
    message: string 
  }>("/api/analytics/pinterest", { authToken: token });
}

// Facebook page management
export async function getAvailableFacebookPages(token: string) {
  return apiFetch<{ 
    success: boolean; 
    pages: any[]; 
    currentPageId: string 
  }>("/api/facebook/pages", { authToken: token });
}

export async function switchFacebookPage(token: string, pageId: string, pageName: string) {
  return apiFetch<{ 
    success: boolean; 
    message: string; 
    pageId: string; 
    pageName: string 
  }>("/api/facebook/select-page", { 
    method: "POST",
    body: JSON.stringify({ pageId, pageName }),
    authToken: token 
  });
}

// Get current Facebook page info
export async function getCurrentFacebookPage(token: string) {
  return apiFetch<{ 
    success: boolean; 
    pageId: string;
    pageName: string;
    fanCount: number;
  }>("/api/facebook/current-page", { authToken: token });
}

// Get Instagram account info
export async function getInstagramAccountInfo(token: string) {
  return apiFetch<{ 
    success: boolean; 
    account: any; 
    username: string;
    followersCount: number;
    followingCount: number;
    mediaCount: number;
  }>("/api/facebook/instagram/account", { authToken: token });
}

// Platform Details APIs
export async function getFacebookPageDetails(token: string) {
  return apiFetch<{ 
    success: boolean; 
    pageId: string;
    pageName: string;
    fanCount: number;
    instagramId?: string;
    instagramUsername?: string;
  }>("/api/facebook/current-page", { authToken: token });
}

export async function getLinkedInProfileDetails(token: string) {
  return apiFetch<{ 
    success: boolean; 
    profile: any;
    name: string;
  }>("/api/linkedin/profile", { authToken: token });
}

export async function getTwitterAccountDetails(token: string) {
  return apiFetch<{ 
    success: boolean; 
    metrics: any;
    username: string;
  }>("/api/twitter/account", { authToken: token });
}

export async function getYouTubeChannelDetails(token: string) {
  return apiFetch<{ 
    success: boolean; 
    title: string;
    statistics: any;
  }>("/api/youtube/channel", { authToken: token });
}

export async function getPinterestAccountDetails(token: string) {
  return apiFetch<{ 
    success: boolean; 
    user: any;
    username: string;
  }>("/api/pinterest/account", { authToken: token });
}


// ===== CONNECTED ACCOUNTS API =====
export async function getConnectedAccounts(token: string) {
  return apiFetch<{ 
    success: boolean; 
    connectedAccounts: {
      facebook?: { name: string; id: string; type: string };
      linkedin?: { name: string; id: string; type: string };
      twitter?: { name: string; id: string; type: string };
      youtube?: { name: string; id: string; type: string };
      pinterest?: { name: string; id: string; type: string };
    }; 
    totalConnected: number;
  }>("/api/facebook/connected-accounts", { authToken: token });
}

// Customer Management API Functions
export async function getCustomers(token: string, page: number = 1, limit: number = 10, filters: any = {}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
  });

  return apiFetch<{
    success: boolean;
    data: {
      customers: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    };
  }>(`/api/customers?${queryParams}`, {
    method: 'GET',
    authToken: token
  });
}

export async function getCustomer(token: string, customerId: number) {
  return apiFetch<{
    success: boolean;
    data: any;
  }>(`/api/customers/${customerId}`, {
    method: 'GET',
    authToken: token
  });
}

export async function createCustomer(token: string, customerData: any) {
  const formData = new FormData();
  
  // Add all text fields
  Object.keys(customerData).forEach(key => {
    if (key !== 'invoiceImage' && customerData[key] !== null && customerData[key] !== undefined) {
      if (typeof customerData[key] === 'object') {
        formData.append(key, JSON.stringify(customerData[key]));
      } else {
        formData.append(key, customerData[key]);
      }
    }
  });
  
  // Add invoice image if exists
  if (customerData.invoiceImage) {
    formData.append('invoiceImage', customerData.invoiceImage);
  }
  
  return apiFetch<{
    success: boolean;
    message: string;
    data: any;
  }>('/api/customers', {
    method: 'POST',
    body: formData,
    authToken: token
  });
}

export async function updateCustomer(token: string, customerId: number, customerData: any) {
  // If there's an invoiceImage file, use FormData, otherwise use JSON
  if (customerData.invoiceImage && customerData.invoiceImage instanceof File) {
    const formData = new FormData();
    
    // Add all text fields
    Object.keys(customerData).forEach(key => {
      if (key !== 'invoiceImage' && customerData[key] !== null && customerData[key] !== undefined) {
        if (typeof customerData[key] === 'object') {
          formData.append(key, JSON.stringify(customerData[key]));
        } else {
          formData.append(key, customerData[key]);
        }
      }
    });
    
    // Add invoice image if exists
    if (customerData.invoiceImage) {
      formData.append('invoiceImage', customerData.invoiceImage);
    }
    
    return apiFetch<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/customers/${customerId}`, {
      method: 'PUT',
      body: formData,
      authToken: token
    });
  } else {
    // Remove invoiceImage from data if it's not a File (to preserve existing image)
    const dataWithoutImage = { ...customerData };
    if (dataWithoutImage.invoiceImage && !(dataWithoutImage.invoiceImage instanceof File)) {
      delete dataWithoutImage.invoiceImage;
    }
    
    return apiFetch<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(dataWithoutImage),
      authToken: token
    });
  }
}

export async function deleteCustomer(token: string, customerId: number) {
  return apiFetch<{
    success: boolean;
    message: string;
  }>(`/api/customers/${customerId}`, {
    method: 'DELETE',
    authToken: token
  });
}

export async function getCustomerStats(token: string) {
  return apiFetch<{
    success: boolean;
    data: {
      totalCustomers: number;
      activeCustomers: number;
      vipCustomers: number;
      customersByType: Array<{ subscriptionType: string; count: number }>;
      customersByStatus: Array<{ subscriptionStatus: string; count: number }>;
      recentCustomers: any[];
      financial: {
        totalCapital: string;
        totalRevenue: string;
        netProfit: string;
      };
    };
  }>('/api/customers/stats', {
    method: 'GET',
    authToken: token
  });
}

export async function getPostUsageStats(token: string) {
  return apiFetch<{
    success: boolean;
    data: {
      monthlyLimit: number;
      totalUsed: number;
      remaining: number;
      percentage: number;
      isNearLimit: boolean;
      isAtLimit: boolean;
      platformUsage: Record<string, number>;
      planName: string;
    };
  }>('/api/posts/usage-stats', {
    method: 'GET',
    authToken: token
  });
}

export async function addCustomerInteraction(token: string, customerId: number, interactionData: any) {
  return apiFetch<{
    success: boolean;
    message: string;
    data: any;
  }>(`/api/customers/${customerId}/interactions`, {
    method: 'POST',
    body: JSON.stringify(interactionData),
    authToken: token
  });
}

export async function getCustomerInteractions(token: string, customerId: number, page: number = 1, limit: number = 10) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  return apiFetch<{
    success: boolean;
    data: {
      interactions: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    };
  }>(`/api/customers/${customerId}/interactions?${queryParams}`, {
    method: 'GET',
    authToken: token
  });
}

export async function getCategories(token: string) {
  return apiFetch<{
    success: boolean;
    data: any[];
  }>('/api/customers/categories', {
    method: 'GET',
    authToken: token
  });
}

export async function createCategory(token: string, categoryData: any) {
  return apiFetch<{
    success: boolean;
    message: string;
    data: any;
  }>('/api/customers/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
    authToken: token
  });
}

// Custom Fields API functions
export async function getCustomFields(token: string) {
  return apiFetch<{
    success: boolean;
    data: any[];
  }>('/api/custom-fields', {
    method: 'GET',
    authToken: token
  });
}

export async function createCustomField(token: string, fieldData: any) {
  return apiFetch<{
    success: boolean;
    message: string;
    data: any;
  }>('/api/custom-fields', {
    method: 'POST',
    body: JSON.stringify(fieldData),
    authToken: token
  });
}

export async function updateCustomField(token: string, fieldId: number, fieldData: any) {
  return apiFetch<{
    success: boolean;
    message: string;
    data: any;
  }>(`/api/custom-fields/${fieldId}`, {
    method: 'PUT',
    body: JSON.stringify(fieldData),
    authToken: token
  });
}

export async function deleteCustomField(token: string, fieldId: number) {
  return apiFetch<{
    success: boolean;
    message: string;
  }>(`/api/custom-fields/${fieldId}`, {
    method: 'DELETE',
    authToken: token
  });
}

// Employee Management API functions
export async function createEmployee(token: string, employeeData: any) {
  return apiFetch<{ success: boolean; employee: any; message?: string }>('/api/employees', {
    method: 'POST',
    body: JSON.stringify(employeeData),
    authToken: token,
  });
}

export async function getEmployees(token: string, page = 1, search = '') {
  return apiFetch<{ success: boolean; employees: any[]; pagination: any }>(`/api/employees?page=${page}&search=${search}`, {
    authToken: token,
  });
}

export async function getEmployee(token: string, employeeId: number) {
  return apiFetch<{ success: boolean; employee: any }>(`/api/employees/${employeeId}`, {
    authToken: token,
  });
}

export async function updateEmployee(token: string, employeeId: number, employeeData: any) {
  return apiFetch<{ success: boolean; employee: any; message?: string }>(`/api/employees/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(employeeData),
    authToken: token,
  });
}

export async function deleteEmployee(token: string, employeeId: number) {
  return apiFetch<{ success: boolean; message?: string }>(`/api/employees/${employeeId}`, {
    method: 'DELETE',
    authToken: token,
  });
}

export async function getEmployeeStats(token: string) {
  return apiFetch<{ success: boolean; stats: any }>('/api/employees/stats', {
    authToken: token,
  });
}

export async function changeEmployeePassword(token: string, employeeId: number, newPassword: string) {
  return apiFetch<{ success: boolean; message?: string }>(`/api/employees/${employeeId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword }),
    authToken: token,
  });
}

export async function employeeLogin(email: string, password: string) {
  return apiFetch<{ success: boolean; token: string; employee: any; message?: string }>('/api/employees/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getEmployeeProfile(token: string) {
  return apiFetch<{ success: boolean; employee: any; message?: string }>('/api/employees/me', {
    authToken: token,
  });
}

// AI API functions
export interface AIConversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: AIMessage[];
}

export interface AIMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  creditsUsed: number;
  createdAt: string;
}

export interface AIStats {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  isUnlimited: boolean;
  conversationsCount: number;
  resetAt: string | null;
}

export async function getAIConversations(token: string) {
  return apiFetch<{ success: boolean; conversations: AIConversation[] }>('/api/ai/conversations', {
    authToken: token,
  });
}

export async function createAIConversation(token: string, title?: string) {
  return apiFetch<{ success: boolean; conversation: AIConversation }>('/api/ai/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
    authToken: token,
  });
}

export async function getAIConversation(token: string, conversationId: number) {
  return apiFetch<{ success: boolean; conversation: AIConversation; messages: AIMessage[] }>(`/api/ai/conversations/${conversationId}`, {
    authToken: token,
  });
}

export async function sendAIMessage(token: string, conversationId: number, content: string) {
  return apiFetch<{ 
    success: boolean; 
    userMessage: AIMessage; 
    assistantMessage: AIMessage; 
    remainingCredits: number;
    conversation: AIConversation;
  }>(`/api/ai/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    authToken: token,
  });
}

export async function deleteAIConversation(token: string, conversationId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/api/ai/conversations/${conversationId}`, {
    method: 'DELETE',
    authToken: token,
  });
}

export async function updateAIConversationTitle(token: string, conversationId: number, title: string) {
  return apiFetch<{ success: boolean; conversation: AIConversation }>(`/api/ai/conversations/${conversationId}/title`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
    authToken: token,
  });
}

export async function getAIStats(token: string) {
  return apiFetch<{ success: boolean; stats: AIStats }>('/api/ai/stats', {
    authToken: token,
  });
}

// ===== APPOINTMENTS API =====
export interface Appointment {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceType: string;
  serviceDescription?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  notes?: string;
  source: string;
  assignedTo?: number;
  price?: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  followUpDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  upcoming: number;
  serviceStats: Array<{ serviceType: string; count: number }>;
  priorityStats: Array<{ priority: string; count: number }>;
}

export async function createAppointment(token: string, appointmentData: Partial<Appointment>) {
  return apiFetch<{ success: boolean; appointment: Appointment; message: string }>('/api/appointments', {
    method: 'POST',
    authToken: token,
    body: JSON.stringify(appointmentData)
  });
}

export async function getAppointments(token: string, params: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  serviceType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  assignedTo?: number;
} = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.set(key, value.toString());
    }
  });

  return apiFetch<{
    success: boolean;
    appointments: Appointment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(`/api/appointments?${queryParams.toString()}`, {
    authToken: token
  });
}

export async function getAppointment(token: string, appointmentId: number) {
  return apiFetch<{ success: boolean; appointment: Appointment }>(`/api/appointments/${appointmentId}`, {
    authToken: token
  });
}

export async function updateAppointment(token: string, appointmentId: number, updateData: Partial<Appointment>) {
  return apiFetch<{ success: boolean; appointment: Appointment; message: string }>(`/api/appointments/${appointmentId}`, {
    method: 'PUT',
    authToken: token,
    body: JSON.stringify(updateData)
  });
}

export async function deleteAppointment(token: string, appointmentId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/api/appointments/${appointmentId}`, {
    method: 'DELETE',
    authToken: token
  });
}

export async function getAppointmentStats(token: string, params: { dateFrom?: string; dateTo?: string } = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.set(key, value.toString());
    }
  });

  return apiFetch<{ success: boolean; stats: AppointmentStats }>(`/api/appointments/stats?${queryParams.toString()}`, {
    authToken: token
  });
}

export async function exportAppointments(token: string, params: {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
} = {}): Promise<Blob> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.set(key, value.toString());
    }
  });

  const response = await fetch(`${API_URL}/api/appointments/export?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('فشل في تصدير المواعيد');
  }
  
  return response.blob();
}

export async function checkAppointmentAvailability(token: string, params: {
  date: string;
  time: string;
  duration?: number;
}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.set(key, value.toString());
    }
  });

  return apiFetch<{
    success: boolean;
    available: boolean;
    conflictingAppointment?: {
      id: number;
      customerName: string;
      appointmentDate: string;
      appointmentTime: string;
    };
  }>(`/api/appointments/check-availability?${queryParams.toString()}`, {
    authToken: token
  });
}

