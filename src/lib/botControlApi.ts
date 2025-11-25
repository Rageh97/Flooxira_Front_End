const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface BotStatus {
  isPaused: boolean;
  pausedUntil: string | null;
  timeRemaining: number; // in minutes
}

export interface BotControlResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Get bot status
export async function getBotStatus(): Promise<{ success: boolean; data: BotStatus; message?: string }> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/api/bot-control/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

// Pause bot
export async function pauseBot(minutes: number = 30): Promise<BotControlResponse> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/api/bot-control/pause`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ minutes }),
  });
  return response.json();
}

// Resume bot
export async function resumeBot(): Promise<BotControlResponse> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/api/bot-control/resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}


