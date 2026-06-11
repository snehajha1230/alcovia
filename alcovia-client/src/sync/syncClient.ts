import axios from 'axios';
import type { LocalDeviceState, NotificationEntry, PublicState } from '../types';
import { API_BASE_URL, STUDENT_ID } from '../types';
import { appendSyncLog, applyPublicState, removeAppliedMutations } from './mutations';

interface SyncPushResponse {
  applied: string[];
  duplicates: string[];
  serverVersion: number;
  state: PublicState;
}

export async function syncDevice(state: LocalDeviceState): Promise<LocalDeviceState> {
  if (!state.isOnline) {
    appendSyncLog(state, 'Skipped sync (offline)');
    return state;
  }

  try {
    const pushResponse = await axios.post<SyncPushResponse>(`${API_BASE_URL}/sync/push`, {
      studentId: STUDENT_ID,
      deviceId: state.deviceId,
      mutations: state.pendingMutations,
    });

    const { applied, duplicates, state: remoteState } = pushResponse.data;
    removeAppliedMutations(state, applied, duplicates);
    applyPublicState(state, remoteState);

    appendSyncLog(
      state,
      `Push applied=${applied.length}, dup=${duplicates.length}, pending=${state.pendingMutations.length}`
    );

    const pullResponse = await axios.get<PublicState>(`${API_BASE_URL}/sync/pull`);
    applyPublicState(state, pullResponse.data);
    appendSyncLog(state, `Pull server v${pullResponse.data.serverVersion}`);
    state.lastSyncAt = new Date().toISOString();
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Unknown sync error';
    appendSyncLog(state, `Sync failed: ${message}`);
  }

  return state;
}

export async function fetchNotifications(): Promise<NotificationEntry[]> {
  const response = await axios.get<{ notifications: NotificationEntry[] }>(`${API_BASE_URL}/dev/notifications`);
  return response.data.notifications;
}

export async function resetServer(): Promise<void> {
  await axios.post(`${API_BASE_URL}/dev/reset`);
}
