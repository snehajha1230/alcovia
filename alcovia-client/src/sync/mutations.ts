import { v4 as uuidv4 } from 'uuid';
import type { LocalDeviceState, Mutation, MutationType, PublicState, TaskStatus } from '../types';
import { COINS_PER_SESSION, STUDENT_ID } from '../types';

export function nextLamport(state: LocalDeviceState): number {
  state.lamport += 1;
  return state.lamport;
}

export function createMutation(
  state: LocalDeviceState,
  type: MutationType,
  payload: Record<string, unknown>
): Mutation {
  return {
    id: uuidv4(),
    type,
    studentId: STUDENT_ID,
    deviceId: state.deviceId,
    lamport: nextLamport(state),
    createdAt: new Date().toISOString(),
    payload,
  };
}

export function queueMutation(state: LocalDeviceState, mutation: Mutation): void {
  state.pendingMutations.push(mutation);
}

export function applyPublicState(state: LocalDeviceState, remote: PublicState): void {
  state.serverVersion = remote.serverVersion;
  state.student = { ...remote.student };
  state.subjects = remote.subjects;
  state.chapters = remote.chapters;
  state.tasks = remote.tasks;
  state.focusSessions = remote.focusSessions;
}

export function applyOptimisticFocusComplete(state: LocalDeviceState, targetMinutes: number): void {
  const today = new Date().toISOString().slice(0, 10);
  if (state.student.todayFocusDate !== today) {
    state.student.todayFocusMinutes = 0;
    state.student.todayFocusDate = today;
  }
  state.student.todayFocusMinutes += targetMinutes;
  state.student.coins += COINS_PER_SESSION;

  if (state.student.lastSuccessDate === today) {
    return;
  }

  const yesterday = addDays(today, -1);
  if (state.student.lastSuccessDate === yesterday) {
    state.student.streakDays += 1;
  } else {
    state.student.streakDays = 1;
  }
  state.student.lastSuccessDate = today;
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function cycleTaskStatus(current: TaskStatus): TaskStatus {
  if (current === 'not_started') return 'in_progress';
  if (current === 'in_progress') return 'done';
  return 'not_started';
}

export function appendSyncLog(state: LocalDeviceState, message: string): void {
  const entry = `[${new Date().toLocaleTimeString()}] ${message}`;
  state.syncLog = [entry, ...state.syncLog].slice(0, 50);
}

export function removeAppliedMutations(state: LocalDeviceState, appliedIds: string[], duplicateIds: string[]): void {
  const settled = new Set([...appliedIds, ...duplicateIds]);
  state.pendingMutations = state.pendingMutations.filter((m) => !settled.has(m.id));
}
