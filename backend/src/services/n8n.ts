import { getDb, persistDb } from '../db';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? 'http://localhost:5678/webhook/focus-success';

export async function triggerN8nFocusSuccess(payload: {
  sessionId: string;
  studentId: string;
  streakDays: number;
  coinsAwarded: number;
  targetMinutes: number;
}): Promise<void> {
  const db = getDb();

  if (db.n8nNotificationsSent[payload.sessionId]) {
    console.log(`[n8n] skip duplicate session ${payload.sessionId}`);
    return;
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: payload.sessionId,
        sessionId: payload.sessionId,
        studentId: payload.studentId,
        streakDays: payload.streakDays,
        coinsAwarded: payload.coinsAwarded,
        targetMinutes: payload.targetMinutes,
        message: `Streak now ${payload.streakDays} days, +${payload.coinsAwarded} coins.`,
      }),
    });

    if (!response.ok) {
      console.error(`[n8n] webhook failed: ${response.status} ${await response.text()}`);
    } else {
      console.log(`[n8n] webhook sent for session ${payload.sessionId}`);
    }
  } catch (error) {
    console.error('[n8n] webhook error', error);
  }
}

export function markNotificationSent(sessionId: string): void {
  const db = getDb();
  if (!db.n8nNotificationsSent[sessionId]) {
    db.n8nNotificationsSent[sessionId] = new Date().toISOString();
    persistDb();
  }
}
