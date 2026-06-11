import express from 'express';
import cors from 'cors';
import { getDb, resetDb } from './db';
import { getNotificationLog, getPublicState, processSyncPush, recordMockNotification } from './sync/service';
import type { SyncPushRequest } from './types';
import { STUDENT_ID } from './types';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'Alcovia API',
    status: 'ok',
    health: '/health',
    sync: { push: 'POST /sync/push', pull: 'GET /sync/pull' },
    docs: 'See README.md in the repo root',
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
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

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    hint: 'Try GET /health or GET /sync/pull',
  });
});

getDb();

const server = app.listen(PORT, HOST, () => {
  console.log(`Alcovia backend listening on http://${HOST}:${PORT}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a free port.`);
  } else {
    console.error('Failed to start backend:', error);
  }
  process.exit(1);
});
