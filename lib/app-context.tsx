'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type {
  User, Project, AppNotification, Subtask, Message, SubtaskStatus,
  ProjectStatus, Channel, Attachment, ModificationRequest, ModificationStatus,
  ModificationTarget,
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
  addProjectMember: (projectId: string, employeeId: string) => void;
  removeProjectMember: (projectId: string, userId: string) => void;
  addSubtask: (projectId: string, data: Omit<Subtask, 'id' | 'projectId' | 'progress' | 'attachments' | 'createdAt' | 'isActive' | 'activeSessions'>) => void;
  updateSubtaskStatus: (projectId: string, subtaskId: string, status: SubtaskStatus) => void;
  approveSubtask: (projectId: string, subtaskId: string) => void;
  assignSubtask: (projectId: string, subtaskId: string, employeeId: string | null) => void;
  toggleTaskActive: (projectId: string, subtaskId: string) => void;
  suggestModification: (data: SuggestModificationData) => void;
  reviewModification: (projectId: string, modificationId: string, decision: 'approved' | 'rejected', note: string) => void;
  sendMessage: (channelId: string, content: string, attachments?: Attachment[]) => void;
  addEmployee: (data: { name: string; email: string; jobTitle: string; phone: string; role: 'employee' | 'manager'; avatarUrl?: string; availability?: 'available' | 'busy' | 'unavailable'; company?: string; address?: string; bio?: string }) => void;
  updateProfile: (data: { name?: string; email?: string; phone?: string; company?: string; address?: string; bio?: string; jobTitle?: string; avatarUrl?: string }) => void;
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

  // Restore session from localStorage (frontend-only persistence)
  useEffect(() => {
    try {
      const id = window.localStorage.getItem(SESSION_KEY);
      if (id) {
        const user = users.find((u) => u.id === id);
        if (user) setCurrentUser(user);
      }
    } catch {
      // storage unavailable (private mode, etc.)
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
      // ignore storage errors
    }
    return true;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore storage errors
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
      channels: [],
      modifications: [],
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
            members: [...p.members.filter((m) => m.role !== 'manager'), { userId: managerId, role: 'manager' as const, joinedAt: new Date().toISOString() }],
          }
        : p
    ));
    setNotifications((prev) => [
      { id: `n-${Date.now()}`, userId: managerId, type: 'subtask_assigned', title: 'Projet assigné', message: `Un nouveau projet vous a été assigné.`, projectId, read: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  // ---- Member management
  const addProjectMember: AppState['addProjectMember'] = useCallback((projectId, employeeId) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      if (p.members.some((m) => m.userId === employeeId)) return p;
      const emp = users.find((u) => u.id === employeeId);
      return {
        ...p,
        members: [...p.members, { userId: employeeId, role: (emp?.role ?? 'employee') as 'employee' | 'manager', joinedAt: new Date().toISOString() }],
      };
    }));
    setNotifications((prev) => [
      { id: `n-${Date.now()}`, userId: employeeId, type: 'member_added', title: 'Ajouté à un projet', message: `Vous avez été ajouté à un projet.`, projectId, read: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, [users]);

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
      createdAt: new Date().toISOString(),
      isActive: false,
      activeSessions: [],
    };
    setProjects((prev) => prev.map((p) =>
      p.id === projectId
        ? {
            ...p,
            status: p.status === 'assigned' ? ('in_progress' as ProjectStatus) : p.status,
            subtasks: [...p.subtasks, newSubtask],
            members: data.assignedToId && !p.members.some((m) => m.userId === data.assignedToId)
              ? [...p.members, { userId: data.assignedToId, role: 'employee' as const, joinedAt: new Date().toISOString() }]
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
      const updatedSubtasks = p.subtasks.map((st) =>
        st.id === subtaskId
          ? { ...st, status, progress: status === 'done' ? 100 : status === 'review' ? Math.max(st.progress, 85) : st.progress }
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
    // Notify manager/admin about status change
    const proj = projects.find((p) => p.id === projectId);
    const st = proj?.subtasks.find((s) => s.id === subtaskId);
    if (proj && st) {
      if (status === 'review') {
        const notifyIds = [proj.managerId, 'u-admin-1'].filter((id): id is string => !!id && id !== currentUser?.id);
        notifyIds.forEach((uid) => {
          setNotifications((prev) => [
            { id: `n-${Date.now()}-${uid}`, userId: uid, type: 'subtask_reviewed', title: 'Sous-tâche à valider', message: `« ${st.title} » est terminée et attend votre validation.`, projectId, read: false, createdAt: new Date().toISOString() },
            ...prev,
          ]);
        });
      } else {
        const notifyIds = [proj.managerId, 'u-admin-1'].filter((id): id is string => !!id && id !== currentUser?.id);
        notifyIds.forEach((uid) => {
          setNotifications((prev) => [
            { id: `n-${Date.now()}-${uid}`, userId: uid, type: 'project_completed', title: 'Tâche mise à jour', message: `La tâche « ${st.title} » est maintenant « ${status} ».`, projectId, read: false, createdAt: new Date().toISOString() },
            ...prev,
          ]);
        });
      }
    }
  }, [projects, currentUser]);

  const approveSubtask: AppState['approveSubtask'] = useCallback((projectId, subtaskId) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      const updatedSubtasks = p.subtasks.map((st) =>
        st.id === subtaskId
          ? { ...st, status: 'done' as SubtaskStatus, progress: 100, isActive: false }
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
          ? [...p.members, { userId: employeeId, role: 'employee' as const, joinedAt: new Date().toISOString() }]
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

  // ---- Pause / Resume task
  const toggleTaskActive: AppState['toggleTaskActive'] = useCallback((projectId, subtaskId) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        subtasks: p.subtasks.map((st) => {
          if (st.id !== subtaskId) return st;
          if (st.isActive) {
            // Pause: close the current session
            const sessions = st.activeSessions.map((s) =>
              s.endTime === null ? { ...s, endTime: new Date().toISOString() } : s
            );
            return { ...st, isActive: false, activeSessions: sessions };
          } else {
            // Resume: start a new session
            const newSession = { id: `ts-${Date.now()}`, startTime: new Date().toISOString(), endTime: null };
            return {
              ...st,
              isActive: true,
              activeSessions: [...st.activeSessions, newSession],
              status: st.status === 'todo' ? 'in_progress' as SubtaskStatus : st.status,
            };
          }
        }),
      };
    }));
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
      // If approved, apply the change
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
    // Notify the requester
    const proj = projects.find((p) => p.id === projectId);
    const mod = proj?.modifications.find((m) => m.id === modificationId);
    if (mod) {
      setNotifications((prev) => [
        { id: `n-${Date.now()}`, userId: mod.requestedById, type: 'modification_reviewed', title: decision === 'approved' ? 'Modification approuvée' : 'Modification rejetée', message: `Votre demande de modification (${mod.field}) a été ${decision === 'approved' ? 'approuvée' : 'rejetée'}.`, projectId, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
  }, [currentUser, projects]);

  // ---- Messaging
  const sendMessage: AppState['sendMessage'] = useCallback((channelId, content, attachments = []) => {
    if (!currentUser) return;
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      channelId,
      authorId: currentUser.id,
      content,
      attachments,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => {
      const ch = p.channels.find((c) => c.id === channelId);
      if (!ch) return p;
      return {
        ...p,
        channels: p.channels.map((c) =>
          c.id === channelId ? { ...c, messages: [...c.messages, newMessage] } : c
        ),
      };
    }));
    // Notify all channel participants except sender
    const proj = projects.find((p) => p.channels.some((c) => c.id === channelId));
    const ch = proj?.channels.find((c) => c.id === channelId);
    if (ch && proj) {
      ch.participants.forEach((p) => {
        if (p.userId === currentUser.id) return;
        setNotifications((prev) => [
          { id: `n-${Date.now()}-${p.userId}`, userId: p.userId, type: 'new_message', title: 'Nouveau message', message: `${currentUser.name}: ${content.slice(0, 60)}`, projectId: proj.id, read: false, createdAt: new Date().toISOString() },
          ...prev,
        ]);
      });
    }
  }, [currentUser, projects]);

  // ---- Employee management
  const addEmployee: AppState['addEmployee'] = useCallback((data) => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=b6e3f4`,
      jobTitle: data.jobTitle,
      availability: data.availability ?? 'available',
      workload: 0,
      phone: data.phone,
      company: data.company,
      address: data.address,
      bio: data.bio,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
  }, []);

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
    addEmployee, updateProfile,
    sendMessage, markNotificationRead, markAllNotificationsRead,
  }), [currentUser, sessionInitialized, login, logout, users, projects, notifications,
       submitProject, validateProject, rejectProject, assignManager,
       addProjectMember, removeProjectMember,
addSubtask, updateSubtaskStatus, approveSubtask, assignSubtask, toggleTaskActive,
       suggestModification, reviewModification,
       addEmployee, updateProfile,
       sendMessage, markNotificationRead, markAllNotificationsRead]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
