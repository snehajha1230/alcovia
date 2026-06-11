import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { FocusTab } from '../components/FocusTab';

export function FocusScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#f0fdf4', '#f9fafb', '#eff6ff']} style={styles.gradient}>
        <AppHeader title="Focus" showBack />
        <View style={styles.content}>
          <FocusTab />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  gradient: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
});
