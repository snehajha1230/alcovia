import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDevPanel } from '../context/DevPanelContext';
import type { RootStackParamList } from '../navigation/types';
import { useApp } from '../state/AppProvider';
import { fonts } from '../theme/typography';

type Props = {
  title?: string;
  showBack?: boolean;
};

export function AppHeader({ title, showBack }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state } = useApp();
  const { devOpen, toggleDev } = useDevPanel();

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.titleRow}>
          <Text style={styles.appTitle}>{title ?? 'Alcovia'}</Text>
          <Pressable
            style={[styles.devButton, devOpen && styles.devButtonActive]}
            onPress={toggleDev}
          >
            <Text style={[styles.devButtonText, devOpen && styles.devButtonTextActive]}>dev</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.meta}>
        {state.deviceId} · {state.isOnline ? 'online' : 'offline'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: 36 },
  backText: { fontSize: 18, color: '#374151', lineHeight: 20 },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  appTitle: {
    fontSize: 26,
    fontFamily: fonts.displayBold,
    color: '#111827',
    letterSpacing: -0.5,
  },
  devButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  devButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  devButtonText: {
    fontSize: 11,
    fontFamily: fonts.monoMedium,
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  devButtonTextActive: {
    color: '#f9fafb',
  },
  meta: { color: '#6b7280', marginTop: 6, marginLeft: 44, fontFamily: fonts.body, fontSize: 13 },
});
