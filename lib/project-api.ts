import type { CalendarEvent, Project, ProjectMember, ProjectStatus, Priority } from '@/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const TOKEN_KEY = 'taskManagerJwt';

export function getApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setApiToken(token: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearApiToken() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = getApiToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const message = body?.message || body?.error || `Erreur API (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function loginApi(email: string, password: string) {
  const result = await request<{ token: string }>('/api/login_check', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setApiToken(result.token);
  return result;
}

export type ApiProject = {
  id: number;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  budget: number;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  category: string;
  createdAt: string | null;
  client?: { id: number; name: string; email: string } | null;
  manager?: { id: number; name: string; email: string } | null;
  members?: Array<{ userId: string; role: string; joinedAt: string }>;
};

export function mapApiProject(api: ApiProject, existing?: Project): Project {
  return {
    id: String(api.id),
    title: api.title,
    description: api.description || '',
    clientId: existing?.clientId || String(api.client?.id ?? ''),
    status: api.status,
    priority: api.priority,
    managerId: existing?.managerId || (api.manager ? String(api.manager.id) : null),
    startDate: api.startDate || existing?.startDate || new Date().toISOString(),
    endDate: api.endDate || existing?.endDate || new Date().toISOString(),
    budget: api.budget ?? 0,
    progress: api.progress ?? 0,
    category: api.category || '',
    logoUrl: existing?.logoUrl,
    attachments: existing?.attachments ?? [],
    members: (api.members as ProjectMember[] | undefined) ?? existing?.members ?? [],
    subtasks: existing?.subtasks ?? [],
    progressTimeline: existing?.progressTimeline ?? [],
    calendarEvents: existing?.calendarEvents ?? [],
    modifications: existing?.modifications ?? [],
    taskRequests: existing?.taskRequests ?? [],
    requetes: existing?.requetes ?? [],
    platformUsers: existing?.platformUsers,
    desiredFeatures: existing?.desiredFeatures,
    necessaryPages: existing?.necessaryPages,
    plannedFeatures: existing?.plannedFeatures,
    clientMeeting: existing?.clientMeeting ?? null,
    createdAt: api.createdAt || existing?.createdAt || new Date().toISOString(),
  };
}

export const projectApi = {
  list: () => request<ApiProject[]>('/api/projects'),
  create: (data: Record<string, unknown>) => request<ApiProject>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  validate: (id: string) => request<any>(`/api/projects/${id}/validate`, { method: 'POST', body: JSON.stringify({}) }),
  reject: (id: string, reason: string) => request<any>(`/api/projects/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  assign: (id: string, managerId: string) => request<any>(`/api/projects/${id}/assign`, { method: 'POST', body: JSON.stringify({ managerId }) }),
  updateStatus: (id: string, status: ProjectStatus) => request<any>(`/api/projects/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  addMember: (id: string, data: { userId: string; role: string }) => request<any>(`/api/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
  removeMember: (id: string, userId: string) => request<any>(`/api/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  events: (id: string) => request<CalendarEvent[]>(`/api/projects/${id}/events`),
  createEvent: (id: string, data: { title: string; date: string; type: string; description?: string }) => request<CalendarEvent>(`/api/projects/${id}/events`, { method: 'POST', body: JSON.stringify(data) }),
};
