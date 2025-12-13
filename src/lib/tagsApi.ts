const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const authHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('No authentication token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
};

export async function listTags() {
  const res = await fetch(`${API_BASE}/api/tags`, { headers: authHeaders() });
  return res.json();
}

export async function createTag(payload: { name: string; color?: string }) {
  const res = await fetch(`${API_BASE}/api/tags`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
  return res.json();
}

export async function updateTag(id: number, payload: { name?: string; color?: string }) {
  const res = await fetch(`${API_BASE}/api/tags/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
  return res.json();
}

export async function deleteTag(id: number) {
  const res = await fetch(`${API_BASE}/api/tags/${id}`, { method: 'DELETE', headers: authHeaders() });
  return res.json();
}

export async function addContactToTag(tagId: number, payload: { contactNumber: string; contactName?: string }) {
  const res = await fetch(`${API_BASE}/api/tags/${tagId}/contacts`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
  return res.json();
}

export async function removeContactFromTag(tagId: number, payload: { contactNumber: string }) {
  const res = await fetch(`${API_BASE}/api/tags/${tagId}/contacts`, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify(payload) });
  return res.json();
}

export async function listContactsByTag(tagId: number) {
  const res = await fetch(`${API_BASE}/api/tags/${tagId}/contacts`, { headers: authHeaders() });
  return res.json();
}

export async function sendCampaignToTag(payload: { tagId: number; messageTemplate: string; throttleMs?: number; media?: File | null }) {
  const isFormData = !!payload.media;
  let body: BodyInit;
  let headers: HeadersInit = authHeaders();

  if (isFormData) {
    const form = new FormData();
    form.append('tagId', String(payload.tagId));
    form.append('messageTemplate', payload.messageTemplate);
    if (payload.throttleMs) form.append('throttleMs', String(payload.throttleMs));
    if (payload.media) form.append('media', payload.media);
    
    // Remove Content-Type header to let browser set boundary
    const { 'Content-Type': contentType, ...restHeaders } = headers as any;
    headers = restHeaders;
    body = form;
  } else {
    body = JSON.stringify(payload);
  }

  const res = await fetch(`${API_BASE}/api/campaigns/send-to-tag`, { 
    method: 'POST', 
    headers,
    body 
  });
  return res.json();
}

export async function getAllContacts() {
  const res = await fetch(`${API_BASE}/api/contacts`, { headers: authHeaders() });
  return res.json();
}



