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

export async function sendCampaignToTag(payload: { tagId: number; messageTemplate: string; throttleMs?: number }) {
  const res = await fetch(`${API_BASE}/api/campaigns/send-to-tag`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
  return res.json();
}

export async function getAllContacts() {
  const res = await fetch(`${API_BASE}/api/contacts`, { headers: authHeaders() });
  return res.json();
}



