export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.flooxira.com';

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
    const message = data?.message || `Request failed with ${res.status} (${url})`;
    throw new Error(message);
  }
  return data as T;
}

export type AuthUser = { id: number; name?: string | null; email: string; phone?: string | null; role?: 'user' | 'admin' };

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

export async function selectInstagramAccount(token: string, instagramId: string, username: string) {
  return apiFetch<{ success: boolean; message: string; instagramId: string; username: string }>("/api/facebook/select-instagram", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ instagramId, username }),
  });
}

// Plans API
export type Plan = { id: number; name: string; priceCents: number; interval: 'monthly' | 'yearly'; features?: any; isActive: boolean };

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

export async function createContentItem(token: string, categoryId: number, payload: { title: string; body?: string; attachments?: ContentItem['attachments']; status?: 'draft' | 'ready' }) {
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

// Campaigns
export async function startWhatsAppCampaign(token: string, file: File, messageTemplate: string, throttleMs = 3000, mediaFile?: File | null, scheduleAt?: string | null, dailyCap?: number | null, perNumberDelayMs?: number | null) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('messageTemplate', messageTemplate);
  formData.append('throttleMs', String(throttleMs));
  if (mediaFile) formData.append('media', mediaFile);
  if (scheduleAt) {
    formData.append('scheduleAt', scheduleAt);
    // Include user's timezone offset
    const timezoneOffset = new Date().getTimezoneOffset();
    formData.append('timezoneOffset', timezoneOffset.toString());
  }
  if (dailyCap) formData.append('dailyCap', String(dailyCap));
  if (perNumberDelayMs) formData.append('perNumberDelayMs', String(perNumberDelayMs));
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

export async function getAllUsers(token: string) {
  return apiFetch<{ success: boolean; users: Array<{ id: number; name?: string; email: string; phone?: string; role: 'user' | 'admin'; isActive: boolean; createdAt: string; updatedAt: string }> }>("/api/admin/users", { authToken: token });
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

