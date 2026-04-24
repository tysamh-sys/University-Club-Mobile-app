import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings as SettingsIcon, 
  ChevronLeft, 
  Bell, 
  Moon, 
  Shield, 
  Lock, 
  Cpu, 
  Database, 
  Activity,
  Globe,
  HelpCircle,
  LogOut
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

export default function AdminSettings() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  
  const [notifications, setNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState(true);

  const SettingRow = ({ icon: Icon, label, value, onToggle, type = 'switch', color }: any) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.iconBox, { backgroundColor: (color || theme.primary) + '15' }]}>
        <Icon size={20} color={color || theme.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: theme.primary + '80' }}
          thumbColor={value ? theme.primary : '#f4f3f4'}
        />
      ) : (
        <ChevronLeft size={20} color={theme.subtext} style={{ transform: [{ rotate: '180deg' }] }} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>System Preferences</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Summary */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.section}>
          <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'Administrator'}</Text>
              <Text style={[styles.userEmail, { color: theme.subtext }]}>{user?.email || 'admin@vital.com'}</Text>
              <View style={[styles.adminBadge, { backgroundColor: theme.accent + '20' }]}>
                <Shield size={10} color={theme.accent} />
                <Text style={[styles.adminBadgeText, { color: theme.accent }]}>ROOT ACCESS</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Global Settings */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance & Notifications</Text>
          <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <SettingRow 
              icon={Moon} 
              label="Dark Mode" 
              value={isDarkMode} 
              onToggle={toggleTheme} 
              color="#a855f7"
            />
            <SettingRow 
              icon={Bell} 
              label="System Notifications" 
              value={notifications} 
              onToggle={setNotifications} 
              color="#f59e0b"
            />
            <SettingRow 
              icon={Globe} 
              label="Language" 
              type="chevron"
              color="#3b82f6"
            />
          </View>
        </Animated.View>

        {/* Admin Infrastructure */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Infrastructure</Text>
          <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <SettingRow 
              icon={Activity} 
              label="Maintenance Mode" 
              value={maintenanceMode} 
              onToggle={setMaintenanceMode} 
              color="#ef4444"
            />
            <SettingRow 
              icon={Database} 
              label="Debug Logging" 
              value={debugLogs} 
              onToggle={setDebugLogs} 
              color="#10b981"
            />
            <SettingRow 
              icon={Cpu} 
              label="Performance Metrics" 
              type="chevron"
              color={theme.primary}
            />
            <SettingRow 
              icon={Lock} 
              label="API Security Keys" 
              type="chevron"
              color="#64748b"
            />
          </View>
        </Animated.View>

        {/* Support & Legal */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>
          <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <SettingRow 
              icon={HelpCircle} 
              label="Help Center" 
              type="chevron"
              color="#717182"
            />
            <SettingRow 
              icon={Shield} 
              label="Privacy Policy" 
              type="chevron"
              color="#717182"
            />
          </View>
        </Animated.View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { borderColor: '#ef4444' }]}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out System</Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: theme.subtext }]}>VITAL Admin Engine v2.4.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  settingsGroup: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 10,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '800',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 20,
    opacity: 0.5,
  },
});
