export const STUDENT_ID = 'student-1';
export const COINS_PER_SESSION = 50;

export type TaskStatus = 'not_started' | 'in_progress' | 'done';
export type FocusFailReason = 'give_up' | 'app_switch';
export type FocusSessionStatus = 'running' | 'completed' | 'failed';

export type MutationType =
  | 'FOCUS_SESSION_START'
  | 'FOCUS_SESSION_COMPLETE'
  | 'FOCUS_SESSION_FAIL'
  | 'TASK_STATUS_UPDATE'
  | 'TASK_DELETE';

export interface Mutation {
  id: string;
  type: MutationType;
  studentId: string;
  deviceId: string;
  lamport: number;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface Task {
  id: string;
  chapterId: string;
  title: string;
  status: TaskStatus;
  deleted: boolean;
  lamport: number;
  updatedByDeviceId: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  taskIds: string[];
}

export interface Subject {
  id: string;
  name: string;
  chapterIds: string[];
}

export interface FocusSession {
  id: string;
  studentId: string;
  deviceId: string;
  targetMinutes: number;
  status: FocusSessionStatus;
  failReason?: FocusFailReason;
  startedAt: string;
  endedAt?: string;
  lamport: number;
}

export interface StudentState {
  studentId: string;
  coins: number;
  streakDays: number;
  lastSuccessDate: string | null;
  todayFocusMinutes: number;
  todayFocusDate: string | null;
}

export interface NotificationLogEntry {
  sessionId: string;
  message: string;
  streakDays: number;
  coinsAwarded: number;
  receivedAt: string;
}

export interface DatabaseSnapshot {
  version: number;
  mutations: Record<string, Mutation>;
  tasks: Record<string, Task>;
  chapters: Record<string, Chapter>;
  subjects: Record<string, Subject>;
  focusSessions: Record<string, FocusSession>;
  student: StudentState;
  processedSessionRewards: Record<string, { coins: number; streakDays: number; processedAt: string }>;
  n8nNotificationsSent: Record<string, string>;
  notificationLog: NotificationLogEntry[];
}

export interface SyncPushRequest {
  studentId: string;
  deviceId: string;
  mutations: Mutation[];
}

export interface SyncPushResponse {
  applied: string[];
  duplicates: string[];
  serverVersion: number;
  state: PublicState;
}

export interface PublicState {
  student: StudentState;
  subjects: Subject[];
  chapters: Chapter[];
  tasks: Task[];
  focusSessions: FocusSession[];
  serverVersion: number;
}
