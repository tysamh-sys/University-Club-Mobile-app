import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Plus, Edit2, Trash2, Calendar, Users, Star as Sparkles, Activity as DollarSign, ClipboardList, Check, X, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ParticipationRequest {
  id: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

import api from '@/services/api';

interface Event {
  _id: string;
  title: string;
  date: string;
  participants: number;
  budget: number;
  description: string;
  requests: ParticipationRequest[];
}

export default function EventManagement() {
  const { theme, isDarkMode } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      Alert.alert('Error', 'Could not load events.');
    } finally {
      setLoading(false);
    }
  };
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingRequests, setViewingRequests] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    participants: 0
  });
  const [aiGenerated, setAiGenerated] = useState<{
    date: string;
    budget: number;
    description: string;
  } | null>(null);

  const generateWithAI = () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 14) + 7);
    const budgetEstimate = newEvent.participants * (15 + Math.floor(Math.random() * 10));
    const descriptions = [
      `An engaging workshop designed to bring together members for knowledge sharing.`,
      `Join us for a session featuring expert speakers and interactive networking.`,
      `Experience hands-on activities and collaborative learning in a dynamic environment.`
    ];

    setAiGenerated({
      date: futureDate.toISOString().split('T')[0],
      budget: budgetEstimate,
      description: descriptions[Math.floor(Math.random() * descriptions.length)]
    });
  };

  const createEvent = async () => {
    if (!newEvent.title || !aiGenerated) return;
    try {
      const eventPayload = {
        title: newEvent.title,
        date: aiGenerated.date,
        participants: newEvent.participants,
        budget: aiGenerated.budget,
        description: aiGenerated.description
      };
      const res = await api.post('/events', eventPayload);
      if (res.data.event) {
        setEvents([...events, res.data.event]);
      }
      setShowCreateModal(false);
      setNewEvent({ title: '', participants: 0 });
      setAiGenerated(null);
    } catch (err) {
      console.error('Error creating event:', err);
      Alert.alert('Error', 'Failed to create event.');
    }
  };

  const deleteEvent = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/events/${id}`);
            setEvents(events.filter(e => e._id !== id));
          } catch (err) {
            console.error('Error deleting event:', err);
            Alert.alert('Error', 'Failed to delete event.');
          }
      } }
    ]);
  };

  const handleRequest = async (eventId: string, requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/events/requests/${requestId}/${status}`);
      setEvents(events.map(e => {
        if (e._id === eventId) {
          return {
            ...e,
            requests: (e.requests || []).map(r => r.id === requestId ? { ...r, status } : r)
          };
        }
        return e;
      }));
      
      if (viewingRequests && viewingRequests._id === eventId) {
        setViewingRequests(prev => {
          if (!prev) return null;
          return {
            ...prev,
            requests: (prev.requests || []).map(r => r.id === requestId ? { ...r, status } : r)
          };
        });
      }
    } catch (err) {
      console.error('Error updating request:', err);
      Alert.alert('Error', 'Failed to update request status.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.text }]}>Events</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <LinearGradient
              colors={[theme.primary, '#4f46e5']}
              style={styles.addButton}
            >
              <Plus size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Manage organization activities</Text>
      </View>

      <ScrollView contentContainerStyle={styles.eventsList} showsVerticalScrollIndicator={false}>
        {events.map((event) => (
          <Animated.View 
            key={event._id} 
            entering={FadeInUp}
            style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
                <Text style={[styles.eventDescription, { color: theme.subtext }]}>{event.description}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity 
                  onPress={() => setViewingRequests(event)} 
                  style={[styles.actionButton, { backgroundColor: theme.input }]}
                >
                  <ClipboardList size={18} color={theme.primary} />
                  {(event.requests || []).filter(r => r.status === 'pending').length > 0 && (
                    <View style={[styles.badge, { backgroundColor: theme.accent }]} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setEditingEvent(event)} 
                  style={[styles.actionButton, { backgroundColor: theme.input }]}
                >
                  <Edit2 size={18} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => deleteEvent(event._id)} 
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
                <View style={styles.statLabelRow}>
                  <Calendar size={14} color={theme.primary} />
                  <Text style={[styles.statLabel, { color: theme.subtext }]}>Date</Text>
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{new Date(event.date).toLocaleDateString()}</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
                <View style={styles.statLabelRow}>
                  <Users size={14} color={theme.accent} />
                  <Text style={[styles.statLabel, { color: theme.subtext }]}>Attendees</Text>
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{event.participants}</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
                <View style={styles.statLabelRow}>
                  <DollarSign size={14} color="#10b981" />
                  <Text style={[styles.statLabel, { color: theme.subtext }]}>Budget</Text>
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>${event.budget}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Requests Modal */}
      <Modal visible={!!viewingRequests} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, height: '70%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Participation Requests</Text>
                <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>{viewingRequests?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setViewingRequests(null)} style={[styles.closeBtn, { backgroundColor: theme.input }]}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.requestList}>
              {(!viewingRequests?.requests || viewingRequests.requests.length === 0) ? (
                <View style={styles.emptyState}>
                  <Users size={48} color={theme.border} />
                  <Text style={[styles.emptyText, { color: theme.subtext }]}>No requests yet</Text>
                </View>
              ) : (
                viewingRequests?.requests.map((request) => (
                  <View key={request.id} style={[styles.requestCard, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <View style={[styles.userAvatar, { backgroundColor: theme.primary + '20' }]}>
                      <User size={20} color={theme.primary} />
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={[styles.requestName, { color: theme.text }]}>{request.userName}</Text>
                      <Text style={[styles.requestEmail, { color: theme.subtext }]}>{request.userEmail}</Text>
                      <Text style={[styles.requestTime, { color: theme.subtext }]}>{request.timestamp}</Text>
                    </View>
                    
                    {request.status === 'pending' ? (
                      <View style={styles.requestActions}>
                        <TouchableOpacity 
                          onPress={() => handleRequest(viewingRequests._id, request.id, 'accepted')}
                          style={[styles.requestActionBtn, { backgroundColor: theme.accent }]}
                        >
                          <Check size={18} color="#ffffff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleRequest(viewingRequests._id, request.id, 'rejected')}
                          style={[styles.requestActionBtn, { backgroundColor: '#ef4444' }]}
                        >
                          <X size={18} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: request.status === 'accepted' ? theme.accent + '20' : '#ef444420' }]}>
                        <Text style={[styles.statusText, { color: request.status === 'accepted' ? theme.accent : '#ef4444' }]}>
                          {request.status.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Modal (Minimal Redesign) */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create Event</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Event Name</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                    value={newEvent.title}
                    onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                    placeholder="Tech Workshop"
                    placeholderTextColor={theme.subtext}
                  />
                </View>
                <TouchableOpacity onPress={generateWithAI} style={styles.aiBtn}>
                  <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.aiBtnGradient}>
                    <Sparkles size={20} color="#ffffff" />
                    <Text style={styles.aiBtnText}>AI Assistant</Text>
                  </LinearGradient>
                </TouchableOpacity>
                {aiGenerated && (
                  <View style={[styles.aiResult, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <Text style={[styles.aiResultValue, { color: theme.text }]}>{aiGenerated.description}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={[styles.cancelBtn, { backgroundColor: theme.input }]}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createEvent} style={{ flex: 1 }}>
                <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Launch</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventsList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  eventCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestList: {
    gap: 12,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '700',
  },
  requestEmail: {
    fontSize: 12,
    fontWeight: '500',
  },
  requestTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  modalInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    fontSize: 15,
  },
  aiBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  aiBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  aiBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  aiResult: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  aiResultValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
