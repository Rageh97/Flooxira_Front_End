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

// WhatsApp Business API
export type WabaStatus = { phoneNumberId: string; phoneNumber?: string; wabaId?: string; isActive: boolean; lastSyncAt?: string };

export async function getWhatsAppStatus(token: string) {
  return apiFetch<WabaStatus>("/api/whatsapp/status", { authToken: token });
}

export async function uploadKnowledgeBase(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiFetch<{ message: string; entriesCount: number }>("/api/whatsapp/knowledge/upload", {
    method: "POST",
    authToken: token,
    body: formData,
    headers: {} // Let browser set Content-Type for FormData
  });
}

export async function getKnowledgeBase(token: string) {
  return apiFetch<{ entries: Array<{ id: number; keyword: string; answer: string; isActive: boolean }> }>("/api/whatsapp/knowledge", { authToken: token });
}

export async function deleteKnowledgeEntry(token: string, id: number) {
  return apiFetch<{ message: string }>(`/api/whatsapp/knowledge/${id}`, { method: "DELETE", authToken: token });
}

export async function sendWhatsAppMessage(token: string, to: string, text: string) {
  return apiFetch<{ success: boolean; data?: any }>("/api/whatsapp/send", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ to, text })
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
  return apiFetch<{ boards: Array<{ id: string; name: string }> }>("/api/pinterest/boards", { authToken: token });
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

