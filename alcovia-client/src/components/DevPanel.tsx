import React, { useRef } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useApp } from '../state/AppProvider';
import { fonts } from '../theme/typography';

const DEVICES = ['device-a', 'device-b'] as const;

type DevPanelProps = {
  visible: boolean;
  onClose: () => void;
};

export function DevPanel({ visible, onClose }: DevPanelProps) {
  const {
    state,
    notifications,
    setDeviceId,
    setOnline,
    syncNow,
    resetLocal,
    resetServerAndLocal,
    refreshNotifications,
  } = useApp();

  const position = useRef({ x: 24, y: 120 });
  const dragOrigin = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const [, forceRender] = React.useReducer((n) => n + 1, 0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gesture) => {
        dragOrigin.current = {
          x: gesture.x0,
          y: gesture.y0,
          posX: position.current.x,
          posY: position.current.y,
        };
      },
      onPanResponderMove: (_, gesture) => {
        position.current = {
          x: dragOrigin.current.posX + gesture.dx,
          y: dragOrigin.current.posY + gesture.dy,
        };
        forceRender();
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={[
          styles.panel,
          { transform: [{ translateX: position.current.x }, { translateY: position.current.y }] },
        ]}
      >
        <View style={styles.titleBar} {...panResponder.panHandlers}>
          <Text style={styles.titleBarText}>Dev · {state.deviceId}</Text>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.body} nestedScrollEnabled showsVerticalScrollIndicator>
          <View style={styles.row}>
            <Text style={styles.label}>Online</Text>
            <Switch value={state.isOnline} onValueChange={setOnline} />
          </View>

          <Text style={styles.section}>Simulate device</Text>
          <View style={styles.deviceRow}>
            {DEVICES.map((deviceId) => (
              <Pressable
                key={deviceId}
                style={[styles.chip, state.deviceId === deviceId && styles.chipActive]}
                onPress={() => setDeviceId(deviceId)}
              >
                <Text style={styles.chipText}>{deviceId}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <ActionButton label="Sync now" onPress={syncNow} />
            <ActionButton label="Refresh n8n log" onPress={refreshNotifications} />
            <ActionButton label="Reset local" onPress={resetLocal} />
            <ActionButton label="Reset server + local" onPress={resetServerAndLocal} danger />
          </View>

          <Text style={styles.section}>Device state</Text>
          <Mono
            json={{
              deviceId: state.deviceId,
              online: state.isOnline,
              lamport: state.lamport,
              pendingMutations: state.pendingMutations.length,
              serverVersion: state.serverVersion,
              lastSyncAt: state.lastSyncAt,
              student: state.student,
            }}
          />

          <Text style={styles.section}>Pending mutations</Text>
          <Mono
            json={state.pendingMutations.map((m) => ({
              id: m.id.slice(0, 8),
              type: m.type,
              lamport: m.lamport,
            }))}
          />

          <Text style={styles.section}>Sync log</Text>
          {state.syncLog.slice(0, 8).map((line) => (
            <Text key={line} style={styles.logLine}>
              {line}
            </Text>
          ))}

          <Text style={styles.section}>n8n notifications (deduped on server)</Text>
          {notifications.length === 0 ? (
            <Text style={styles.muted}>No notifications yet. Complete a focus session while online.</Text>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <View key={`${n.sessionId}-${n.receivedAt}`} style={styles.notificationRow}>
                <Text style={styles.notificationText}>{n.message}</Text>
                <Text style={styles.muted}>
                  session={n.sessionId.slice(0, 8)} · {n.receivedAt}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={[styles.actionButton, danger && styles.actionDanger]} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function Mono({ json }: { json: unknown }) {
  return <Text style={styles.mono}>{JSON.stringify(json, null, 2)}</Text>;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 340,
    maxWidth: '92%',
    maxHeight: 420,
    borderRadius: 14,
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  titleBarText: {
    color: '#f9fafb',
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#e5e7eb',
    fontSize: 18,
    lineHeight: 20,
    fontFamily: fonts.body,
  },
  body: { maxHeight: 360, paddingHorizontal: 14, paddingBottom: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  label: { color: '#e5e7eb', fontFamily: fonts.body },
  section: {
    color: '#93c5fd',
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  deviceRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#374151' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { color: '#fff', fontFamily: fonts.bodySemiBold, fontSize: 13 },
  actions: { gap: 6 },
  actionButton: { backgroundColor: '#374151', padding: 8, borderRadius: 8 },
  actionDanger: { backgroundColor: '#7f1d1d' },
  actionText: { color: '#fff', textAlign: 'center', fontFamily: fonts.bodySemiBold, fontSize: 13 },
  mono: { color: '#d1d5db', fontFamily: fonts.mono, fontSize: 11, lineHeight: 16 },
  logLine: { color: '#d1d5db', fontFamily: fonts.mono, fontSize: 11, marginBottom: 2, lineHeight: 16 },
  muted: { color: '#9ca3af', fontFamily: fonts.body, fontSize: 11 },
  notificationRow: { marginBottom: 6, padding: 8, backgroundColor: '#1f2937', borderRadius: 8 },
  notificationText: { color: '#f9fafb', fontFamily: fonts.bodySemiBold, fontSize: 13 },
});
