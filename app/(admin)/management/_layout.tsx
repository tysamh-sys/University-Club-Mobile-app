import { Stack, router, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function ManagementLayout() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const segments = useSegments();

  const tabs = [
    { id: 'index', label: 'Users', path: '/(admin)/management' },
    { id: 'events', label: 'Events', path: '/(admin)/management/events' },
    { id: 'sponsors', label: 'Sponsors', path: '/(admin)/management/sponsors' },
  ];

  // Determine active tab based on segments
  // segments might look like ['(admin)', 'management', 'events']
  const currentSegment = segments[segments.length - 1] as string;
  const activeTab = tabs.find(tab => {
    if (tab.id === 'index') {
      return currentSegment === 'management' || currentSegment === 'index';
    }
    return currentSegment === tab.id;
  }) || tabs[0];

  const handlePress = (path: string) => {
    router.replace(path as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Custom Top Tab Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Management</Text>
        <View style={styles.tabBarWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {tabs.map((tab) => {
              const isActive = activeTab.id === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => handlePress(tab.path)}
                  style={[
                    styles.tabItem,
                    isActive && { borderBottomColor: theme.primary }
                  ]}
                >
                  <Text style={[
                    styles.tabLabel,
                    { color: isActive ? theme.primary : theme.subtext }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tabBarWrapper: {
    paddingHorizontal: 12,
  },
  tabBar: {
    paddingHorizontal: 12,
    gap: 20,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
