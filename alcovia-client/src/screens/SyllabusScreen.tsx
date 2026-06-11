import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { SyllabusTab } from '../components/SyllabusTab';

export function SyllabusScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#faf5ff', '#f9fafb', '#eff6ff']} style={styles.gradient}>
        <AppHeader title="Syllabus" showBack />
        <View style={styles.content}>
          <SyllabusTab />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  gradient: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
});
