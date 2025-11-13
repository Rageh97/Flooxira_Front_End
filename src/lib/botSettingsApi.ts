const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const authHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('No authentication token');
  return { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const authHeadersFormData = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('No authentication token');
  return { 
    'Authorization': `Bearer ${token}`
  };
};

export interface BotSettings {
  id: number;
  userId: number;
  aiProvider: 'openai' | 'gemini' | 'both';
  openaiModel: string;
  geminiModel: string;
  temperature: number;
  maxTokens: number;
  personality: 'professional' | 'friendly' | 'casual' | 'formal' | 'marketing' | 'custom';
  language: 'arabic' | 'english' | 'both';
  dialect: 'saudi' | 'egyptian' | 'lebanese' | 'emirati' | 'kuwaiti' | 'qatari' | 'bahraini' | 'omani' | 'jordanian' | 'palestinian' | 'syrian' | 'iraqi' | 'standard';
  tone: 'formal' | 'informal' | 'mixed';
  responseLength: 'short' | 'medium' | 'long';
  includeEmojis: boolean;
  includeGreetings: boolean;
  includeFarewells: boolean;
  businessName?: string;
  businessType?: string;
  businessDescription?: string;
  targetAudience?: string;
  systemPrompt?: string;
  greetingPrompt?: string;
  farewellPrompt?: string;
  salesPrompt?: string;
  objectionHandlingPrompt?: string;
  // WhatsApp welcome auto message settings
  welcomeAutoMessageEnabled?: boolean;
  welcomeAutoMessageTemplate?: string;
  enableContextMemory: boolean;
  contextWindow: number;
  enableFallback: boolean;
  fallbackMessage?: string;
  trackConversations: boolean;
  trackPerformance: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalityTemplate {
  name: string;
  description: string;
  systemPrompt: string;
  greetingPrompt: string;
  farewellPrompt: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

export interface AvailableModels {
  openai: ModelInfo[];
  gemini: ModelInfo[];
}

export interface TestResponse {
  testMessage: string;
  response: string;
  settings: {
    aiProvider: string;
    personality: string;
    dialect: string;
    temperature: number;
  };
}

// Get bot settings
export async function getBotSettings(): Promise<{ success: boolean; data: BotSettings; message?: string }> {
  const res = await fetch(`${API_BASE}/api/bot-settings`, {
    method: 'GET',
    headers: authHeaders()
  });
  return res.json();
}

// Update bot settings
export async function updateBotSettings(settings: Partial<BotSettings>): Promise<{ success: boolean; data: BotSettings; message?: string }> {
  const res = await fetch(`${API_BASE}/api/bot-settings`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(settings)
  });
  return res.json();
}

// Reset bot settings to default
export async function resetBotSettings(): Promise<{ success: boolean; data: BotSettings; message?: string }> {
  const res = await fetch(`${API_BASE}/api/bot-settings/reset`, {
    method: 'POST',
    headers: authHeaders()
  });
  return res.json();
}

// Test AI response
export async function testAIResponse(testMessage: string): Promise<{ success: boolean; data: TestResponse; message?: string }> {
  const res = await fetch(`${API_BASE}/api/bot-settings/test`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ testMessage })
  });
  return res.json();
}

// Get available AI models
export async function getAvailableModels(): Promise<{ success: boolean; data: AvailableModels; message?: string }> {
  const res = await fetch(`${API_BASE}/api/bot-settings/models`, {
    method: 'GET',
    headers: authHeaders()
  });
  return res.json();
}

// Get personality templates
export async function getPersonalityTemplates(): Promise<{ success: boolean; data: Record<string, PersonalityTemplate>; message?: string }> {
  const res = await fetch(`${API_BASE}/api/bot-settings/templates`, {
    method: 'GET',
    headers: authHeaders()
  });
  return res.json();
}

