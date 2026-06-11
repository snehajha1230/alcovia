import { getDb, persistDb, bumpVersion } from '../db';
import { applyMutation, recomputeStudentRewards, toPublicState } from './merge';
import type { Mutation, SyncPushResponse } from '../types';
import { triggerN8nFocusSuccess } from '../services/n8n';

export function processSyncPush(deviceId: string, mutations: Mutation[]): SyncPushResponse {
  const db = getDb();
  const applied: string[] = [];
  const duplicates: string[] = [];

  const sorted = [...mutations].sort((a, b) => {
    if (a.lamport !== b.lamport) {
      return a.lamport - b.lamport;
    }
    if (a.deviceId !== b.deviceId) {
      return a.deviceId.localeCompare(b.deviceId);
    }
    return a.id.localeCompare(b.id);
  });

  for (const mutation of sorted) {
    if (db.mutations[mutation.id]) {
      duplicates.push(mutation.id);
      continue;
    }

    applyMutation(db, { ...mutation, deviceId: mutation.deviceId || deviceId });
    applied.push(mutation.id);
  }

  const { newlyProcessed } = recomputeStudentRewards(db.student, db.focusSessions, db.processedSessionRewards);
  persistDb();
  bumpVersion();

  for (const sessionId of newlyProcessed) {
    const session = db.focusSessions[sessionId];
    if (!session || session.status !== 'completed') {
      continue;
    }

    void triggerN8nFocusSuccess({
      sessionId,
      studentId: db.student.studentId,
      streakDays: db.student.streakDays,
      coinsAwarded: db.processedSessionRewards[sessionId]?.coins ?? 0,
      targetMinutes: session.targetMinutes,
    });
  }

  return {
    applied,
    duplicates,
    serverVersion: db.version,
    state: toPublicState(db),
  };
}

export function getPublicState() {
  const db = getDb();
  return toPublicState(db);
}

export function getNotificationLog() {
  return getDb().notificationLog;
}

export function recordMockNotification(payload: {
  sessionId: string;
  message: string;
  streakDays: number;
  coinsAwarded: number;
}): { sent: boolean; reason?: string } {
  const db = getDb();

  if (db.n8nNotificationsSent[payload.sessionId]) {
    return { sent: false, reason: 'duplicate_session_id' };
  }

  db.n8nNotificationsSent[payload.sessionId] = new Date().toISOString();
  db.notificationLog.unshift({
    sessionId: payload.sessionId,
    message: payload.message,
    streakDays: payload.streakDays,
    coinsAwarded: payload.coinsAwarded,
    receivedAt: new Date().toISOString(),
  });

  if (db.notificationLog.length > 100) {
    db.notificationLog = db.notificationLog.slice(0, 100);
  }

  persistDb();
  bumpVersion();
  return { sent: true };
}
