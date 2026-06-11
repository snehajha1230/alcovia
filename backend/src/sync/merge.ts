import type { FocusSession, Mutation, PublicState, StudentState, Task, TaskStatus } from '../types';
import { COINS_PER_SESSION } from '../seed';

const STATUS_RANK: Record<TaskStatus, number> = {
  not_started: 0,
  in_progress: 1,
  done: 2,
};

export function utcDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function addUtcDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function applyMutation(db: { mutations: Record<string, Mutation>; tasks: Record<string, Task>; focusSessions: Record<string, FocusSession> }, mutation: Mutation): void {
  if (db.mutations[mutation.id]) {
    return;
  }

  db.mutations[mutation.id] = mutation;

  switch (mutation.type) {
    case 'FOCUS_SESSION_START':
      applyFocusStart(db, mutation);
      break;
    case 'FOCUS_SESSION_COMPLETE':
      applyFocusComplete(db, mutation);
      break;
    case 'FOCUS_SESSION_FAIL':
      applyFocusFail(db, mutation);
      break;
    case 'TASK_STATUS_UPDATE':
      applyTaskStatus(db, mutation);
      break;
    case 'TASK_DELETE':
      applyTaskDelete(db, mutation);
      break;
    default:
      break;
  }
}

function applyFocusStart(
  db: { focusSessions: Record<string, FocusSession> },
  mutation: Mutation
): void {
  const sessionId = String(mutation.payload.sessionId);
  const existing = db.focusSessions[sessionId];
  if (existing) {
    return;
  }

  db.focusSessions[sessionId] = {
    id: sessionId,
    studentId: mutation.studentId,
    deviceId: mutation.deviceId,
    targetMinutes: Number(mutation.payload.targetMinutes),
    status: 'running',
    startedAt: String(mutation.payload.startedAt),
    lamport: mutation.lamport,
  };
}

function shouldReplaceFocusOutcome(existing: FocusSession | undefined, mutation: Mutation): boolean {
  if (!existing) {
    return true;
  }
  if (existing.status !== 'running') {
    return false;
  }
  return mutation.lamport >= existing.lamport;
}

function applyFocusComplete(
  db: { focusSessions: Record<string, FocusSession> },
  mutation: Mutation
): void {
  const sessionId = String(mutation.payload.sessionId);
  const existing = db.focusSessions[sessionId];

  if (!shouldReplaceFocusOutcome(existing, mutation)) {
    return;
  }

  const base = existing ?? {
    id: sessionId,
    studentId: mutation.studentId,
    deviceId: mutation.deviceId,
    targetMinutes: Number(mutation.payload.targetMinutes ?? mutation.payload.durationMinutes ?? 25),
    status: 'running' as const,
    startedAt: String(mutation.payload.startedAt ?? mutation.createdAt),
    lamport: 0,
  };

  db.focusSessions[sessionId] = {
    ...base,
    status: 'completed',
    endedAt: String(mutation.payload.completedAt ?? mutation.createdAt),
    lamport: mutation.lamport,
    deviceId: mutation.deviceId,
  };
}

function applyFocusFail(
  db: { focusSessions: Record<string, FocusSession> },
  mutation: Mutation
): void {
  const sessionId = String(mutation.payload.sessionId);
  const existing = db.focusSessions[sessionId];

  if (!shouldReplaceFocusOutcome(existing, mutation)) {
    return;
  }

  const base = existing ?? {
    id: sessionId,
    studentId: mutation.studentId,
    deviceId: mutation.deviceId,
    targetMinutes: Number(mutation.payload.targetMinutes ?? 25),
    status: 'running' as const,
    startedAt: String(mutation.payload.startedAt ?? mutation.createdAt),
    lamport: 0,
  };

  db.focusSessions[sessionId] = {
    ...base,
    status: 'failed',
    failReason: mutation.payload.reason as 'give_up' | 'app_switch',
    endedAt: String(mutation.payload.failedAt ?? mutation.createdAt),
    lamport: mutation.lamport,
    deviceId: mutation.deviceId,
  };
}

function applyTaskStatus(
  db: { tasks: Record<string, Task> },
  mutation: Mutation
): void {
  const taskId = String(mutation.payload.taskId);
  const task = db.tasks[taskId];
  if (!task || task.deleted) {
    return;
  }

  const nextStatus = mutation.payload.status as TaskStatus;
  const incoming = {
    lamport: mutation.lamport,
    deviceId: mutation.deviceId,
    status: nextStatus,
  };

  if (shouldApplyTaskUpdate(task, incoming)) {
    task.status = nextStatus;
    task.lamport = mutation.lamport;
    task.updatedByDeviceId = mutation.deviceId;
  }
}

