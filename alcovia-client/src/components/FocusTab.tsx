import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../state/AppProvider';
import { fonts } from '../theme/typography';
import { DurationDial } from './focus/DurationDial';
import { FocusStatsFab } from './focus/FocusStatsFab';
import { GrowingTree } from './focus/GrowingTree';

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FocusTab() {
  const { state, startFocusSession, giveUpFocusSession, completeFocusSessionDev } = useApp();
  const [duration, setDuration] = useState(25);
  const [dialOpen, setDialOpen] = useState(false);

  const active = state.activeSession;
  const targetSeconds = (active?.targetMinutes ?? duration) * 60;
  const elapsed = active?.elapsedSeconds ?? 0;
  const remaining = Math.max(0, targetSeconds - elapsed);
  const progress = targetSeconds > 0 ? elapsed / targetSeconds : 0;

  const recentSessions = useMemo(
    () =>
      [...state.focusSessions]
        .sort((a, b) => (b.endedAt ?? b.startedAt).localeCompare(a.endedAt ?? a.startedAt))
        .slice(0, 5),
    [state.focusSessions]
  );

  const handlePlantPress = () => {
    if (active) return;
    setDialOpen(true);
  };

  const handleStart = async () => {
    setDialOpen(false);
    await startFocusSession(duration);
  };

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Text style={styles.stageHint}>
          {active ? 'Your focus is growing…' : 'Tap the plant to begin'}
        </Text>

        <Pressable
          style={({ pressed }) => [styles.plantButton, pressed && !active && styles.plantButtonPressed]}
          onPress={handlePlantPress}
          disabled={!!active}
        >
          <GrowingTree
            progress={progress}
            idle={!active}
            pulsing={!active && !dialOpen}
            seed={active?.sessionId ?? 'alcovia-idle'}
          />
        </Pressable>

        {active && (
          <View style={styles.timerBlock}>
            <Text style={styles.timer}>{formatTime(remaining)}</Text>
            <Text style={styles.timerMeta}>
              {progress >= 0.9 ? 'Almost fully grown!' : `${Math.round(progress * 100)}% grown`}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
            </View>

            <Pressable style={styles.giveUpButton} onPress={giveUpFocusSession}>
              <Text style={styles.giveUpText}>Give up session</Text>
            </Pressable>

            <Pressable style={styles.devCompleteButton} onPress={completeFocusSessionDev}>
              <Text style={styles.devCompleteText}>Dev: complete now</Text>
            </Pressable>
          </View>
        )}
      </View>

      <DurationDial
        visible={dialOpen}
        duration={duration}
        onDurationChange={setDuration}
        onStart={handleStart}
        onClose={() => setDialOpen(false)}
      />

      <FocusStatsFab
        streakDays={state.student.streakDays}
        coins={state.student.coins}
        todayMinutes={state.student.todayFocusMinutes}
        recentSessions={recentSessions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 520,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 96,
  },
  stageHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  plantButton: {
    padding: 12,
    borderRadius: 999,
  },
  plantButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  timerBlock: {
    width: '100%',
    maxWidth: 320,
    marginTop: 8,
    alignItems: 'center',
    gap: 8,
  },
  timer: {
    fontFamily: fonts.displayBold,
    fontSize: 42,
    color: '#111827',
    letterSpacing: -1,
  },
  timerMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#16a34a',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 999,
  },
  giveUpButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  giveUpText: {
    fontFamily: fonts.bodySemiBold,
    color: '#dc2626',
    fontSize: 13,
  },
  devCompleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  devCompleteText: {
    fontFamily: fonts.body,
    color: '#9ca3af',
    fontSize: 12,
  },
});
