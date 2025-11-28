import { apiFetch } from "./api";

export interface SystemLink {
  id: number;
  key: string;
  url: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAllLinks(token: string) {
  return apiFetch<{ success: boolean; links: SystemLink[] }>("/api/system-links", {
    authToken: token
  });
}

export async function getLinkByKey(key: string, token?: string) {
  return apiFetch<{ success: boolean; link: SystemLink }>(`/api/system-links/key/${key}`, {
    authToken: token
  });
}

export async function saveLink(token: string, data: { key: string; url: string; description?: string; isActive: boolean }) {
  return apiFetch<{ success: boolean; message: string; link: SystemLink }>("/api/system-links", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(data),
  });
}

export async function deleteLink(token: string, id: number) {
  return apiFetch<{ success: boolean; message: string }>(`/api/system-links/${id}`, {
    method: "DELETE",
    authToken: token,
  });
}
