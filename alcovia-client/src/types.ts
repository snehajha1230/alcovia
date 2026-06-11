export const STUDENT_ID = 'student-1';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
export const COINS_PER_SESSION = 50;
export const GRACE_PERIOD_MS = 5000;
export const MIN_FOCUS_MINUTES = 25;
export const MAX_FOCUS_MINUTES = 120;

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

export interface ActiveFocusSession {
  sessionId: string;
  targetMinutes: number;
  startedAt: string;
  elapsedSeconds: number;
  savedAt: string;
}

export interface PublicState {
  student: StudentState;
  subjects: Subject[];
  chapters: Chapter[];
  tasks: Task[];
  focusSessions: FocusSession[];
  serverVersion: number;
}

export interface LocalDeviceState {
  deviceId: string;
  lamport: number;
  isOnline: boolean;
  pendingMutations: Mutation[];
  serverVersion: number;
  student: StudentState;
  subjects: Subject[];
  chapters: Chapter[];
  tasks: Task[];
  focusSessions: FocusSession[];
  activeSession: ActiveFocusSession | null;
  syncLog: string[];
  lastSyncAt: string | null;
}

export interface NotificationEntry {
  sessionId: string;
  message: string;
  streakDays: number;
  coinsAwarded: number;
  receivedAt: string;
}
