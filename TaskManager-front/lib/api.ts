'use client';

import type { User, Project } from '@/types';

const API_BASE_URL = 'http://localhost:8000';

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setTokens(token: string, refreshToken: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE_URL}/api/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  setTokens(data.token, data.refresh_token);
  return data.token;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const refreshToken = typeof window !== 'undefined' ? window.localStorage.getItem(REFRESH_TOKEN_KEY) : null;

  const doFetch = (bearerToken: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        ...options.headers,
      },
    });

  let res = await doFetch(token);

  if (res.status === 401 && (token || refreshToken)) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  return res;
}

/**
 * Le back renvoie les rôles Symfony (ex: ["ROLE_ADMIN","ROLE_USER"]).
 * Le front attend un seul rôle métier (ex: "admin"). On convertit ici.
 */
function extractBusinessRole(roles: string[]): string {
  const businessRole = roles.find((r) => r !== 'ROLE_USER');
  if (!businessRole) return 'membre';
  return businessRole.replace('ROLE_', '').toLowerCase();
}

/**
 * Adapte la forme renvoyée par le back (BackendUser) vers le type `User` attendu par le front.
 */
export function mapBackendUserToFrontUser(backendUser: any) {
  const role = backendUser.role ?? extractBusinessRole(backendUser.roles ?? []);
  return {
    id: String(backendUser.id),
    name: backendUser.name,
    email: backendUser.email,
    role: role,
    memberSpecialty: backendUser.memberSpecialty ?? undefined,
    avatarUrl: backendUser.avatarUrl,
    phone: backendUser.phone ?? undefined,
    company: backendUser.company ?? undefined,
    address: backendUser.address ?? undefined,
    bio: backendUser.bio ?? undefined,
    createdAt: backendUser.createdAt,
  };
}

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/login_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  setTokens(data.token, data.refresh_token);
  return data;
}

export async function registerRequest(data: {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Échec de l'inscription" }));
    throw new Error(error.message || "Échec de l'inscription");
  }

  const response = await res.json();

  if (response.token && response.refresh_token) {
    setTokens(response.token, response.refresh_token);
  }

  return response;
}

export async function fetchMe() {
  const res = await apiFetch('/api/me');
  if (!res.ok) return null;
  const data = await res.json();
  return mapBackendUserToFrontUser(data);
}

export async function fetchUsers(): Promise<User[]> {
  const res = await apiFetch('/api/users');
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((u: any) => mapBackendUserToFrontUser(u));
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await apiFetch('/api/projects');
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((p: any) => mapBackendProjectToFrontProject(p));
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${API_BASE_URL}/api/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Erreur lors de la demande de réinitialisation");
  }

  return data;
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Erreur lors de la réinitialisation");
  }

  return data;
}

function mapBackendProjectToFrontProject(backendProject: any): Project {
  return {
    id: String(backendProject.id),
    title: backendProject.title,
    description: backendProject.description,
    clientId: String(backendProject.client?.id ?? backendProject.clientId ?? ''),
    status: backendProject.status,
    priority: backendProject.priority,
    managerId: backendProject.manager ? String(backendProject.manager.id) : (backendProject.managerId ? String(backendProject.managerId) : null),
    startDate: backendProject.startDate ?? new Date().toISOString(),
    endDate: backendProject.endDate ?? new Date().toISOString(),
    budget: backendProject.budget ?? 0,
    progress: backendProject.progress ?? 0,
    category: backendProject.category ?? '',
    attachments: [],
    members: (backendProject.members ?? []).map((m: any) => ({
      userId: String(m.userId),
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    subtasks: [],
    progressTimeline: [],
    calendarEvents: [],
    modifications: [],
    createdAt: backendProject.createdAt ?? new Date().toISOString(),
  };
}