import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { router, useSegments, useRootNavigationState } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';

    if (!user && !inAuthGroup) {
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1);
    } else if (user && inAuthGroup) {
      setTimeout(() => {
        router.replace(user.role === 'admin' ? '/(admin)/dashboard' : '/(tabs)');
      }, 1);
    } else if (user && user.role !== 'admin' && inAdminGroup) {
      // Prevent members from accessing admin routes
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1);
    } else if (user && user.role === 'admin' && segments[0] === '(tabs)') {
      // Prevent admins from accessing member tabs
      setTimeout(() => {
        router.replace('/(admin)/dashboard');
      }, 1);
    }
  }, [user, segments, navigationState?.key]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

import { ThemeProvider as AppThemeProvider } from '@/context/ThemeContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
