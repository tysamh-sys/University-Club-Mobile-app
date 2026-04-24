import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Archive,
  Shield,
  Lock,
  ChevronRight,
  LogOut,
  Info,
  LifeBuoy,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function MoreScreen() {
  const { logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  
  const moreTools = [
    { id: 'security', label: 'Security', icon: Shield, description: 'System monitoring & access', color: ['#ef4444', '#dc2626'] },
    { id: 'vault', label: 'Vault', icon: Lock, description: 'Highly secure encrypted storage', color: ['#475569', '#1e293b'] },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, description: 'System & root preferences', color: ['#6366f1', '#4f46e5'] },
  ];

  const handleNavigate = (id: string) => {
    router.push(`/(admin)/${id}` as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>More</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Advanced tools and system options</Text>
        </Animated.View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>System Tools</Text>
          <View style={styles.grid}>
            {moreTools.map((tool, index) => (
              <Animated.View key={tool.id} entering={FadeInUp.delay(300 + index * 100)}>
                <TouchableOpacity
                  onPress={() => handleNavigate(tool.id)}
                  activeOpacity={0.7}
                  style={[styles.toolCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <LinearGradient
                    colors={tool.color as any}
                    style={styles.iconContainer}
                  >
                    <tool.icon size={22} color="#ffffff" />
                  </LinearGradient>
                  
                  <View style={styles.toolInfo}>
                    <Text style={[styles.toolLabel, { color: theme.text }]}>{tool.label}</Text>
                    <Text style={[styles.toolDescription, { color: theme.subtext }]}>{tool.description}</Text>
                  </View>

                  <ChevronRight size={18} color={theme.border} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Support & Legal</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity style={[styles.listItem, { borderBottomColor: theme.border }]}>
              <LifeBuoy size={20} color={theme.primary} />
              <Text style={[styles.listLabel, { color: theme.text }]}>Help Center</Text>
              <ChevronRight size={18} color={theme.subtext} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.listItem}>
              <Info size={20} color={theme.primary} />
              <Text style={[styles.listLabel, { color: theme.text }]}>Version Info (1.0.4)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View entering={FadeInUp.delay(800)} style={styles.footer}>
          <TouchableOpacity
            onPress={logout}
            activeOpacity={0.7}
            style={[styles.logoutBtn, { borderColor: '#fee2e2' }]}
          >
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Terminate Admin Session</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
  },
  grid: {
    gap: 12,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
    gap: 2,
  },
  toolLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  toolDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  listLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
