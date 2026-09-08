'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type {
  User, Project, AppNotification, Subtask, SubtaskStatus,
  ProjectStatus, Attachment, ModificationRequest, ModificationStatus,
  ModificationTarget, Role, CalendarEvent, MemberSpecialty,
} from '@/types';
import { mockUsers, mockProjects, mockNotifications } from '@/lib/mock-data';

interface SubmitProjectData {
  title: string;
  description: string;
  category: string;
  budget: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate: string;
  logoUrl?: string;
  attachments?: Attachment[];
  platformUsers?: string;
  desiredFeatures?: string;
  necessaryPages?: string;
  plannedFeatures?: string;
}

interface SuggestModificationData {
  projectId: string;
  subtaskId: string | null;
  target: ModificationTarget;
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

interface AppState {
  currentUser: User | null;
  sessionInitialized: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  users: User[];
  projects: Project[];
  notifications: AppNotification[];

  submitProject: (data: SubmitProjectData) => void;
  validateProject: (projectId: string) => void;
  rejectProject: (projectId: string, reason: string) => void;
  assignManager: (projectId: string, managerId: string) => void;
  addProjectMember: (projectId: string, data: { userId: string; role: Role }) => void;
  removeProjectMember: (projectId: string, userId: string) => void;
  addSubtask: (projectId: string, data: Omit<Subtask, 'id' | 'projectId' | 'progress' | 'attachments' | 'comments' | 'createdAt'>) => void;
  updateSubtaskStatus: (projectId: string, subtaskId: string, status: SubtaskStatus) => void;
  approveSubtask: (projectId: string, subtaskId: string) => void;
  assignSubtask: (projectId: string, subtaskId: string, employeeId: string | null) => void;
  toggleTaskActive: (projectId: string, subtaskId: string) => void;
  suggestModification: (data: SuggestModificationData) => void;
  reviewModification: (projectId: string, modificationId: string, decision: 'approved' | 'rejected', note: string) => void;
  addSubtaskComment: (projectId: string, subtaskId: string, content: string) => void;
  scheduleClientMeeting: (projectId: string, data: { date: string; note: string }) => void;
  addEmployee: (data: { name: string; email: string; password: string; phone: string; role: 'chef_de_projet' | 'membre'; memberSpecialty?: MemberSpecialty; avatarUrl?: string; company?: string; address?: string; bio?: string }) => void;
  updateUser: (userId: string, data: { name?: string; email?: string; phone?: string; company?: string; address?: string; bio?: string; role?: Role; memberSpecialty?: MemberSpecialty; password?: string; avatarUrl?: string }) => void;
  updateProfile: (data: { name?: string; email?: string; phone?: string; company?: string; address?: string; bio?: string; memberSpecialty?: MemberSpecialty; avatarUrl?: string }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppState | null>(null);

const SESSION_KEY = 'activeUserId';

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);

