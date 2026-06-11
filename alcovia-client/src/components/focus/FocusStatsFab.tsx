import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FocusSession, FocusSessionStatus } from '../../types';
import { fonts } from '../../theme/typography';

const SESSION_STATUS_COLOR: Record<FocusSessionStatus, string> = {
  completed: '#16a34a',
  failed: '#dc2626',
  running: '#2563eb',
};

type Props = {
  streakDays: number;
  coins: number;
  todayMinutes: number;
  recentSessions: FocusSession[];
};

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  value: string;
};

export function FocusStatsFab({ streakDays, coins, todayMinutes, recentSessions }: Props) {
  const [open, setOpen] = useState(false);

  const items = useMemo<MenuItem[]>(
    () => [
      { id: 'streak', icon: '🔥', label: 'Streak', value: `${streakDays} days` },
      { id: 'coins', icon: '🪙', label: 'Coins', value: String(coins) },
      { id: 'minutes', icon: '⏱', label: 'Today', value: `${todayMinutes} min` },
      { id: 'sessions', icon: '📋', label: 'Recent', value: `${recentSessions.length}` },
    ],
    [streakDays, coins, todayMinutes, recentSessions.length]
  );

  return (
    <Pressable
      style={styles.container}
      onHoverIn={() => setOpen(true)}
      onHoverOut={() => setOpen(false)}
    >
      {open && (
        <View style={styles.menu}>
          {items.map((item) => (
            <View key={item.id} style={styles.menuItem}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuTextBlock}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuValue}>{item.value}</Text>
              </View>
            </View>
          ))}

          <View style={styles.sessionsBlock}>
            <Text style={styles.sessionsHeading}>Recent sessions</Text>
            {recentSessions.length === 0 ? (
              <Text style={styles.sessionsEmpty}>No sessions yet</Text>
            ) : (
              recentSessions.map((session) => (
                <View key={session.id} style={styles.sessionRow}>
                  <Text
                    style={[
                      styles.sessionMain,
                      { color: SESSION_STATUS_COLOR[session.status] },
                    ]}
                  >
                    {session.targetMinutes}m · {session.status}
                    {session.failReason ? ` (${session.failReason})` : ''}
                  </Text>
                  <Text style={styles.sessionMeta}>{session.deviceId}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      <Pressable
        style={[styles.fab, open && styles.fabOpen]}
        onPress={() => setOpen((v) => !v)}
        accessibilityLabel="Focus stats"
      >
        <Text style={styles.fabIcon}>✎</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  menu: {
    marginBottom: 12,
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  menuIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  menuTextBlock: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#6b7280',
    fontSize: 13,
  },
  menuValue: {
    fontFamily: fonts.bodyBold,
    color: '#111827',
    fontSize: 14,
  },
  sessionsBlock: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 6,
  },
  sessionsHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sessionsEmpty: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#9ca3af',
  },
  sessionRow: {
    paddingVertical: 4,
  },
  sessionMain: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
  },
  sessionMeta: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  fabOpen: {
    backgroundColor: '#2563eb',
  },
  fabIcon: {
    color: '#fff',
    fontSize: 22,
    fontFamily: fonts.bodyBold,
  },
});
