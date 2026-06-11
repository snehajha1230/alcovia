/**
 * Applies reseeded device-a / device-b local state (web localStorage).
 * Run from repo root after: npm run reseed
 *
 * Usage: node scripts/apply-device-seeds.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEVICE_STATE_DIR = path.resolve(__dirname, '../../backend/data/device-states');

const STORAGE_PREFIX = 'alcovia';

function storageKey(deviceId) {
  return `${STORAGE_PREFIX}:${deviceId}:state`;
}

/** @type {import('@react-native-async-storage/async-storage').default | null} */
let AsyncStorage = null;

try {
  const mod = await import('@react-native-async-storage/async-storage');
  AsyncStorage = mod.default;
} catch {
  AsyncStorage = null;
}

async function applySeeds() {
  for (const deviceId of ['device-a', 'device-b']) {
    const seedPath = path.join(DEVICE_STATE_DIR, `${deviceId}.json`);
    if (!fs.existsSync(seedPath)) {
      console.error(`Missing ${seedPath}. Run: npm run reseed`);
      process.exit(1);
    }
    const state = fs.readFileSync(seedPath, 'utf-8');

    if (AsyncStorage) {
      await AsyncStorage.setItem(storageKey(deviceId), state);
      console.log(`Applied AsyncStorage seed for ${deviceId}`);
      continue;
    }

    console.log(`Seed ready for ${deviceId} (key: ${storageKey(deviceId)})`);
  }

  if (!AsyncStorage) {
    console.log('\nAsyncStorage is not available in this Node context.');
    console.log('In the browser devtools console on the app, run:');
    for (const deviceId of ['device-a', 'device-b']) {
      const seedPath = path.join(DEVICE_STATE_DIR, `${deviceId}.json`);
      const state = fs.readFileSync(seedPath, 'utf-8');
      console.log(`localStorage.setItem('${storageKey(deviceId)}', ${JSON.stringify(state)});`);
    }
    console.log('\nOr use Dev panel → Reset server + local on each device.');
  }
}

applySeeds().catch((error) => {
  console.error(error);
  process.exit(1);
});
