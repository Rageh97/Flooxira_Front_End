const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const authHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('No authentication token');
  return { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export type PromptCategory = 
  | 'system'
  | 'greeting'
  | 'farewell'
  | 'sales'
  | 'support'
  | 'objection_handling'
  | 'appointment'
  | 'general'
  | 'custom';

export interface AIPrompt {
  id: number;
  title: string;
  description?: string;
  category: PromptCategory;
  prompt: string;
  variables?: string[];
  isActive: boolean;
  isGlobal: boolean;
  usageCount: number;
  createdBy: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    name?: string;
    email: string;
  };
}

export interface AIPromptCreateData {
  title: string;
  description?: string;
  category: PromptCategory;
  prompt: string;
  variables?: string[];
  isActive?: boolean;
  isGlobal?: boolean;
  tags?: string[];
}

export interface AIPromptUpdateData extends Partial<AIPromptCreateData> {
  id: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Get all prompts with filters
export async function getAllPrompts(params?: {
  category?: PromptCategory;
  search?: string;
  isActive?: boolean;
  isGlobal?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AIPrompt>> {
  const queryParams = new URLSearchParams();
  
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
  if (params?.isGlobal !== undefined) queryParams.append('isGlobal', String(params.isGlobal));
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const queryString = queryParams.toString();
  const url = `${API_BASE}/api/ai-prompts${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch prompts');
  }
  
  return res.json();
}

// Get single prompt by ID
export async function getPromptById(id: number): Promise<SingleResponse<AIPrompt>> {
  const res = await fetch(`${API_BASE}/api/ai-prompts/${id}`, {
    method: 'GET',
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch prompt');
  }
  
  return res.json();
}

// Create new prompt
export async function createPrompt(data: AIPromptCreateData): Promise<SingleResponse<AIPrompt>> {
  const res = await fetch(`${API_BASE}/api/ai-prompts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create prompt');
  }
  
  return res.json();
}

// Update prompt
export async function updatePrompt(id: number, data: Partial<AIPromptCreateData>): Promise<SingleResponse<AIPrompt>> {
  const res = await fetch(`${API_BASE}/api/ai-prompts/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update prompt');
  }
  
  return res.json();
}

// Delete prompt
export async function deletePrompt(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/api/ai-prompts/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete prompt');
  }
  
  return res.json();
}

// Get prompts by category
export async function getPromptsByCategory(category: PromptCategory): Promise<{ success: boolean; data: AIPrompt[] }> {
  const res = await fetch(`${API_BASE}/api/ai-prompts/category/${category}`, {
    method: 'GET',
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch prompts');
  }
  
  return res.json();
}

// Increment usage count
export async function incrementPromptUsage(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/api/ai-prompts/${id}/increment-usage`, {
    method: 'POST',
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to increment usage');
  }
  
  return res.json();
}


