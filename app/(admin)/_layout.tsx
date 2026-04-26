import { Tabs as ExpoTabs } from 'expo-router';
import React from 'react';
import { LayoutDashboard, Users2, Megaphone, MoreHorizontal, Archive } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  return (
    <ExpoTabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 4,
        },
      }}
    >
      <ExpoTabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <ExpoTabs.Screen
        name="management"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color, focused }) => (
            <Users2 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <ExpoTabs.Screen
        name="archives"
        options={{
          title: 'Archives',
          tabBarIcon: ({ color, focused }) => (
            <Archive 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <ExpoTabs.Screen
        name="branding"
        options={{
          title: 'Liaison',
          tabBarIcon: ({ color, focused }) => (
            <Megaphone 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <ExpoTabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <MoreHorizontal 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      {/* Hidden Routes */}
      <ExpoTabs.Screen name="index" options={{ href: null }} />
      <ExpoTabs.Screen name="security" options={{ href: null }} />
      <ExpoTabs.Screen name="vault" options={{ href: null }} />
      <ExpoTabs.Screen name="settings" options={{ href: null }} />
      <ExpoTabs.Screen name="problems" options={{ href: null }} />
    </ExpoTabs>
  );
}
