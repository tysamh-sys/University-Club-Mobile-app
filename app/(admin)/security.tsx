import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, AlertTriangle, Clock, User, Lock, Unlock, Terminal, ChevronLeft, Globe, Cpu, Server } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';

interface ActivityLog {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'danger';
}

interface BlockedUser {
  id: number;
  name: string;
  email: string;
  reason: string;
  blockedAt: string;
}

const mockActivityLogs: ActivityLog[] = [
  { id: 1, user: 'sarah@club.com', action: 'LOGIN_SUCCESS', timestamp: '2:23 PM', ipAddress: '192.168.1.42', status: 'success' },
  { id: 2, user: 'marcus@club.com', action: 'FILE_ACCESS', timestamp: '2:20 PM', ipAddress: '192.168.1.15', status: 'success' },
  { id: 3, user: 'unknown@external.com', action: 'LOGIN_FAILED', timestamp: '2:15 PM', ipAddress: '203.45.67.89', status: 'danger' },
  { id: 4, user: 'emma@club.com', action: 'SEC_AUDIT', timestamp: '1:58 PM', ipAddress: '192.168.1.73', status: 'warning' },
];

const mockBlockedUsers: BlockedUser[] = [
  { id: 1, name: 'Suspicious IP', email: '203.45.67.89', reason: 'Multiple failed logins', blockedAt: 'Today, 12:30 PM' },
  { id: 2, name: 'Bot Account', email: 'crawler.x@bot.io', reason: 'Automated scraping', blockedAt: 'Yesterday, 6:45 PM' }
];

export default function SecurityDashboard() {
  const { theme, isDarkMode } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(mockBlockedUsers);
  const [activityLogs] = useState<ActivityLog[]>(mockActivityLogs);

  const unblockUser = (userId: number) => {
    Alert.alert('System Auth', 'Unblock this target?', [
      { text: 'Abort', style: 'cancel' },
      { text: 'Proceed', style: 'destructive', onPress: () => setBlockedUsers(blockedUsers.filter(u => u.id !== userId)) }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Security Center</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.statusText, { color: '#10b981' }]}>System Protected</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* System Vitals */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
          <View style={[styles.terminalCard, { backgroundColor: '#030213', borderColor: theme.border }]}>
            <LinearGradient colors={['rgba(99, 102, 241, 0.15)', 'transparent']} style={styles.terminalOverlay} />
            <View style={styles.terminalHeader}>
              <Terminal size={18} color="#10b981" />
              <Text style={styles.terminalTitle}>CORE_SYSTEM_STATUS</Text>
            </View>
            <View style={styles.terminalGrid}>
              <View style={styles.terminalItem}>
                <Cpu size={14} color="rgba(255,255,255,0.4)" />
                <Text style={styles.terminalLabel}>FIREWALL</Text>
                <Text style={styles.terminalValue}>ENCRYPTED</Text>
              </View>
              <View style={styles.terminalItem}>
                <Server size={14} color="rgba(255,255,255,0.4)" />
                <Text style={styles.terminalLabel}>DATABASE</Text>
                <Text style={styles.terminalValue}>SECURED</Text>
              </View>
              <View style={styles.terminalItem}>
                <Globe size={14} color="rgba(255,255,255,0.4)" />
                <Text style={styles.terminalLabel}>TRAFFIC</Text>
                <Text style={styles.terminalValue}>FILTERED</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Threat Alerts */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Threat Management</Text>
            <View style={[styles.countBadge, { backgroundColor: '#ef4444' + '20' }]}>
              <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 12 }}>{blockedUsers.length}</Text>
            </View>
          </View>
          <View style={styles.listContainer}>
            {blockedUsers.map((user, index) => (
              <Animated.View 
                key={user.id} 
                entering={FadeInRight.delay(500 + index * 100)}
                style={[styles.threatCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.threatIcon, { backgroundColor: '#ef4444' + '10' }]}>
                  <AlertTriangle size={20} color="#ef4444" />
                </View>
                <View style={styles.threatInfo}>
                  <Text style={[styles.threatName, { color: theme.text }]}>{user.name}</Text>
                  <Text style={[styles.threatReason, { color: theme.subtext }]}>{user.reason}</Text>
                </View>
                <TouchableOpacity onPress={() => unblockUser(user.id)} style={[styles.unblockBtn, { backgroundColor: theme.primary }]}>
                  <Unlock size={16} color="#ffffff" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Real-time Logs */}
        <Animated.View entering={FadeInUp.delay(700)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Access Logs</Text>
          <View style={[styles.logList, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {activityLogs.map((log, index) => (
              <View key={log.id} style={[styles.logItem, index !== activityLogs.length - 1 && { borderBottomColor: theme.border }]}>
                <View style={[styles.logStatus, { backgroundColor: log.status === 'success' ? '#10b981' : log.status === 'danger' ? '#ef4444' : '#f59e0b' }]} />
                <View style={styles.logContent}>
                  <View style={styles.logHeader}>
                    <Text style={[styles.logAction, { color: theme.text }]}>{log.action}</Text>
                    <Text style={[styles.logTime, { color: theme.subtext }]}>{log.timestamp}</Text>
                  </View>
                  <Text style={[styles.logUser, { color: theme.subtext }]}>{log.user} • {log.ipAddress}</Text>
                </View>
              </View>
            ))}
          </View>
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  terminalCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  terminalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  terminalTitle: {
    color: '#10b981',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '800',
  },
  terminalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  terminalItem: {
    alignItems: 'center',
    gap: 4,
  },
  terminalLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  terminalValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  listContainer: {
    gap: 12,
  },
  threatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  threatIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threatInfo: {
    flex: 1,
  },
  threatName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  threatReason: {
    fontSize: 13,
    fontWeight: '500',
  },
  unblockBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logList: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  logItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  logStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  logAction: {
    fontSize: 14,
    fontWeight: '800',
  },
  logTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  logUser: {
    fontSize: 12,
    fontWeight: '500',
  },
});
