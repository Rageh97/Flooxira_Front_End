const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const authHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('No authentication token');
  return { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export interface ChatEscalation {
  id: number;
  userId: number;
  contactNumber: string;
  contactName: string | null;
  status: 'pending' | 'resolved';
  escalationReason: string | null;
  resolvedAt: string | null;
  resolvedBy: number | null;
  notificationSent: boolean;
  escalationMessage: string | null;
  createdAt: string;
  updatedAt: string;
  resolver?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface EscalationStats {
  pending: number;
  resolved: number;
  today: number;
  total: number;
}

// Get all escalated chats
export async function getEscalatedChats(status?: 'pending' | 'resolved'): Promise<{ 
  success: boolean; 
  data: ChatEscalation[]; 
  message?: string 
}> {
  const params = status ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/api/escalation${params}`, {
    method: 'GET',
    headers: authHeaders()
  });
  return res.json();
}

// Get pending escalation contacts for sidebar highlighting
export async function getPendingEscalationContacts(): Promise<{ 
  success: boolean; 
  contacts: string[];
  escalations: Array<{
    contactNumber: string;
    contactName: string | null;
    escalationReason: string | null;
    createdAt: string;
  }>;
  message?: string 
}> {
  const res = await fetch(`${API_BASE}/api/escalation/pending`, {
    method: 'GET',
    headers: authHeaders()
  });
  return res.json();
}

// Check if a specific contact has pending escalation
export async function checkContactEscalation(contactNumber: string): Promise<{ 
  success: boolean; 
  isEscalated: boolean;
  escalation: ChatEscalation | null;
  message?: string 
}> {
  const res = await fetch(`${API_BASE}/api/escalation/check/${encodeURIComponent(contactNumber)}`, {
    method: 'GET',
    headers: authHeaders()
  });
  return res.json();
}

// Manually escalate a chat to human
export async function escalateChat(data: {
  contactNumber: string;
  contactName?: string;
  reason?: string;
}): Promise<{ 
  success: boolean; 
  data: ChatEscalation;
  message?: string 
}> {
  const res = await fetch(`${API_BASE}/api/escalation/escalate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

// Resolve an escalation by ID
export async function resolveEscalation(escalationId: number): Promise<{ 
  success: boolean; 
  data: ChatEscalation;
  message?: string 
}> {
  const res = await fetch(`${API_BASE}/api/escalation/resolve/${escalationId}`, {
    method: 'PUT',
    headers: authHeaders()
  });
  return res.json();
}

// Resolve escalation by contact number
export async function resolveEscalationByContact(contactNumber: string): Promise<{ 
  success: boolean; 
  data: ChatEscalation;
  message?: string 
}> {
  const res = await fetch(`${API_BASE}/api/escalation/resolve-contact/${encodeURIComponent(contactNumber)}`, {
    method: 'PUT',
    headers: authHeaders()
  });
  return res.json();
}

// Get escalation statistics
export async function getEscalationStats(): Promise<{ 
  success: boolean; 
  data: EscalationStats;
  message?: string 
}> {
  const res = await fetch(`${API_BASE}/api/escalation/stats`, {
    method: 'GET',
    headers: authHeaders()
  });
  return res.json();
}
