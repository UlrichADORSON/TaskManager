// ============================================================
// Type definitions — mirror the shape of the future Laravel API
// ============================================================

export type Role = 'admin' | 'chef_de_projet' | 'client' | 'membre';

export type MemberSpecialty = 'Designer' | 'DevOps' | 'Frontend' | 'Backend' | 'Fullstack' | 'QA' | 'Chef de projet junior' | 'Autre';

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

// ------------------------------------ User
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  memberSpecialty?: MemberSpecialty;  // specialty for 'membre' role
  avatarUrl: string;
  password?: string;         // demo auth (frontend-only prototype)
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

// ------------------------------------ Subtask Comment (discussion per task)
export interface SubtaskComment {
  id: string;
  subtaskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

// ------------------------------------ Work session (pause/resume tracking)
export interface WorkSession {
  start: string;       // ISO when the session started
  end: string | null;  // null = session currently running
  duration: number;    // seconds (set when session ends)
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
  comments: SubtaskComment[];  // task-level comments
  isActive?: boolean;          // a work session is currently running (timer on)
  workSessions?: WorkSession[]; // completed + running sessions (elapsed time)
  createdAt: string;
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

// ------------------------------------ Project member
export interface ProjectMember {
  userId: string;
  role: Role;
  joinedAt: string;
}

// ------------------------------------ Calendar Event
export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  date: string;           // ISO date
  type: 'cadrage' | 'design' | 'developpement' | 'recette' | 'livraison' | 'rendez_vous' | 'deadline';
  description?: string;
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
  calendarEvents: CalendarEvent[];
  modifications: ModificationRequest[];
  // Submission detail fields
  platformUsers?: string;      // utilisateurs de la plateforme
  desiredFeatures?: string;    // fonctionnalités souhaitées
  necessaryPages?: string;     // pages nécessaires pour le projet
  plannedFeatures?: string;    // fonctionnalités prévues
  // Client meeting after framing
  clientMeeting?: { date: string; note: string } | null;
  createdAt: string;
}

// ------------------------------------ Notification
export interface AppNotification {
  id: string;
  userId: string;       // recipient
  type: 'project_submitted' | 'project_validated' | 'project_rejected'
      | 'subtask_assigned' | 'delay_detected'
      | 'project_completed' | 'modification_requested' | 'modification_reviewed'
      | 'member_added' | 'subtask_reviewed' | 'member_created' | 'calendar_event';
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
  search: string;
}

export interface SubtaskFilters {
  status: SubtaskStatus | 'all';
  priority: Priority | 'all';
  assignedToId: string | 'all';
  search: string;
}

export interface EmployeeFilters {
  specialty: MemberSpecialty | 'all';
  search: string;
}
