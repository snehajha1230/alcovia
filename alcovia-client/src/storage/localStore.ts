import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalDeviceState } from '../types';
import { STUDENT_ID } from '../types';

const STORAGE_PREFIX = 'alcovia';

function storageKey(deviceId: string): string {
  return `${STORAGE_PREFIX}:${deviceId}:state`;
}

export function createEmptyState(deviceId: string): LocalDeviceState {
  return {
    deviceId,
    lamport: 0,
    isOnline: true,
    pendingMutations: [],
    serverVersion: 0,
    student: {
      studentId: STUDENT_ID,
      coins: 0,
      streakDays: 0,
      lastSuccessDate: null,
      todayFocusMinutes: 0,
      todayFocusDate: null,
    },
    subjects: [],
    chapters: [],
    tasks: [],
    focusSessions: [],
    activeSession: null,
    syncLog: [],
    lastSyncAt: null,
  };
}

export async function loadDeviceState(deviceId: string): Promise<LocalDeviceState> {
  const raw = await AsyncStorage.getItem(storageKey(deviceId));
  if (!raw) {
    return createEmptyState(deviceId);
  }
  return JSON.parse(raw) as LocalDeviceState;
}

export async function saveDeviceState(state: LocalDeviceState): Promise<void> {
  await AsyncStorage.setItem(storageKey(state.deviceId), JSON.stringify(state));
}

export async function clearDeviceState(deviceId: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(deviceId));
}
