import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { clearDeviceState, createEmptyState, loadDeviceState, saveDeviceState } from '../storage/localStore';
import {
  applyOptimisticFocusComplete,
  appendSyncLog,
  createMutation,
  cycleTaskStatus,
  queueMutation,
} from '../sync/mutations';
import { fetchNotifications, resetServer, syncDevice } from '../sync/syncClient';
import type {
  ActiveFocusSession,
  FocusFailReason,
  LocalDeviceState,
  NotificationEntry,
  Task,
} from '../types';
import { GRACE_PERIOD_MS, MAX_FOCUS_MINUTES, MIN_FOCUS_MINUTES, STUDENT_ID } from '../types';

interface AppContextValue {
  state: LocalDeviceState;
  loading: boolean;
  notifications: NotificationEntry[];
  setDeviceId: (deviceId: string) => Promise<void>;
  setOnline: (online: boolean) => Promise<void>;
  syncNow: () => Promise<void>;
  resetLocal: () => Promise<void>;
  resetServerAndLocal: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  startFocusSession: (targetMinutes: number) => Promise<void>;
  giveUpFocusSession: () => Promise<void>;
  completeFocusSessionDev: () => Promise<void>;
  updateTaskStatus: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getChapterProgress: (chapterId: string) => number;
  getSubjectProgress: (subjectId: string) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

function chapterProgress(chapterId: string, tasks: Task[]): number {
  const chapterTasks = tasks.filter((t) => t.chapterId === chapterId);
  if (chapterTasks.length === 0) return 0;
  const done = chapterTasks.filter((t) => t.status === 'done').length;
  return Math.round((done / chapterTasks.length) * 100);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocalDeviceState>(createEmptyState('device-a'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const stateRef = useRef(state);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  stateRef.current = state;

  const persist = useCallback(async (next: LocalDeviceState) => {
    stateRef.current = next;
    setState(next);
    await saveDeviceState(next);
  }, []);

  const runSync = useCallback(async () => {
    const current = stateRef.current;
    const next = { ...current, pendingMutations: [...current.pendingMutations] };
    await syncDevice(next);
    await persist(next);
  }, [persist]);

  const refreshNotifications = useCallback(async () => {
    if (!stateRef.current.isOnline) return;
    try {
      const entries = await fetchNotifications();
      setNotifications(entries);
    } catch {
      // ignore when backend unavailable
    }
  }, []);

  useEffect(() => {
    (async () => {
      const loaded = await loadDeviceState('device-a');
      setState(loaded);
      stateRef.current = loaded;
      setLoading(false);
      if (loaded.isOnline) {
        await syncDevice(loaded);
        await saveDeviceState(loaded);
        setState({ ...loaded });
      }
    })();
  }, []);

  useEffect(() => {
    if (!state.isOnline) return;
    void runSync();
    void refreshNotifications();
    const id = setInterval(() => {
      void runSync();
      void refreshNotifications();
    }, 5000);
    return () => clearInterval(id);
  }, [state.isOnline, runSync, refreshNotifications]);

  const completeFocusSessionInternal = useCallback(
    async (current: LocalDeviceState) => {
      const active = current.activeSession;
      if (!active) return;

      const mutation = createMutation(current, 'FOCUS_SESSION_COMPLETE', {
        sessionId: active.sessionId,
        targetMinutes: active.targetMinutes,
        durationMinutes: active.targetMinutes,
        startedAt: active.startedAt,
        completedAt: new Date().toISOString(),
      });
      queueMutation(current, mutation);
      applyOptimisticFocusComplete(current, active.targetMinutes);

      current.focusSessions = [
        ...current.focusSessions.filter((s) => s.id !== active.sessionId),
        {
          id: active.sessionId,
          studentId: STUDENT_ID,
          deviceId: current.deviceId,
          targetMinutes: active.targetMinutes,
          status: 'completed',
          startedAt: active.startedAt,
          endedAt: new Date().toISOString(),
          lamport: mutation.lamport,
        },
      ];
      current.activeSession = null;
      appendSyncLog(current, 'Focus completed');
      await persist(current);
      if (current.isOnline) {
        await runSync();
        await refreshNotifications();
      }
    },
    [persist, runSync, refreshNotifications]
  );

  const failActiveSession = useCallback(
    async (reason: FocusFailReason) => {
      const current = {
        ...stateRef.current,
        pendingMutations: [...stateRef.current.pendingMutations],
        focusSessions: [...stateRef.current.focusSessions],
        activeSession: stateRef.current.activeSession,
      };
      const active = current.activeSession;
      if (!active) return;

      const mutation = createMutation(current, 'FOCUS_SESSION_FAIL', {
        sessionId: active.sessionId,
        targetMinutes: active.targetMinutes,
        startedAt: active.startedAt,
        failedAt: new Date().toISOString(),
        reason,
      });
      queueMutation(current, mutation);

      current.focusSessions = [
        ...current.focusSessions.filter((s) => s.id !== active.sessionId),
        {
          id: active.sessionId,
          studentId: STUDENT_ID,
          deviceId: current.deviceId,
          targetMinutes: active.targetMinutes,
          status: 'failed',
          failReason: reason,
          startedAt: active.startedAt,
          endedAt: new Date().toISOString(),
          lamport: mutation.lamport,
        },
      ];
      current.activeSession = null;
      appendSyncLog(current, `Focus failed (${reason})`);
      await persist(current);
      if (current.isOnline) await runSync();
    },
    [persist, runSync]
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const active = stateRef.current.activeSession;
      if (!active) return;

      if (nextState !== 'active') {
        graceTimerRef.current = setTimeout(() => {
          void failActiveSession('app_switch');
        }, GRACE_PERIOD_MS);
      } else if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    });

    return () => {
      sub.remove();
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    };
  }, [failActiveSession]);

  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    if (!state.activeSession) return;

    tickRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.activeSession) return prev;
        const elapsedSeconds = prev.activeSession.elapsedSeconds + 1;
        const targetSeconds = prev.activeSession.targetMinutes * 60;

        if (elapsedSeconds >= targetSeconds) {
          const snapshot = {
            ...prev,
            activeSession: { ...prev.activeSession, elapsedSeconds },
            pendingMutations: [...prev.pendingMutations],
            focusSessions: [...prev.focusSessions],
          };
          void completeFocusSessionInternal(snapshot);
          return { ...prev, activeSession: null };
        }

        const next = {
          ...prev,
          activeSession: {
            ...prev.activeSession,
            elapsedSeconds,
            savedAt: new Date().toISOString(),
          },
        };
        void saveDeviceState(next);
        return next;
      });
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state.activeSession?.sessionId, completeFocusSessionInternal]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      loading,
      notifications,
      setDeviceId: async (deviceId: string) => {
        const loaded = await loadDeviceState(deviceId);
        loaded.deviceId = deviceId;
        await persist(loaded);
        if (loaded.isOnline) await runSync();
      },
      setOnline: async (online: boolean) => {
        const next = { ...stateRef.current, isOnline: online };
        appendSyncLog(next, online ? 'Online' : 'Offline');
        await persist(next);
        if (online) {
          await runSync();
          await refreshNotifications();
        }
      },
      syncNow: runSync,
      resetLocal: async () => {
        const deviceId = stateRef.current.deviceId;
        await clearDeviceState(deviceId);
        const fresh = createEmptyState(deviceId);
        await persist(fresh);
        if (fresh.isOnline) await runSync();
      },
      resetServerAndLocal: async () => {
        if (stateRef.current.isOnline) {
          await resetServer();
        }
        await clearDeviceState(stateRef.current.deviceId);
        const fresh = createEmptyState(stateRef.current.deviceId);
        await persist(fresh);
        if (fresh.isOnline) await runSync();
        await refreshNotifications();
      },
      refreshNotifications,
      startFocusSession: async (targetMinutes: number) => {
        const minutes = Math.min(MAX_FOCUS_MINUTES, Math.max(MIN_FOCUS_MINUTES, targetMinutes));
        const current = {
          ...stateRef.current,
          pendingMutations: [...stateRef.current.pendingMutations],
          focusSessions: [...stateRef.current.focusSessions],
        };
        if (current.activeSession) return;

        const sessionId = uuidv4();
        const startedAt = new Date().toISOString();
        const startMutation = createMutation(current, 'FOCUS_SESSION_START', {
          sessionId,
          targetMinutes: minutes,
          startedAt,
        });
        queueMutation(current, startMutation);

        current.activeSession = {
          sessionId,
          targetMinutes: minutes,
          startedAt,
          elapsedSeconds: 0,
          savedAt: startedAt,
        };
        appendSyncLog(current, `Focus started (${minutes}m)`);
        await persist(current);
        if (current.isOnline) await runSync();
      },
      giveUpFocusSession: async () => {
        await failActiveSession('give_up');
      },
      completeFocusSessionDev: async () => {
        const current = {
          ...stateRef.current,
          pendingMutations: [...stateRef.current.pendingMutations],
          focusSessions: [...stateRef.current.focusSessions],
          activeSession: stateRef.current.activeSession
            ? {
                ...stateRef.current.activeSession,
                elapsedSeconds: stateRef.current.activeSession.targetMinutes * 60,
              }
            : null,
        };
        if (!current.activeSession) return;
        await completeFocusSessionInternal(current);
      },
      updateTaskStatus: async (taskId: string) => {
        const current = {
          ...stateRef.current,
          pendingMutations: [...stateRef.current.pendingMutations],
          tasks: [...stateRef.current.tasks],
        };
        const task = current.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const nextStatus = cycleTaskStatus(task.status);
        const mutation = createMutation(current, 'TASK_STATUS_UPDATE', {
          taskId,
          status: nextStatus,
        });
        queueMutation(current, mutation);

        current.tasks = current.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: nextStatus, lamport: mutation.lamport, updatedByDeviceId: current.deviceId }
            : t
        );
        appendSyncLog(current, `Task ${taskId} -> ${nextStatus}`);
        await persist(current);
        if (current.isOnline) await runSync();
      },
      deleteTask: async (taskId: string) => {
        const current = {
          ...stateRef.current,
          pendingMutations: [...stateRef.current.pendingMutations],
          tasks: [...stateRef.current.tasks],
        };
        const mutation = createMutation(current, 'TASK_DELETE', { taskId });
        queueMutation(current, mutation);
        current.tasks = current.tasks.filter((t) => t.id !== taskId);
        appendSyncLog(current, `Task deleted ${taskId}`);
        await persist(current);
        if (current.isOnline) await runSync();
      },
      getChapterProgress: (chapterId: string) => chapterProgress(chapterId, state.tasks),
      getSubjectProgress: (subjectId: string) => {
        const subjectChapters = state.chapters.filter((c) => c.subjectId === subjectId);
        if (subjectChapters.length === 0) return 0;
        const total = subjectChapters.reduce((sum, c) => sum + chapterProgress(c.id, state.tasks), 0);
        return Math.round(total / subjectChapters.length);
      },
    }),
    [state, loading, notifications, persist, runSync, refreshNotifications, failActiveSession, completeFocusSessionInternal]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
