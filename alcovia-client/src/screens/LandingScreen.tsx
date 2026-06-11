import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import type { RootStackParamList } from '../navigation/types';
import { fonts } from '../theme/typography';

const QUOTE = {
  text: 'The expert in anything was once a beginner.',
  author: 'Helen Hayes',
};

type RouteOption = {
  key: 'Focus' | 'Syllabus';
  label: string;
  description: string;
  accent: string;
  icon: string;
  gradient: [string, string];
};

const ROUTES: RouteOption[] = [
  {
    key: 'Focus',
    label: 'Focus',
    description: 'Plant a seed, set your timer, and grow a tree.',
    accent: '#16a34a',
    icon: '🌱',
    gradient: ['#dcfce7', '#f0fdf4'],
  },
  {
    key: 'Syllabus',
    label: 'Syllabus',
    description: 'Track subjects, chapters, and your study progress.',
    accent: '#7c3aed',
    icon: '📚',
    gradient: ['#ede9fe', '#f5f3ff'],
  },
];

export function LandingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const isWide = width >= 840;

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#eff6ff', '#f9fafb', '#f0fdf4']} style={styles.gradient}>
        <View style={styles.blobTop} />
        <View style={styles.blobBottom} />

        <AppHeader />

        <View style={styles.heroTag}>
          <Text style={styles.heroTagText}>Grow your focus, one session at a time</Text>
        </View>

        <View style={[styles.main, isWide ? styles.mainWide : styles.mainNarrow]}>
          <View style={[styles.quoteColumn, isWide && styles.quoteColumnWide]}>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.quoteText}>{QUOTE.text}</Text>
              <Text style={styles.quoteAuthor}>— {QUOTE.author}</Text>
            </View>
          </View>

          <View style={[styles.optionsColumn, isWide && styles.optionsColumnWide]}>
            <Text style={styles.optionsHeading}>Choose your path</Text>
            {ROUTES.map((route) => (
              <Pressable
                key={route.key}
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                onPress={() => navigation.navigate(route.key)}
              >
                <LinearGradient colors={route.gradient} style={styles.optionGradient}>
                  <View style={styles.optionTopRow}>
                    <View style={[styles.iconBadge, { backgroundColor: `${route.accent}22` }]}>
                      <Text style={styles.optionIcon}>{route.icon}</Text>
                    </View>
                    <Text style={[styles.optionArrow, { color: route.accent }]}>→</Text>
                  </View>
                  <Text style={styles.optionLabel}>{route.label}</Text>
                  <Text style={styles.optionDescription}>{route.description}</Text>
                  <View style={[styles.optionAccentBar, { backgroundColor: route.accent }]} />
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  gradient: {
    flex: 1,
  },
  blobTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    opacity: 0.55,
  },
  blobBottom: {
    position: 'absolute',
    bottom: 40,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#bbf7d0',
    opacity: 0.45,
  },
  heroTag: {
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 8,
  },
  heroTagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#4b5563',
    letterSpacing: 0.2,
  },
  main: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  mainWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: 48,
  },
  mainNarrow: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 28,
    paddingTop: 8,
  },
  quoteColumn: {
    gap: 8,
  },
  quoteColumnWide: {
    flex: 1,
    maxWidth: 500,
  },
  quoteCard: {
    backgroundColor: '#ffffffb3',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  quoteMark: {
    fontFamily: fonts.displayBold,
    fontSize: 64,
    color: '#93c5fd',
    lineHeight: 64,
    marginBottom: -8,
  },
  quoteText: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 44,
    color: '#111827',
    letterSpacing: -0.6,
  },
  quoteAuthor: {
    marginTop: 14,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: '#6b7280',
    letterSpacing: 0.2,
  },
  optionsColumn: {
    gap: 14,
  },
  optionsColumnWide: {
    flex: 1,
    maxWidth: 420,
  },
  optionsHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  optionCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  optionCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  optionGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffffffaa',
    borderRadius: 18,
    gap: 8,
  },
  optionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 22,
  },
  optionLabel: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: '#111827',
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: '#4b5563',
  },
  optionAccentBar: {
    marginTop: 6,
    height: 3,
    width: 42,
    borderRadius: 999,
  },
  optionArrow: {
    fontSize: 22,
    fontFamily: fonts.bodySemiBold,
  },
});
