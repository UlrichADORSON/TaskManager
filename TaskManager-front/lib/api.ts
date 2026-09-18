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

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
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