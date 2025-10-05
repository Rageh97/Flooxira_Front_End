const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const authHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('No authentication token');
  return { 'Authorization': `Bearer ${token}` };
};

export async function sendWhatsAppMedia(to: string, file: File, caption?: string) {
  const form = new FormData();
  form.append('to', to);
  if (caption) form.append('caption', caption);
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/whatsapp/media`, { method: 'POST', headers: authHeaders(), body: form });
  return res.json();
}




