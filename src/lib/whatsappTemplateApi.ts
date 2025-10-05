const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) {
    console.error('No auth_token found in localStorage');
    throw new Error('No authentication token found. Please login again.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Types
export interface WhatsappTemplate {
  id: number;
  userId: number;
  name: string;
  description?: string;
  headerText?: string;
  footerText?: string;
  isActive: boolean;
  triggerKeywords?: string[];
  displayOrder: number;
  buttons?: WhatsappTemplateButton[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappTemplateButton {
  id: number;
  templateId: number;
  parentButtonId?: number;
  buttonText: string;
  buttonType: 'reply' | 'url' | 'phone' | 'nested';
  responseText?: string;
  url?: string;
  phoneNumber?: string;
  displayOrder: number;
  isActive: boolean;
  ChildButtons?: WhatsappTemplateButton[];
  createdAt: string;
  updatedAt: string;
}

// Template API functions
export const createTemplate = async (templateData: Partial<WhatsappTemplate>) => {
  try {
    const response = await fetch(`${API_BASE}/api/whatsapp-templates/templates`, {
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

export const getTemplates = async (isActive?: boolean) => {
  try {
    const params = isActive !== undefined ? `?isActive=${isActive}` : '';
    const response = await fetch(`${API_BASE}/api/whatsapp-templates/templates${params}`, {
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
  const response = await fetch(`${API_BASE}/api/whatsapp-templates/templates/${id}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  return await response.json();
};

export const updateTemplate = async (id: number, templateData: Partial<WhatsappTemplate>) => {
  const response = await fetch(`${API_BASE}/api/whatsapp-templates/templates/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(templateData)
  });
  return await response.json();
};

export const deleteTemplate = async (id: number) => {
  const response = await fetch(`${API_BASE}/api/whatsapp-templates/templates/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return await response.json();
};

// Button API functions
export const createButton = async (buttonData: Partial<WhatsappTemplateButton>) => {
  const response = await fetch(`${API_BASE}/api/whatsapp-templates/buttons`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(buttonData)
  });
  return await response.json();
};

export const updateButton = async (id: number, buttonData: Partial<WhatsappTemplateButton>) => {
  const response = await fetch(`${API_BASE}/api/whatsapp-templates/buttons/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(buttonData)
  });
  return await response.json();
};

export const deleteButton = async (id: number) => {
  const response = await fetch(`${API_BASE}/api/whatsapp-templates/buttons/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return await response.json();
};

export const getActiveTemplates = async () => {
  const response = await fetch(`${API_BASE}/api/whatsapp-templates/templates/active`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  return await response.json();
};