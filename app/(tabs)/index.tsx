import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Calendar, MapPin, Users, Star, Bell, ChevronRight, Activity } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { 
  FadeInUp, 
  FadeInRight, 
  Layout,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

import api from '@/services/api';

interface Event {
  id: number;
  title: string;
  date: string;
  time?: string;
  description: string;
  image?: string;
  participants: number;
  maxParticipants?: number;
  category?: string;
}

// Mock events removed in favor of live data

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Workshop', 'Social', 'Summit'];
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [requestedEvents, setRequestedEvents] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const [eventsRes, requestsRes] = await Promise.all([
        api.get('/events'),
        api.get('/events/my-requests')
      ]);
      setEvents(eventsRes.data.events || []);
      setRequestedEvents((requestsRes.data.requests || []).map(String));
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (eventId: any) => {
    try {
      console.log('Requesting participation for event:', eventId);
      const res = await api.post(`/events/${eventId}/request-participation`);
      setRequestedEvents([...requestedEvents, eventId]);
      Alert.alert('Success', 'Your request has been sent to the admin.');
    } catch (err: any) {
      console.error('Error requesting participation:', err);
      const status = err.response?.status;
      const data = err.response?.data;
      const errorMsg = data?.message || err.message;
      const detail = data?.detail || data?.error || '';
      
      Alert.alert(
        'Request Failed',
        `Status: ${status}\nMessage: ${errorMsg}\n\nDetail: ${detail}`
      );
    }
  };

  const submitFeedback = () => {
    setShowFeedback(null);
    setRating(0);
  };
  
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withDelay(500, withSequence(
      withSpring(1.2),
      withSpring(1)
    ));
    
    const interval = setInterval(() => {
      pulseValue.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
    opacity: 0.8 + (pulseValue.value - 1)
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Premium Header */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: theme.subtext }]}>Hello, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Member'}</Text>
            <Text style={[styles.title, { color: theme.text }]}>VITAL Experience</Text>
          </View>
          <TouchableOpacity 
            style={[styles.notificationBtn, { backgroundColor: theme.input }]}
            onPress={() => router.push('/notifications' as any)}
          >
            <Bell size={24} color={theme.text} />
            <View style={[styles.badge, { borderColor: theme.input }]} />
          </TouchableOpacity>
        </Animated.View>

        {/* Live Status Card */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.liveCard}>
          <LinearGradient
            colors={isDarkMode ? [theme.primary, '#312e81'] : [theme.primary, '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.liveGradient}
          >
            <View style={styles.liveHeader}>
              <View style={[styles.liveBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Animated.View style={[styles.pulseDot, pulseStyle]} />
                <Text style={styles.liveLabel}>LIVE NOW</Text>
              </View>
              <Activity size={20} color="rgba(255,255,255,0.8)" />
            </View>
            <Text style={styles.liveTitle}>Annual Tech Symposium</Text>
            <Text style={styles.liveDesc}>Join 150+ members in the Main Hall</Text>
            
            <TouchableOpacity style={[styles.joinNowBtn, { backgroundColor: '#ffffff' }]}>
              <Text style={[styles.joinNowText, { color: theme.primary }]}>Join Live Session</Text>
              <ChevronRight size={18} color={theme.primary} />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Discover</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat, index) => (
            <Animated.View key={cat} entering={FadeInRight.delay(500 + index * 100)}>
              <TouchableOpacity 
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.categoryBtn, 
                  { backgroundColor: theme.input, borderColor: theme.border },
                  activeCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
              >
                <Text style={[
                  styles.categoryText, 
                  { color: theme.subtext },
                  activeCategory === cat && { color: isDarkMode ? '#030213' : '#ffffff' }
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Events Timeline */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Events</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: theme.subtext }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeline}>
          {events
            .filter(e => activeCategory === 'All' || e.category === activeCategory)
            .map((event, index) => (
            <Animated.View 
              key={String(event.id) || index.toString()} 
              entering={FadeInUp.delay(700 + index * 150)}
              layout={Layout.springify()}
              style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.eventImageContainer}>
                {event.image ? (
                  <Image source={{ uri: event.image }} style={styles.eventImage} />
                ) : (
                  <View style={[styles.eventImage, { backgroundColor: theme.input, justifyContent: 'center', alignItems: 'center' }]}>
                    <Star color={theme.subtext} size={32} />
                  </View>
                )}
                <View style={[styles.categoryBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}>
                  <Text style={[styles.categoryBadgeText, { color: theme.accent, fontWeight: '700' }]}>{event.category || 'Event'}</Text>
                </View>
              </View>
              
              <View style={styles.eventInfo}>
                <View style={styles.eventMeta}>
                  <Text style={[styles.eventDate, { color: theme.primary, fontWeight: '600' }]}>{event.date}</Text>
                  <Text style={[styles.eventDot, { color: theme.subtext }]}>•</Text>
                  <Text style={[styles.eventTime, { color: theme.subtext }]}>{event.time}</Text>
                </View>
                <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
                
                <View style={styles.eventFooter}>
                  <View style={styles.participants}>
                    <Users size={16} color={theme.subtext} />
                    <Text style={[styles.participantText, { color: theme.subtext }]}>{event.participants || 0} joined</Text>
                  </View>
                  
                  {requestedEvents.includes(String(event.id)) ? (
                    <View style={[styles.pendingBadge, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                      <Text style={[styles.pendingText, { color: theme.accent, fontWeight: '700' }]}>En attente</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.requestBtn, { backgroundColor: theme.primary }]}
                      onPress={() => handleRequest(event.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.requestBtnText, { color: '#ffffff' }]}>Demande</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
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
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#717182',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#030213',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f3f3f5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3366',
    borderWidth: 2,
    borderColor: '#f3f3f5',
  },
  liveCard: {
    marginHorizontal: 24,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#030213',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  liveGradient: {
    padding: 24,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3366',
  },
  liveLabel: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  liveDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 20,
  },
  joinNowBtn: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinNowText: {
    color: '#030213',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#030213',
  },
  seeAllText: {
    color: '#717182',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryScroll: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  categoryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f3f3f5',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  activeCategoryBtn: {
    backgroundColor: '#030213',
    borderColor: '#030213',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#717182',
  },
  activeCategoryText: {
    color: '#ffffff',
  },
  timeline: {
    paddingHorizontal: 24,
    gap: 20,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
    gap: 16,
  },
  eventImageContainer: {
    width: 100,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#030213',
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#ff3366',
    fontWeight: '700',
  },
  eventDot: {
    color: '#717182',
    fontSize: 12,
  },
  eventTime: {
    fontSize: 12,
    color: '#717182',
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#030213',
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantText: {
    fontSize: 12,
    color: '#717182',
    fontWeight: '500',
  },
  detailBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f3f3f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBtn: {
    backgroundColor: '#030213',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  requestBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: 'rgba(113, 113, 130, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(113, 113, 130, 0.2)',
  },
  pendingText: {
    color: '#717182',
    fontSize: 12,
    fontWeight: '600',
  },
});
