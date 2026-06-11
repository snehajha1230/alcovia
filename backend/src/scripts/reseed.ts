import fs from 'fs';
import path from 'path';
import { createInitialSnapshot } from '../seed';
import { STUDENT_ID } from '../types';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const DEVICE_STATE_DIR = path.join(DATA_DIR, 'device-states');

function snapshotToPublicState(snapshot: ReturnType<typeof createInitialSnapshot>) {
  return {
    student: snapshot.student,
    subjects: Object.values(snapshot.subjects),
    chapters: Object.values(snapshot.chapters),
    tasks: Object.values(snapshot.tasks).filter((task) => !task.deleted),
    focusSessions: Object.values(snapshot.focusSessions),
    serverVersion: snapshot.version,
  };
}

function createDeviceLocalState(deviceId: string, snapshot: ReturnType<typeof createInitialSnapshot>) {
  const publicState = snapshotToPublicState(snapshot);
  return {
    deviceId,
    lamport: 0,
    isOnline: true,
    pendingMutations: [],
    serverVersion: publicState.serverVersion,
    student: { ...publicState.student },
    subjects: publicState.subjects,
    chapters: publicState.chapters,
    tasks: publicState.tasks,
    focusSessions: publicState.focusSessions,
    activeSession: null,
    syncLog: [`Reseeded local state for ${deviceId}`],
    lastSyncAt: new Date().toISOString(),
  };
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DEVICE_STATE_DIR)) {
  fs.mkdirSync(DEVICE_STATE_DIR, { recursive: true });
}

const snapshot = createInitialSnapshot();
fs.writeFileSync(DB_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');

for (const deviceId of ['device-a', 'device-b'] as const) {
  const deviceState = createDeviceLocalState(deviceId, snapshot);
  const devicePath = path.join(DEVICE_STATE_DIR, `${deviceId}.json`);
  fs.writeFileSync(devicePath, JSON.stringify(deviceState, null, 2), 'utf-8');
}

const subjectCount = Object.keys(snapshot.subjects).length;
const taskCount = Object.keys(snapshot.tasks).length;

console.log(`Reseeded ${DB_PATH}`);
console.log(`Wrote device states: ${DEVICE_STATE_DIR}/device-a.json, device-b.json`);
console.log(`Subjects: ${subjectCount}, Topics: ${taskCount}, Student: ${STUDENT_ID}`);
