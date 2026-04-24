import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Calendar, MessageSquare, Shield, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'event' | 'message' | 'security' | 'system';
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    title: 'Event Approved',
    message: 'Your request to join "Tech Innovation Workshop" has been approved!',
    time: '2m ago',
    type: 'event',
    read: false
  },
  {
    id: 2,
    title: 'New Message',
    message: 'Sarah Chen sent you a message regarding the upcoming mixer.',
    time: '1h ago',
    type: 'message',
    read: false
  },
  {
    id: 3,
    title: 'Security Alert',
    message: 'New login detected from a new device in London, UK.',
    time: '3h ago',
    type: 'security',
    read: true
  },
  {
    id: 4,
    title: 'System Update',
    message: 'VITAL-CORE v1.2 is now live with enhanced analytics.',
    time: '1d ago',
    type: 'system',
    read: true
  }
];

export default function NotificationsScreen() {
  const { theme, isDarkMode } = useTheme();

  const getIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar size={20} color="#00ff88" />;
      case 'message': return <MessageSquare size={20} color="#3399ff" />;
      case 'security': return <Shield size={20} color="#ff3366" />;
      default: return <Bell size={20} color={theme.subtext} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'event': return 'rgba(0, 255, 136, 0.1)';
      case 'message': return 'rgba(51, 153, 255, 0.1)';
      case 'security': return 'rgba(255, 51, 102, 0.1)';
      default: return isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(113, 113, 130, 0.1)';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Stay updated with VITAL activities</Text>
        </View>

        <View style={styles.list}>
          {mockNotifications.map((notif, index) => (
            <Animated.View 
              key={notif.id} 
              entering={FadeInUp.delay(200 + index * 100)}
            >
              <TouchableOpacity 
                activeOpacity={0.7}
                style={[
                  styles.notificationCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  !notif.read && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(3, 2, 19, 0.02)' }
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: getIconBg(notif.type) }]}>
                  {getIcon(notif.type)}
                </View>
                
                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <Text style={[styles.notifTitle, { color: theme.text }]}>{notif.title}</Text>
                    {!notif.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[styles.notifMessage, { color: theme.subtext }]} numberOfLines={2}>{notif.message}</Text>
                  <Text style={[styles.notifTime, { color: theme.subtext }]}>{notif.time}</Text>
                </View>

                <ChevronRight size={18} color={theme.border} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

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
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  notifMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notifTime: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3366',
  },
});
