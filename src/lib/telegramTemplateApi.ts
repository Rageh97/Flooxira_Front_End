const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export interface TelegramTemplate {
  id: number;
  userId: number;
  name: string;
  description?: string;
  headerText?: string;
  bodyText: string;
  footerText?: string;
  triggerKeywords: string[];
  displayOrder: number;
  isActive: boolean;
  templateType: 'text' | 'media' | 'poll' | 'quiz';
  mediaType?: 'photo' | 'video' | 'document' | 'audio' | 'voice';
  mediaUrl?: string;
  pollOptions?: string[];
  pollType?: 'regular' | 'quiz';
  correctAnswer?: number;
  explanation?: string;
  buttons?: TelegramTemplateButton[];
  variables?: TelegramTemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface TelegramTemplateButton {
  id: number;
  templateId: number;
  parentButtonId?: number;
  text: string;
  buttonType: 'url' | 'callback' | 'switch_inline' | 'switch_inline_current' | 'web_app';
  url?: string;
  callbackData?: string;
  webAppUrl?: string;
  switchInlineQuery?: string;
  displayOrder: number;
  isActive: boolean;
  mediaType?: 'photo' | 'video' | 'document' | 'audio' | 'voice';
  mediaUrl?: string;
  ChildButtons?: TelegramTemplateButton[];
  createdAt: string;
  updatedAt: string;
}

export interface TelegramTemplateVariable {
  id: number;
  templateId: number;
  variableName: string;
  variableType: 'text' | 'number' | 'date' | 'boolean' | 'select';
  defaultValue?: string;
  isRequired: boolean;
  options?: string[];
  placeholder?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramTemplateUsage {
  id: number;
  templateId: number;
  userId: number;
  chatId: string;
  messageId?: string;
  variables?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStats {
  totalUsage: number;
  successCount: number;
  errorCount: number;
  recentUsage: TelegramTemplateUsage[];
}

// Template CRUD operations
export const createTemplate = async (templateData: Partial<TelegramTemplate>) => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-templates/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Create template error:', error);
    throw error;
  }
};

export const getTemplates = async (filters?: {
  isActive?: boolean;
  templateType?: string;
  search?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.templateType) params.append('templateType', filters.templateType);
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = `${API_BASE}/api/telegram-templates/templates${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get templates error:', error);
    throw error;
  }
};

export const getTemplate = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-templates/templates/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get template error:', error);
    throw error;
  }
};

export const updateTemplate = async (id: number, templateData: Partial<TelegramTemplate>) => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-templates/templates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Update template error:', error);
    throw error;
  }
};

export const deleteTemplate = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-templates/templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Delete template error:', error);
    throw error;
  }
};

export const getActiveTemplates = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-templates/templates/active`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get active templates error:', error);
    throw error;
  }
};

export const getTemplateStats = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-templates/templates/${id}/stats`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get template stats error:', error);
    throw error;
  }
};

// Button operations
export const createButton = async (buttonData: Partial<TelegramTemplateButton>) => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-templates/buttons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(buttonData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Create button error:', error);
    throw error;
  }
};

export const updateButton = async (id: number, buttonData: Partial<TelegramTemplateButton>) => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-templates/buttons/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(buttonData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Update button error:', error);
    throw error;
  }
};

export const deleteButton = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-templates/buttons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Delete button error:', error);
    throw error;
  }
};

// Test template matching
export const testTemplateMatching = async (message: string) => {
  try {
    const response = await fetch(`${API_BASE}/api/telegram-bot/test-template`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Test template matching error:', error);
    throw error;
  }
};
