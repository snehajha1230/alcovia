import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DevPanelProvider } from '../context/DevPanelContext';
import { FocusScreen } from '../screens/FocusScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { SyllabusScreen } from '../screens/SyllabusScreen';
import { useApp } from '../state/AppProvider';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigator() {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#f9fafb' },
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Focus" component={FocusScreen} />
      <Stack.Screen name="Syllabus" component={SyllabusScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { loading } = useApp();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <DevPanelProvider>
      <NavigationContainer>
        <Navigator />
      </NavigationContainer>
    </DevPanelProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
});
