import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  Calendar, 
  Building2, 
  Shield, 
  ChevronRight, 
  Bell, 
  UserPlus, 
  RefreshCcw,
  Zap,
  Archive,
  X,
  MessageSquare,
  AlertTriangle,
  Info,
  Lock
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import Animated, { 
  FadeInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withSequence,
  withDelay,
  Layout,
  FadeInDown
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const SecurityTerminal = ({ logs, onNavigate }: { logs: string[], onNavigate: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [logIndex, setLogIndex] = useState(0);
  const typingRef = useRef<any>(null);

  useEffect(() => {
    let currentText = '';
    let i = 0;
    const fullText = logs[logIndex % logs.length];
    
    setDisplayedText('');
    
    typingRef.current = setInterval(() => {
      if (i < fullText.length) {
        currentText += fullText[i];
        setDisplayedText(currentText);
        i++;
      } else {
        clearInterval(typingRef.current);
        // Reset and type next log after 8s
        setTimeout(() => {
          setLogIndex(prev => prev + 1);
        }, 8000);
      }
    }, 50);

    return () => clearInterval(typingRef.current);
  }, [logIndex, logs]);

  const isSuspicious = displayedText.toLowerCase().includes('blocked') || displayedText.toLowerCase().includes('suspicious');

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onNavigate}
      style={styles.terminalContainer}
    >
      <View style={styles.terminalHeader}>
        <View style={styles.terminalDots}>
          <View style={[styles.dot, { backgroundColor: '#ff5f56' }]} />
          <View style={[styles.dot, { backgroundColor: '#ffbd2e' }]} />
          <View style={[styles.dot, { backgroundColor: '#27c93f' }]} />
        </View>
        <Text style={styles.terminalTitle}>SECURE-OS TERMINAL</Text>
      </View>
      <View style={styles.terminalBody}>
        <Text style={[styles.terminalText, isSuspicious && styles.terminalTextAlert]}>
          <Text style={{ color: '#10b981' }}>$ </Text>
          {displayedText}
          <Text style={styles.cursor}>_</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const AnimatedCard = ({ children, onPress, style }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function AdminDashboard() {
  const { theme, isDarkMode } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [statsData, setStatsData] = useState({
    users: 0,
    events: 0,
    sponsors: 0,
    archives: 0,
    vault: 0,
    alerts: 0,
    feedback: 0,
  });

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "SECURE-OS TERMINAL INITIALIZING...",
    "Scanning network for active threats...",
    "System Health: Optimal"
  ]);

  const [dynamicNotifications, setDynamicNotifications] = useState<any[]>([]);
  const [dynamicActivities, setDynamicActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, eventsRes, sponsorsRes, filesRes, archivesRes, feedbackRes, movesRes] = await Promise.all([
          api.get('/users').catch(() => ({ data: { users: [] } })),
          api.get('/events').catch(() => ({ data: { events: [], count: 0 } })),
          api.get('/sponsors').catch(() => ({ data: { sponsors: [], count: 0 } })),
          api.get('/files').catch(() => ({ data: { files: [], count: 0 } })),
          api.get('/ai/historical-events?limit=1').catch(() => ({ data: { count: 0 } })),
          api.get('/problems').catch(() => ({ data: { problems: [] } })),
          api.get('/security/logs?type=blocks').catch(() => ({ data: [] }))
        ]);
        
        
        const problems = feedbackRes.data?.problems || [];
        const unresolved = problems.filter((p: any) => !p.is_resolved);

        setStatsData(prev => ({
          ...prev,
          users:    Array.isArray(usersRes.data) ? usersRes.data.length : (usersRes.data?.users?.length || usersRes.data?.count || 0),
          events:   eventsRes.data?.count   || eventsRes.data?.events?.length   || 0,
          sponsors: sponsorsRes.data?.count || sponsorsRes.data?.sponsors?.length || 0,
          vault:    filesRes.data?.count    || filesRes.data?.files?.length       || 0,
          archives: archivesRes.data?.count || 0,
          feedback: unresolved.length,
        }));
        
        let notifs: any[] = [];
        if (movesRes.data && movesRes.data.length > 0) {
            const formattedLogs = movesRes.data.slice(0, 5).map((log: any) => 
               `[${new Date(log.created_at).toLocaleTimeString()}] ${log.action} - IP: ${log.ip || 'Unknown'}`
            );
            setTerminalLogs(formattedLogs);
            setStatsData(prev => ({ ...prev, alerts: movesRes.data.length }));

            movesRes.data.slice(0, 3).forEach((move: any, idx: number) => {
              notifs.push({
                id: `alert-${idx}`,
                type: 'alert',
                title: 'Security System',
                message: `${move.action} on ${move.ip || 'target'}`,
                time: new Date(move.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                icon: AlertTriangle,
                color: '#ef4444'
              });
            });
        }

        unresolved.slice(0, 3).forEach((prob: any, idx: number) => {
           notifs.push({
              id: `prob-${idx}`,
              type: 'message',
              title: 'Feedback / Issue',
              message: prob.description || 'New issue reported',
              time: new Date(prob.created_at).toLocaleDateString(),
              icon: MessageSquare,
              color: '#f59e0b'
           });
        });
        setDynamicNotifications(notifs);

        let acts: any[] = [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.users || []);
        const recentUsers = [...users].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);
        recentUsers.forEach((u: any, idx: number) => {
           acts.push({
              id: `usr-${idx}`,
              title: 'New Member',
              user: u.name,
              time: new Date(u.created_at).toLocaleDateString(),
              icon: UserPlus,
              color: '#6366f1'
           });
        });

        const evts = eventsRes.data?.events || [];
        const recentEvts = [...evts].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);
        recentEvts.forEach((e: any, idx: number) => {
           acts.push({
              id: `evt-${idx}`,
              title: 'Event Scheduled',
              user: e.title || 'New Event',
              time: new Date(e.created_at).toLocaleDateString(),
              icon: Calendar,
              color: '#10b981'
           });
        });
        setDynamicActivities(acts);
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      }
    };
    fetchStats();
  }, []);
  
  const stats = [
    { label: 'Users', value: statsData.users.toString(), icon: Users, color: ['#6366f1', '#4f46e5'], path: '/(admin)/management' },
    { label: 'Events', value: statsData.events.toString(), icon: Calendar, color: ['#10b981', '#059669'], path: '/(admin)/management/events' },
    { label: 'Sponsors', value: statsData.sponsors.toString(), icon: Building2, color: ['#f59e0b', '#d97706'], path: '/(admin)/management/sponsors' },
    { label: 'Archives', value: statsData.archives.toString(), icon: Archive, color: ['#8b5cf6', '#7c3aed'], path: '/(admin)/archives' },
    { label: 'Feedback', value: statsData.feedback.toString(), icon: MessageSquare, color: ['#ec4899', '#db2777'], path: '/(admin)/problems' },
    { label: 'Vault', value: statsData.vault.toString(), icon: Lock, color: ['#475569', '#1e293b'], path: '/(admin)/vault' },
    { label: 'Alerts', value: statsData.alerts.toString(), icon: Shield, color: ['#ef4444', '#dc2626'], path: '/(admin)/security' }
  ];



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Dashboard Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: theme.subtext }]}>System Health: Optimal</Text>
            <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowNotifications(true)}
            style={[styles.bellBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Bell size={20} color={theme.text} />
            <View style={[styles.notificationDot, { backgroundColor: dynamicNotifications.length > 0 ? '#ef4444' : 'transparent', borderWidth: dynamicNotifications.length > 0 ? 1.5 : 0 }]} />
          </TouchableOpacity>
        </Animated.View>

        {/* Interactive Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <AnimatedCard 
              key={index}
              onPress={() => router.push(stat.path as any)}
              style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <LinearGradient colors={stat.color as [string, string]} style={styles.statIconContainer}>
                <stat.icon size={18} color="#ffffff" />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.subtext }]}>{stat.label}</Text>
              </View>
              <View style={styles.shortcutIndicator}>
                <ChevronRight size={12} color={theme.border} />
              </View>
            </AnimatedCard>
          ))}
        </View>

        {/* Security Monitor */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Security Monitor</Text>
            <View style={[styles.liveIndicator, { backgroundColor: '#10b981' + '20' }]}>
              <View style={[styles.liveDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.liveText, { color: '#10b981' }]}>LIVE</Text>
            </View>
          </View>
          <SecurityTerminal 
            logs={terminalLogs} 
            onNavigate={() => router.push('/(admin)/security' as any)} 
          />
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>System Activity</Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            {dynamicActivities.length === 0 ? (
              <Text style={{color: theme.subtext, fontStyle: 'italic', textAlign: 'center', padding: 20}}>No recent activity found.</Text>
            ) : (
              dynamicActivities.map((activity, index) => (
                <Animated.View 
                  key={activity.id} 
                  entering={FadeInUp.delay(700 + index * 100)}
                  layout={Layout.springify()}
                  style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: activity.color + '15' }]}>
                    <activity.icon size={18} color={activity.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: theme.text }]}>{activity.title}</Text>
                    <Text style={[styles.activityUser, { color: theme.subtext }]}>{activity.user}</Text>
                  </View>
                  <Text style={[styles.activityTime, { color: theme.subtext }]}>{activity.time}</Text>
                </Animated.View>
              ))
            )}
          </View>
        </Animated.View>

      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown} style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Intelligence Alerts</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)} style={[styles.closeBtn, { backgroundColor: theme.input }]}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.notifList}>
              {dynamicNotifications.length === 0 ? (
                <Text style={{color: theme.subtext, fontStyle: 'italic', textAlign: 'center', padding: 20}}>No new alerts.</Text>
              ) : (
                dynamicNotifications.map((notif, i) => (
                  <Animated.View 
                    key={notif.id} 
                    entering={FadeInUp.delay(100 + i * 100)}
                    style={[styles.notifCard, { backgroundColor: theme.input }]}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: notif.color + '20' }]}>
                      <notif.icon size={20} color={notif.color} />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={[styles.notifTitle, { color: theme.text }]}>{notif.title}</Text>
                      <Text style={[styles.notifMessage, { color: theme.subtext }]}>{notif.message}</Text>
                      <Text style={[styles.notifTime, { color: theme.subtext }]}>{notif.time}</Text>
                    </View>
                  </Animated.View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.clearBtn}>
              <Text style={[styles.clearBtnText, { color: theme.primary }]}>Mark all as read</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  bellBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  shortcutIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  section: {
    paddingHorizontal: 24,
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
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
  },
  terminalContainer: {
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    height: 120,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    gap: 10,
  },
  terminalDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  terminalTitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  terminalBody: {
    padding: 12,
  },
  terminalText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  terminalTextAlert: {
    color: '#ef4444',
  },
  cursor: {
    color: '#10b981',
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  activityUser: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifList: {
    gap: 12,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  clearBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