  useEffect(() => {
    try {
      const id = window.localStorage.getItem(SESSION_KEY);
      if (id) {
        const user = users.find((u) => u.id === id);
        if (user) setCurrentUser(user);
      }
    } catch {
      // storage unavailable
    } finally {
      setSessionInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const user = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!user) return false;
    setCurrentUser(user);
    try {
      window.localStorage.setItem(SESSION_KEY, user.id);
    } catch {
      // ignore
    }
    return true;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  // ---- Project actions
  const submitProject: AppState['submitProject'] = useCallback((data) => {
    const newProject: Project = {
      id: `p-${Date.now()}`,
      title: data.title,
      description: data.description,
      clientId: currentUser?.id ?? 'u-cli-1',
      status: 'pending',
      priority: data.priority,
      managerId: null,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      progress: 0,
      category: data.category,
      logoUrl: data.logoUrl,
      attachments: data.attachments ?? [],
      members: [{ userId: currentUser?.id ?? 'u-cli-1', role: 'client', joinedAt: new Date().toISOString() }],
      subtasks: [],
      progressTimeline: [],
      calendarEvents: [],
      modifications: [],
      platformUsers: data.platformUsers,
      desiredFeatures: data.desiredFeatures,
      necessaryPages: data.necessaryPages,
      plannedFeatures: data.plannedFeatures,
      clientMeeting: null,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);
    setNotifications((prev) => [
      { id: `n-${Date.now()}`, userId: 'u-admin-1', type: 'project_submitted', title: 'Nouveau projet soumis', message: `« ${data.title} » attend validation.`, projectId: newProject.id, read: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, [currentUser]);

  const validateProject: AppState['validateProject'] = useCallback((projectId) => {
    setProjects((prev) => prev.map((p) =>
      p.id === projectId ? { ...p, status: 'validated' as ProjectStatus } : p
    ));
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setNotifications((prev) => [
        { id: `n-${Date.now()}`, userId: proj.clientId, type: 'project_validated', title: 'Projet validé', message: `Votre projet « ${proj.title} » a été validé.`, projectId, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
  }, [projects]);

  const rejectProject: AppState['rejectProject'] = useCallback((projectId, reason) => {
    setProjects((prev) => prev.map((p) =>
      p.id === projectId ? { ...p, status: 'rejected' as ProjectStatus, rejectionReason: reason } : p
    ));
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setNotifications((prev) => [
        { id: `n-${Date.now()}`, userId: proj.clientId, type: 'project_rejected', title: 'Projet rejeté', message: `Votre projet « ${proj.title} » a été rejeté.`, projectId, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
  }, [projects]);

  const assignManager: AppState['assignManager'] = useCallback((projectId, managerId) => {
    setProjects((prev) => prev.map((p) =>
      p.id === projectId
        ? {
            ...p,
            status: 'assigned' as ProjectStatus,
            managerId,
            members: [...p.members.filter((m) => m.role !== 'chef_de_projet'), { userId: managerId, role: 'chef_de_projet' as const, joinedAt: new Date().toISOString() }],
          }
        : p
    ));
    setNotifications((prev) => [
      { id: `n-${Date.now()}`, userId: managerId, type: 'subtask_assigned', title: 'Projet assigné', message: `Un nouveau projet vous a été assigné.`, projectId, read: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  // ---- Member management
  const addProjectMember: AppState['addProjectMember'] = useCallback((projectId, data) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      if (p.members.some((m) => m.userId === data.userId)) return p;
      return {
        ...p,
        members: [...p.members, { userId: data.userId, role: data.role, joinedAt: new Date().toISOString() }],
      };
    }));
    setNotifications((prev) => [
      { id: `n-${Date.now()}`, userId: data.userId, type: 'member_added', title: 'Ajouté à un projet', message: `Vous avez été ajouté à un projet.`, projectId, read: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const removeProjectMember: AppState['removeProjectMember'] = useCallback((projectId, userId) => {
    setProjects((prev) => prev.map((p) =>
      p.id === projectId
        ? { ...p, members: p.members.filter((m) => m.userId !== userId) }
        : p
    ));
  }, []);

  // ---- Subtask actions
  const addSubtask: AppState['addSubtask'] = useCallback((projectId, data) => {
    const newSubtask: Subtask = {
      ...data,
      id: `st-${Date.now()}`,
      projectId,
      progress: 0,
      attachments: [],
      comments: [],
      isActive: false,
      workSessions: [],
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) =>
      p.id === projectId
        ? {
            ...p,
            status: p.status === 'assigned' ? ('in_progress' as ProjectStatus) : p.status,
            subtasks: [...p.subtasks, newSubtask],
            members: data.assignedToId && !p.members.some((m) => m.userId === data.assignedToId)
              ? [...p.members, { userId: data.assignedToId, role: 'membre' as const, joinedAt: new Date().toISOString() }]
              : p.members,
          }
        : p
    ));
    if (data.assignedToId) {
      const assignedId = data.assignedToId;
      setNotifications((prev) => [
        { id: `n-${Date.now()}`, userId: assignedId, type: 'subtask_assigned', title: 'Nouvelle sous-tâche', message: `Vous avez été assigné à « ${data.title} ».`, projectId, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
  }, []);

  const updateSubtaskStatus: AppState['updateSubtaskStatus'] = useCallback((projectId, subtaskId, status) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      const updatedSubtasks = p.subtasks.map((st) => {
        if (st.id !== subtaskId) return st;
        // Auto-close a running session when the task leaves the working state
        let next: Subtask = { ...st, status, progress: status === 'done' ? 100 : status === 'review' ? Math.max(st.progress, 85) : st.progress };
        if (st.isActive && status !== 'in_progress') {
          const endedAt = new Date().toISOString();
          next = {
            ...next,
            isActive: false,
            workSessions: (st.workSessions ?? []).map((s) =>
              s.end === null
                ? { ...s, end: endedAt, duration: Math.max(0, Math.round((Date.now() - new Date(s.start).getTime()) / 1000)) }
                : s
            ),
          };
        }
        return next;
      });
      const totalProgress = updatedSubtasks.length > 0
        ? Math.round(updatedSubtasks.reduce((acc, st) => acc + st.progress, 0) / updatedSubtasks.length)
        : 0;
      const isCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.status === 'done');
      return {
        ...p,
        subtasks: updatedSubtasks,
        progress: totalProgress,
        status: isCompleted ? ('completed' as ProjectStatus) : p.status,
      };
    }));
    const proj = projects.find((p) => p.id === projectId);
    const st = proj?.subtasks.find((s) => s.id === subtaskId);
    if (proj && st) {
      const notifyIds = [proj.managerId, 'u-admin-1'].filter((id): id is string => !!id && id !== currentUser?.id);
      const msgType = status === 'review' ? 'subtask_reviewed' : 'project_completed';
      notifyIds.forEach((uid) => {
        setNotifications((prev) => [
          { id: `n-${Date.now()}-${uid}`, userId: uid, type: msgType, title: status === 'review' ? 'Sous-tâche à valider' : 'Tâche mise à jour', message: status === 'review' ? `« ${st.title} » est terminée et attend votre validation.` : `La tâche « ${st.title} » est maintenant « ${status} ».`, projectId, read: false, createdAt: new Date().toISOString() },
          ...prev,
        ]);
      });
    }
  }, [projects, currentUser]);

  const approveSubtask: AppState['approveSubtask'] = useCallback((projectId, subtaskId) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      const updatedSubtasks = p.subtasks.map((st) =>
        st.id === subtaskId
          ? { ...st, status: 'done' as SubtaskStatus, progress: 100 }
          : st
      );
      const totalProgress = updatedSubtasks.length > 0
        ? Math.round(updatedSubtasks.reduce((acc, st) => acc + st.progress, 0) / updatedSubtasks.length)
        : 0;
      const isCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.status === 'done');
      return {
        ...p,
        subtasks: updatedSubtasks,
        progress: totalProgress,
        status: isCompleted ? ('completed' as ProjectStatus) : p.status,
      };
    }));
    const proj = projects.find((p) => p.id === projectId);
    const st = proj?.subtasks.find((s) => s.id === subtaskId);
    if (proj && st) {
      const notifyIds = [st.assignedToId, proj.clientId].filter((id): id is string => !!id && id !== currentUser?.id);
      notifyIds.forEach((uid) => {
        setNotifications((prev) => [
          { id: `n-${Date.now()}-${uid}`, userId: uid, type: 'subtask_reviewed', title: 'Sous-tâche validée', message: `Votre sous-tâche « ${st.title} » a été validée.`, projectId, read: false, createdAt: new Date().toISOString() },
          ...prev,
        ]);
      });
    }
  }, [projects, currentUser]);

  const assignSubtask: AppState['assignSubtask'] = useCallback((projectId, subtaskId, employeeId) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        subtasks: p.subtasks.map((st) => st.id === subtaskId ? { ...st, assignedToId: employeeId } : st),
        members: employeeId && !p.members.some((m) => m.userId === employeeId)
          ? [...p.members, { userId: employeeId, role: 'membre' as const, joinedAt: new Date().toISOString() }]
          : p.members,
      };
    }));
    if (employeeId && employeeId !== currentUser?.id) {
      const proj = projects.find((p) => p.id === projectId);
      const st = proj?.subtasks.find((s) => s.id === subtaskId);
      setNotifications((prev) => [
        { id: `n-${Date.now()}`, userId: employeeId, type: 'subtask_assigned', title: 'Tâche assignée', message: `Vous avez été assigné à « ${st?.title ?? 'une tâche'} ».`, projectId, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
  }, [projects, currentUser]);

  // ---- Pause / Resume task (kept for backward compat, simplified)
  const toggleTaskActive: AppState['toggleTaskActive'] = useCallback((projectId, subtaskId) => {
    const now = new Date();
    setProjects((prev) => prev.map((p) =>
      p.id === projectId
        ? {
            ...p,
            subtasks: p.subtasks.map((st) => {
              if (st.id !== subtaskId) return st;
              const sessions = st.workSessions ?? [];
              // Resume: start a new session
              if (!st.isActive) {
                return {
                  ...st,
                  isActive: true,
                  status: st.status === 'done' ? st.status : 'in_progress' as SubtaskStatus,
                  workSessions: [...sessions, { start: now.toISOString(), end: null, duration: 0 }],
                };
              }
              // Pause: close the running session
              const closed = sessions.map((s) =>
                s.end === null
                  ? { ...s, end: now.toISOString(), duration: Math.max(0, Math.round((now.getTime() - new Date(s.start).getTime()) / 1000)) }
                  : s
              );
              return {
                ...st,
                isActive: false,
                workSessions: closed,
              };
            }),
          }
        : p
    ));
  }, []);

  // ---- Modification requests
  const suggestModification: AppState['suggestModification'] = useCallback((data) => {
    if (!currentUser) return;
    const mod: ModificationRequest = {
      id: `mod-${Date.now()}`,
      projectId: data.projectId,
      subtaskId: data.subtaskId,
      target: data.target,
      requestedById: currentUser.id,
      requestedByName: currentUser.name,
      field: data.field,
      oldValue: data.oldValue,
      newValue: data.newValue,
      reason: data.reason,
      status: 'pending',
      reviewedById: null,
      reviewNote: '',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };
    setProjects((prev) => prev.map((p) =>
      p.id === data.projectId ? { ...p, modifications: [mod, ...p.modifications] } : p
    ));
    setNotifications((prev) => [
      { id: `n-${Date.now()}`, userId: 'u-admin-1', type: 'modification_requested', title: 'Demande de modification', message: `${currentUser.name} demande une modification sur ${data.target === 'project' ? 'le projet' : 'une sous-tâche'}.`, projectId: data.projectId, read: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, [currentUser]);

  const reviewModification: AppState['reviewModification'] = useCallback((projectId, modificationId, decision, note) => {
    if (!currentUser) return;
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      const mods = p.modifications.map((m) =>
        m.id === modificationId
          ? { ...m, status: decision as ModificationStatus, reviewedById: currentUser.id, reviewNote: note, reviewedAt: new Date().toISOString() }
          : m
      );
      let subtasks = p.subtasks;
      let projPatch: Partial<typeof p> = {};
      const mod = p.modifications.find((m) => m.id === modificationId);
      if (mod && decision === 'approved') {
        if (mod.subtaskId && mod.target === 'subtask') {
          subtasks = subtasks.map((st) => {
            if (st.id !== mod.subtaskId) return st;
            if (mod.field === 'title') return { ...st, title: mod.newValue };
            if (mod.field === 'description') return { ...st, description: mod.newValue };
            if (mod.field === 'dueDate') return { ...st, dueDate: new Date(mod.newValue).toISOString() };
            if (mod.field === 'priority') return { ...st, priority: mod.newValue as Subtask['priority'] };
            return st;
          });
        } else if (mod.target === 'project') {
          if (mod.field === 'title') projPatch.title = mod.newValue;
          else if (mod.field === 'description') projPatch.description = mod.newValue;
          else if (mod.field === 'endDate') projPatch.endDate = new Date(mod.newValue).toISOString();
          else if (mod.field === 'priority') projPatch.priority = mod.newValue as Project['priority'];
          else if (mod.field === 'budget') projPatch.budget = parseInt(mod.newValue) || 0;
        }
      }
      return { ...p, ...projPatch, modifications: mods, subtasks };
    }));
    const proj = projects.find((p) => p.id === projectId);
    const mod = proj?.modifications.find((m) => m.id === modificationId);
    if (mod) {
      setNotifications((prev) => [
        { id: `n-${Date.now()}`, userId: mod.requestedById, type: 'modification_reviewed', title: decision === 'approved' ? 'Modification approuvée' : 'Modification rejetée', message: `Votre demande de modification (${mod.field}) a été ${decision === 'approved' ? 'approuvée' : 'rejetée'}.`, projectId, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
  }, [currentUser, projects]);

  // ---- Task comments
  const addSubtaskComment: AppState['addSubtaskComment'] = useCallback((projectId, subtaskId, content) => {
    if (!currentUser || !content.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      subtaskId,
      authorId: currentUser.id,
      content,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) =>
      p.id === projectId
        ? {
            ...p,
            subtasks: p.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, comments: [...st.comments, newComment] } : st
            ),
          }
        : p
    ));
  }, [currentUser]);

  // ---- Client meeting (post-framing report)
  const scheduleClientMeeting: AppState['scheduleClientMeeting'] = useCallback((projectId, data) => {
    setProjects((prev) => prev.map((p) =>
      p.id === projectId ? { ...p, clientMeeting: { date: data.date, note: data.note } } : p
    ));
    setNotifications((prev) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return prev;
      return [
        { id: `n-${Date.now()}`, userId: project.clientId, type: 'calendar_event', title: 'Rendez-vous client planifié', message: `Un rendez-vous de rapport a été planifié pour votre projet « ${project.title} ».`, projectId, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ];
    });
  }, [projects]);

  // ---- Employee / member management
  const addEmployee: AppState['addEmployee'] = useCallback((data) => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      memberSpecialty: data.memberSpecialty,
      avatarUrl: data.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=b6e3f4`,
      password: data.password,
      phone: data.phone,
      company: data.company,
      address: data.address,
      bio: data.bio,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
  }, []);

  // Admin-only: update any user's info
  const updateUser: AppState['updateUser'] = useCallback((userId, data) => {
    if (currentUser?.role !== 'admin') return;
    setUsers((prev) => prev.map((u) =>
      u.id === userId ? { ...u, ...data } : u
    ));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, ...data } : prev);
    }
  }, [currentUser]);

  const updateProfile: AppState['updateProfile'] = useCallback((data) => {
    if (!currentUser) return;
    setUsers((prev) => prev.map((u) =>
      u.id === currentUser.id ? { ...u, ...data } : u
    ));
    setCurrentUser((prev) => prev ? { ...prev, ...data } : prev);
  }, [currentUser]);

  // ---- Notifications
  const markNotificationRead: AppState['markNotificationRead'] = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead: AppState['markAllNotificationsRead'] = useCallback(() => {
    setNotifications((prev) => prev.map((n) => n.read ? n : { ...n, read: true }));
  }, []);

  const value = useMemo<AppState>(() => ({
    currentUser, sessionInitialized, login, logout,
    users, projects, notifications,
    submitProject, validateProject, rejectProject, assignManager,
    addProjectMember, removeProjectMember,
    addSubtask, updateSubtaskStatus, approveSubtask, assignSubtask, toggleTaskActive,
    suggestModification, reviewModification,
    addSubtaskComment,
    scheduleClientMeeting,
    addEmployee, updateUser, updateProfile,
    markNotificationRead, markAllNotificationsRead,
  }), [currentUser, sessionInitialized, login, logout, users, projects, notifications,
       submitProject, validateProject, rejectProject, assignManager,
       addProjectMember, removeProjectMember,
       addSubtask, updateSubtaskStatus, approveSubtask, assignSubtask, toggleTaskActive,
       suggestModification, reviewModification,
       addSubtaskComment,
       scheduleClientMeeting,
       addEmployee, updateUser, updateProfile,
       markNotificationRead, markAllNotificationsRead]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
