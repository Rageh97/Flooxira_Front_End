import { apiFetch } from './api';

type FetchOptions = RequestInit & { authToken?: string };

export async function uploadFile(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  // We need to use apiFetch from ./api but it's not exported directly to use here easily if I want to avoid circular deps or just reuse logic.
  // Actually I imported apiFetch from ./api.
  return apiFetch<{ url: string; public_id: string; resource_type: string }>('/api/uploads', {
    method: 'POST',
    body: formData,
    authToken: token
  });
}

export interface Banner {
  id: number;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  buttonText?: string;
  backgroundColor: string;
  textColor: string;
  duration: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewsTicker {
  id: number;
  content: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// --- Banners ---

export async function getAllBanners() {
  return apiFetch<{ success: boolean; banners: Banner[] }>('/api/settings/banners');
}

export async function createBanner(data: Partial<Banner>, token: string) {
  return apiFetch<{ success: boolean; banner: Banner }>('/api/settings/banners', {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function updateBanner(id: number, data: Partial<Banner>, token: string) {
  return apiFetch<{ success: boolean; banner: Banner }>(`/api/settings/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function deleteBanner(id: number, token: string) {
  return apiFetch<{ success: boolean }>(`/api/settings/banners/${id}`, {
    method: 'DELETE',
    authToken: token
  });
}

// --- News Tickers ---

export async function getAllNewsTickers() {
  return apiFetch<{ success: boolean; tickers: NewsTicker[] }>('/api/settings/news-tickers');
}

export async function createNewsTicker(data: Partial<NewsTicker>, token: string) {
  return apiFetch<{ success: boolean; ticker: NewsTicker }>('/api/settings/news-tickers', {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function updateNewsTicker(id: number, data: Partial<NewsTicker>, token: string) {
  return apiFetch<{ success: boolean; ticker: NewsTicker }>(`/api/settings/news-tickers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function deleteNewsTicker(id: number, token: string) {
  return apiFetch<{ success: boolean }>(`/api/settings/news-tickers/${id}`, {
    method: 'DELETE',
    authToken: token
  });
}