function applyTaskDelete(
  db: { tasks: Record<string, Task> },
  mutation: Mutation
): void {
  const taskId = String(mutation.payload.taskId);
  const task = db.tasks[taskId];
  if (!task) {
    return;
  }

  if (mutation.lamport > task.lamport || (mutation.lamport === task.lamport && mutation.deviceId > task.updatedByDeviceId)) {
    task.deleted = true;
    task.lamport = mutation.lamport;
    task.updatedByDeviceId = mutation.deviceId;
  }
}

function shouldApplyTaskUpdate(
  task: Task,
  incoming: { lamport: number; deviceId: string; status: TaskStatus }
): boolean {
  if (incoming.lamport > task.lamport) {
    return true;
  }
  if (incoming.lamport < task.lamport) {
    return false;
  }

  if (STATUS_RANK[incoming.status] > STATUS_RANK[task.status]) {
    return true;
  }
  if (STATUS_RANK[incoming.status] < STATUS_RANK[task.status]) {
    return false;
  }

  return incoming.deviceId > task.updatedByDeviceId;
}

export function recomputeStudentRewards(
  student: StudentState,
  focusSessions: Record<string, FocusSession>,
  processedSessionRewards: Record<string, { coins: number; streakDays: number; processedAt: string }>
): { newlyProcessed: string[] } {
  const newlyProcessed: string[] = [];
  const completed = Object.values(focusSessions)
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (a.endedAt ?? '').localeCompare(b.endedAt ?? ''));

  let coins = 0;
  const successDates = new Set<string>();

  for (const session of completed) {
    if (!processedSessionRewards[session.id]) {
      newlyProcessed.push(session.id);
      processedSessionRewards[session.id] = {
        coins: COINS_PER_SESSION,
        streakDays: 0,
        processedAt: new Date().toISOString(),
      };
    }
    coins += COINS_PER_SESSION;
    if (session.endedAt) {
      successDates.add(utcDateKey(session.endedAt));
    }
  }

  student.coins = coins;

  const sortedDates = [...successDates].sort();
  student.streakDays = computeStreak(sortedDates);
  student.lastSuccessDate = sortedDates.length ? sortedDates[sortedDates.length - 1]! : null;

  const today = utcDateKey(new Date().toISOString());
  student.todayFocusDate = today;
  student.todayFocusMinutes = completed
    .filter((s) => s.endedAt && utcDateKey(s.endedAt) === today)
    .reduce((sum, s) => sum + s.targetMinutes, 0);

  return { newlyProcessed };
}

function computeStreak(sortedDates: string[]): number {
  const unique = [...new Set(sortedDates)].sort();
  if (unique.length === 0) {
    return 0;
  }

  const today = utcDateKey(new Date().toISOString());
  const yesterday = addUtcDays(today, -1);
  const last = unique[unique.length - 1]!;

  if (last !== today && last !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = unique.length - 1; i > 0; i -= 1) {
    const current = unique[i]!;
    const previous = unique[i - 1]!;
    if (current === previous) {
      continue;
    }
    if (addUtcDays(previous, 1) === current) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

export function toPublicState(db: {
  version: number;
  student: StudentState;
  subjects: Record<string, { id: string; name: string; chapterIds: string[] }>;
  chapters: Record<string, { id: string; subjectId: string; title: string; taskIds: string[] }>;
  tasks: Record<string, Task>;
  focusSessions: Record<string, FocusSession>;
}): PublicState {
  return {
    serverVersion: db.version,
    student: { ...db.student },
    subjects: Object.values(db.subjects),
    chapters: Object.values(db.chapters),
    tasks: Object.values(db.tasks).filter((t) => !t.deleted),
    focusSessions: Object.values(db.focusSessions),
  };
}

export function chapterProgress(chapterId: string, tasks: Task[]): number {
  const chapterTasks = tasks.filter((t) => t.chapterId === chapterId && !t.deleted);
  if (chapterTasks.length === 0) {
    return 0;
  }
  const done = chapterTasks.filter((t) => t.status === 'done').length;
  return Math.round((done / chapterTasks.length) * 100);
}

export function subjectProgress(subjectId: string, chapters: { id: string; subjectId: string }[], tasks: Task[]): number {
  const subjectChapters = chapters.filter((c) => c.subjectId === subjectId);
  if (subjectChapters.length === 0) {
    return 0;
  }
  const total = subjectChapters.reduce((sum, c) => sum + chapterProgress(c.id, tasks), 0);
  return Math.round(total / subjectChapters.length);
}
