import fs from 'fs';
import path from 'path';
import type { DatabaseSnapshot } from './types';
import { createInitialSnapshot } from './seed';

const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

let snapshot: DatabaseSnapshot | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDb(): DatabaseSnapshot {
  if (snapshot) {
    return snapshot;
  }

  ensureDataDir();

  if (fs.existsSync(DB_PATH)) {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    snapshot = JSON.parse(raw) as DatabaseSnapshot;
    return snapshot;
  }

  snapshot = createInitialSnapshot();
  persistDb();
  return snapshot;
}

export function persistDb(): void {
  if (!snapshot) {
    return;
  }
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
}

export function getDb(): DatabaseSnapshot {
  return loadDb();
}

export function resetDb(): DatabaseSnapshot {
  snapshot = createInitialSnapshot();
  persistDb();
  return snapshot;
}

export function bumpVersion(): number {
  const db = getDb();
  db.version += 1;
  persistDb();
  return db.version;
}
