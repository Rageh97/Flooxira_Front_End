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

export type AuthUser = { id: number; name?: string | null; email: string; role?: 'user' | 'admin' };

export async function signInRequest(email: string, password: string) {
  return apiFetch<{ user: AuthUser; token: string }>("/api/auth/sign-in", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signUpRequest(name: string, email: string, password: string) {
  return apiFetch<{ user: AuthUser; token: string }>("/api/auth/sign-up", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
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
  return apiFetch<{ pages: Array<{ pageId: string; name: string; accessToken?: string }> }>(`/api/facebook/pages?t=${bust}` as string, { authToken: token });
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

export async function selectInstagramAccount(token: string, pageId: string, instagramId: string, accessToken?: string) {
  return apiFetch<{ success: boolean; message: string; instagramId: string; username: string }>("/api/facebook/select-instagram", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ pageId, instagramId, accessToken }),
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

// Campaigns
export async function startWhatsAppCampaign(token: string, file: File, messageTemplate: string, throttleMs = 3000) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('messageTemplate', messageTemplate);
  formData.append('throttleMs', String(throttleMs));
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


// Salla API helpers
export async function startSallaOAuth() {
  // server handles redirect building at /auth/salla
  window.location.href = `${API_URL}/auth/salla`;
}

export async function exchangeSallaCode(token: string, code: string) {
  return apiFetch<{ message: string; account?: any }>("/api/salla/exchange", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ code })
  });
}

export async function getSallaAccount(token: string) {
  return apiFetch<{ connected: boolean; account?: any }>("/api/salla/account", { authToken: token });
}

export async function testSalla(token: string) {
  return apiFetch<{ ok: boolean; message: string; storeName?: string }>("/api/salla/test", { authToken: token });
}

export async function disconnectSalla(token: string) {
  return apiFetch<{ message: string }>("/api/salla/disconnect", { method: "POST", authToken: token });
}

export async function getSallaStore(token: string) {
  return apiFetch<{ ok?: boolean; store?: { id: any; name?: string; email?: string }; scope?: string; message?: string }>("/api/salla/store", { authToken: token });
}

export async function listSallaProducts(token: string, page = 1, perPage = 20) {
  return apiFetch<{ ok: boolean; data: any[]; message?: string }>(`/api/salla/products?page=${page}&per_page=${perPage}` as string, { authToken: token });
}

export async function createSallaProduct(token: string, payload: any) {
  return apiFetch<{ ok: boolean; product?: any; message?: string }>("/api/salla/products", { method: "POST", authToken: token, body: JSON.stringify(payload) });
}

export async function updateSallaProduct(token: string, id: any, payload: any) {
  return apiFetch<{ ok: boolean; product?: any; message?: string }>(`/api/salla/products/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

export async function listSallaOrders(token: string, page = 1, perPage = 20) {
  return apiFetch<{ ok: boolean; data: any[]; message?: string }>(`/api/salla/orders?page=${page}&per_page=${perPage}` as string, { authToken: token });
}

export async function updateSallaOrder(token: string, id: any, payload: any) {
  return apiFetch<{ ok: boolean; order?: any; message?: string }>(`/api/salla/orders/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

export async function listSallaCustomers(token: string, page = 1, perPage = 20) {
  return apiFetch<{ ok: boolean; data: any[]; message?: string }>(`/api/salla/customers?page=${page}&per_page=${perPage}` as string, { authToken: token });
}

export async function updateSallaCustomer(token: string, id: any, payload: any) {
  return apiFetch<{ ok: boolean; customer?: any; message?: string }>(`/api/salla/customers/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

// Categories API
export async function listSallaCategories(token: string, page = 1, perPage = 20) {
  return apiFetch<{ ok: boolean; categories?: any[]; message?: string }>(`/api/salla/categories?page=${page}&per_page=${perPage}` as string, { authToken: token });
}

export async function createSallaCategory(token: string, payload: any) {
  return apiFetch<{ ok: boolean; category?: any; message?: string }>("/api/salla/categories", { method: "POST", authToken: token, body: JSON.stringify(payload) });
}

export async function updateSallaCategory(token: string, id: any, payload: any) {
  return apiFetch<{ ok: boolean; category?: any; message?: string }>(`/api/salla/categories/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

export async function deleteSallaCategory(token: string, id: any) {
  return apiFetch<{ ok: boolean; category?: any; message?: string }>(`/api/salla/categories/${id}` as string, { method: "DELETE", authToken: token });
}

// Brands API
export async function listSallaBrands(token: string, page = 1, perPage = 20) {
  return apiFetch<{ ok: boolean; brands?: any[]; message?: string }>(`/api/salla/brands?page=${page}&per_page=${perPage}` as string, { authToken: token });
}

export async function createSallaBrand(token: string, payload: any) {
  return apiFetch<{ ok: boolean; brand?: any; message?: string }>("/api/salla/brands", { method: "POST", authToken: token, body: JSON.stringify(payload) });
}

export async function updateSallaBrand(token: string, id: any, payload: any) {
  return apiFetch<{ ok: boolean; brand?: any; message?: string }>(`/api/salla/brands/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

export async function deleteSallaBrand(token: string, id: any) {
  return apiFetch<{ ok: boolean; brand?: any; message?: string }>(`/api/salla/brands/${id}` as string, { method: "DELETE", authToken: token });
}

// Branches API
export async function listSallaBranches(token: string, page = 1, perPage = 20) {
  return apiFetch<{ ok: boolean; branches?: any[]; message?: string }>(`/api/salla/branches?page=${page}&per_page=${perPage}` as string, { authToken: token });
}

export async function createSallaBranch(token: string, payload: any) {
  return apiFetch<{ ok: boolean; branch?: any; message?: string }>("/api/salla/branches", { method: "POST", authToken: token, body: JSON.stringify(payload) });
}

export async function updateSallaBranch(token: string, id: any, payload: any) {
  return apiFetch<{ ok: boolean; branch?: any; message?: string }>(`/api/salla/branches/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

export async function deleteSallaBranch(token: string, id: any) {
  return apiFetch<{ ok: boolean; branch?: any; message?: string }>(`/api/salla/branches/${id}` as string, { method: "DELETE", authToken: token });
}

// Payments API
export async function listSallaPayments(token: string, page = 1, perPage = 20) {
  return apiFetch<{ ok: boolean; payments?: any[]; message?: string }>(`/api/salla/payments?page=${page}&per_page=${perPage}` as string, { authToken: token });
}

export async function updateSallaPayment(token: string, id: any, payload: any) {
  return apiFetch<{ ok: boolean; payment?: any; message?: string }>(`/api/salla/payments/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

// Settings API
export async function getSallaSettings(token: string, entity = 'store') {
  return apiFetch<{ ok: boolean; settings?: any; message?: string }>(`/api/salla/settings?entity=${entity}`, { authToken: token });
}

export async function updateSallaSettings(token: string, payload: any) {
  return apiFetch<{ ok: boolean; settings?: any; message?: string }>("/api/salla/settings", { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

export async function getSallaSettingsField(token: string, slug: string) {
  return apiFetch<{ ok: boolean; field?: any; message?: string }>(`/api/salla/settings/fields/${slug}`, { authToken: token });
}

export async function updateSallaSettingsField(token: string, slug: string, payload: any) {
  return apiFetch<{ ok: boolean; field?: any; message?: string }>(`/api/salla/settings/fields/${slug}`, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

// Reviews API
export async function listSallaReviews(token: string, page = 1, perPage = 20, type = 'rating') {
  return apiFetch<{ ok: boolean; reviews?: any[]; message?: string }>(`/api/salla/reviews?page=${page}&per_page=${perPage}&type=${type}` as string, { authToken: token });
}

export async function updateSallaReview(token: string, id: any, payload: any) {
  return apiFetch<{ ok: boolean; review?: any; message?: string }>(`/api/salla/reviews/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

// Questions API
export async function listSallaQuestions(token: string, page = 1, perPage = 20) {
  return apiFetch<{ ok: boolean; questions?: any[]; message?: string }>(`/api/salla/questions?page=${page}&per_page=${perPage}` as string, { authToken: token });
}

export async function updateSallaQuestion(token: string, id: any, payload: any) {
  return apiFetch<{ ok: boolean; question?: any; message?: string }>(`/api/salla/questions/${id}` as string, { method: "PUT", authToken: token, body: JSON.stringify(payload) });
}

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
  return apiFetch<{ connected: boolean; username?: string; fullName?: string }>("/api/pinterest/account", { authToken: token });
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

