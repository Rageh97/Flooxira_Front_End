import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface IslamicQuote {
  id: number;
  content: string;
  type: 'ayah' | 'hadith';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getAllIslamicQuotes = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.get(`${API_BASE_URL}/api/islamic-quotes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getActiveIslamicQuotes = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.get(`${API_BASE_URL}/api/islamic-quotes/active`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createIslamicQuote = async (data: Partial<IslamicQuote>) => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.post(`${API_BASE_URL}/api/islamic-quotes`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateIslamicQuote = async (id: number, data: Partial<IslamicQuote>) => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.put(`${API_BASE_URL}/api/islamic-quotes/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteIslamicQuote = async (id: number) => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.delete(`${API_BASE_URL}/api/islamic-quotes/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
