import express from 'express';
import cors from 'cors';
import { getNotificationLog, getPublicState, processSyncPush, recordMockNotification } from './sync/service';
import { resetDb } from './db';
import type { SyncPushRequest } from './types';
import { STUDENT_ID } from './types';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/state', (_req, res) => {
  res.json(getPublicState());
});

app.post('/sync/push', (req, res) => {
  const body = req.body as SyncPushRequest;

  if (!body.studentId || !body.deviceId || !Array.isArray(body.mutations)) {
    res.status(400).json({ error: 'Invalid sync payload' });
    return;
  }

  if (body.studentId !== STUDENT_ID) {
    res.status(400).json({ error: 'Unknown student' });
    return;
  }

  const result = processSyncPush(body.deviceId, body.mutations);
  res.json(result);
});

app.get('/sync/pull', (_req, res) => {
  res.json(getPublicState());
});

app.get('/dev/notifications', (_req, res) => {
  res.json({ notifications: getNotificationLog() });
});

app.post('/dev/mock-whatsapp', (req, res) => {
  const { sessionId, message, streakDays, coinsAwarded } = req.body as {
    sessionId?: string;
    message?: string;
    streakDays?: number;
    coinsAwarded?: number;
  };

  if (!sessionId || !message) {
    res.status(400).json({ error: 'sessionId and message required' });
    return;
  }

  const result = recordMockNotification({
    sessionId,
    message,
    streakDays: streakDays ?? 0,
    coinsAwarded: coinsAwarded ?? 0,
  });

  console.log(`[mock-whatsapp] ${result.sent ? 'SENT' : 'DUPLICATE'} ${sessionId}: ${message}`);
  res.json(result);
});

app.post('/dev/reset', (_req, res) => {
  resetDb();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Alcovia backend listening on http://localhost:${PORT}`);
});
