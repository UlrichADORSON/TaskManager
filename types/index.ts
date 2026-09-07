// ============================================================
// Type definitions — mirror the shape of the future Laravel API
// ============================================================

export type Role = 'client' | 'admin' | 'manager' | 'employee';

export type ProjectStatus =
  | 'pending'      // En attente
  | 'validated'    // Validé
  | 'rejected'     // Rejeté
  | 'assigned'     // Assigné
  | 'in_progress'  // En cours
  | 'completed';   // Terminé

export type SubtaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type ModificationStatus = 'pending' | 'approved' | 'rejected';

export type ModificationTarget = 'subtask' | 'project';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ChannelType = 'client_admin' | 'project_group';

// ------------------------------------ User
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  jobTitle?: string;        // for employees / managers
  availability?: 'available' | 'busy' | 'unavailable';
  workload?: number;        // 0-100 percentage (employees)
  phone?: string;
  company?: string;         // for clients
  address?: string;
  bio?: string;
  createdAt: string;        // ISO
}

// ------------------------------------ Attachment
export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;         // mime type
  url: string;
  uploadedBy: string;       // user id
  uploadedAt: string;       // ISO
}

// ------------------------------------ Subtask
export interface Subtask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: SubtaskStatus;
  priority: Priority;
  assignedToId: string | null;
  dependsOnId: string | null;  // dependency on another subtask
  startDate: string;           // ISO
  dueDate: string;             // ISO
  progress: number;            // 0-100
  attachments: Attachment[];
  createdAt: string;
  isActive: boolean;           // employee is currently working on it (pause/resume)
  activeSessions: TaskSession[]; // work sessions for time tracking
}

// ------------------------------------ Task work session (pause/resume)
export interface TaskSession {
  id: string;
  startTime: string;     // ISO
  endTime: string | null; // null = still running
}

// ------------------------------------ Modification request
export interface ModificationRequest {
  id: string;
  projectId: string;
  subtaskId: string | null;   // null = project-level modification
  target: ModificationTarget;
  requestedById: string;
  requestedByName: string;
  field: string;              // which field is being modified
  oldValue: string;
  newValue: string;
  reason: string;
  status: ModificationStatus;
  reviewedById: string | null;
  reviewNote: string;
  createdAt: string;
  reviewedAt: string | null;
}

// ------------------------------------ Progress timeline point (for the curve chart)
export interface ProgressPoint {
  date: string;          // ISO date
  planned: number;       // %
  actual: number;        // %
}

// ------------------------------------ Channel participant
export interface ChannelParticipant {
  userId: string;
  role: Role;
}

// ------------------------------------ Message
export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  attachments: Attachment[];
  createdAt: string;
}

// ------------------------------------ Channel
export interface Channel {
  id: string;
  projectId: string;
  type: ChannelType;
  name: string;
  participants: ChannelParticipant[];
  messages: Message[];
}

// ------------------------------------ Project member
export interface ProjectMember {
  userId: string;
  role: Role;
  joinedAt: string;
}

// ------------------------------------ Project
export interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  status: ProjectStatus;
  priority: Priority;
  managerId: string | null;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;            // auto-calculated from subtasks
  rejectionReason?: string;
  category: string;
  logoUrl?: string;
  attachments: Attachment[];   // files attached during submission
  members: ProjectMember[];
  subtasks: Subtask[];
  progressTimeline: ProgressPoint[];
  channels: Channel[];
  modifications: ModificationRequest[];
  createdAt: string;
}

// ------------------------------------ Notification
export interface AppNotification {
  id: string;
  userId: string;       // recipient
  type: 'project_submitted' | 'project_validated' | 'project_rejected'
      | 'subtask_assigned' | 'new_message' | 'delay_detected'
      | 'project_completed' | 'modification_requested' | 'modification_reviewed'
      | 'member_added' | 'subtask_reviewed';
  title: string;
  message: string;
  projectId?: string;
  read: boolean;
  createdAt: string;
}

// ------------------------------------ Filter / sort
export interface ProjectFilters {
  status: ProjectStatus | 'all';
  priority: Priority | 'all';
  managerId: string | 'all';
  search: string;
}

export interface SubtaskFilters {
  status: SubtaskStatus | 'all';
  priority: Priority | 'all';
  assignedToId: string | 'all';
  search: string;
}

export interface EmployeeFilters {
  jobTitle: string | 'all';
  availability: 'available' | 'busy' | 'unavailable' | 'all';
  search: string;
}
