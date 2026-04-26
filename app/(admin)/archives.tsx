import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Bot, 
  ChevronLeft, 
  Filter, 
  Sparkles, 
  Send,
  MessageSquare,
  Zap,
  Info,
  X,
  MapPin,
  Users,
  DollarSign,
  AlertTriangle,
  Award
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  FadeIn,
  Layout, 
  SlideInRight,
  SlideInLeft 
} from 'react-native-reanimated';

import api from '@/services/api';

const { width, height } = Dimensions.get('window');

interface ArchiveEntry {
  id: number;
  title: string;
  date: string;
  author: string;
  category: string;
  content: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

const authors = ['Sarah Chen', 'Marcus Johnson', 'Emma Williams', 'David Park', 'Lisa Anderson'];
const categories = ['Meeting Minutes', 'Event Report', 'Budget Analysis', 'Member Survey', 'Project Proposal'];

// generateMockArchives removed to use live archived events

export default function ArchivesScreen() {
  const { theme, isDarkMode } = useTheme();
  const [archives, setArchives] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // AI Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I'm the VITAL Archivist AI. I have access to all historical records, budget reports, and member data. What would you like to know?", sender: 'ai', timestamp: 'Now' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchArchives(true);
  }, []);

  const fetchArchives = async (reset = false) => {
    try {
      if (reset) {
        setIsLoadingMore(true);
        const res = await api.get('/ai/historical-events?limit=10&offset=0');
        const evts = res.data.events || [];
        setArchives(evts);
        setOffset(10);
        setHasMore(evts.length === 10);
        setIsLoadingMore(false);
      } else {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        const res = await api.get(`/ai/historical-events?limit=10&offset=${offset}`);
        const evts = res.data.events || [];
        setArchives(prev => [...prev, ...evts]);
        setOffset(prev => prev + 10);
        setHasMore(evts.length === 10);
        setIsLoadingMore(false);
      }
    } catch (err) {
      console.error('Error fetching archives:', err);
      setIsLoadingMore(false);
    }
  };

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const paddingToBottom = 50;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      fetchArchives(false);
    }
  };

  const filteredArchives = archives.filter(archive =>
    (selectedCategory === 'All' || archive.category === selectedCategory) &&
    ((archive.event_name || archive.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (archive.category || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: chatMessage,
      sender: 'user',
      timestamp: 'Now'
    };

    setMessages(prev => [...prev, newUserMsg]);
    const currentMessage = chatMessage;
    setChatMessage('');
    setIsAiTyping(true);

    try {
      // Import api at the top if not already, or use a local fetch if we haven't imported it.
      // Wait, I should add the import at the top of the file in another chunk.
      const res = await api.post('/ai/archivist', { question: currentMessage });
      const aiResponse = res.data.answer || "I couldn't process that query.";
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: 'Now'
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Error:', err);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the knowledge base right now.",
        sender: 'ai',
        timestamp: 'Now'
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsAiTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ChevronLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Archives</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>Knowledge Base Repository</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setIsChatOpen(!isChatOpen)} 
            style={[styles.aiToggle, { backgroundColor: isChatOpen ? theme.primary : theme.card, borderColor: theme.border }]}
          >
            <Bot size={22} color={isChatOpen ? '#ffffff' : theme.primary} />
          </TouchableOpacity>
        </View>

        {!isChatOpen ? (
          <View style={{ flex: 1 }}>
            <View style={styles.searchSection}>
              <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Search size={18} color={theme.subtext} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search documents..."
                  placeholderTextColor={theme.subtext}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.filterBtn}>
                  <Filter size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.categoriesSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                {['All', ...categories].map((cat, i) => (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryChip, 
                      { backgroundColor: selectedCategory === cat ? theme.primary : theme.card, borderColor: theme.border }
                    ]}
                  >
                    <Text style={[styles.categoryText, { color: selectedCategory === cat ? '#ffffff' : theme.text }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={400}
            >
              <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
                <TouchableOpacity onPress={() => setIsChatOpen(true)}>
                  <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.aiInsightCard}>
                    <View style={styles.aiHeader}>
                      <Sparkles size={20} color="#ffffff" />
                      <Text style={styles.aiTitle}>RAG Archivist Active</Text>
                    </View>
                    <Text style={styles.aiText}>"Regional performance peaked in Q1 2026. Tap here to ask specific questions about the data."</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Historical Records</Text>
                <View style={styles.archiveList}>
                  {filteredArchives.map((item, index) => (
                    <Animated.View 
                      key={item._id || index} 
                      entering={FadeInUp.delay(300 + index * 50)}
                      style={[styles.archiveCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <View style={styles.cardTop}>
                        <View style={[styles.iconBox, { backgroundColor: theme.input }]}>
                          <FileText size={20} color={theme.primary} />
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={[styles.archiveTitle, { color: theme.text }]}>{item.category || 'Record'}</Text>
                          <View style={styles.tagRow}>
                            <Text style={[styles.categoryLabel, { color: theme.primary }]}>{item.event_name || item.title}</Text>
                            <View style={styles.dot} />
                            <Text style={[styles.dateLabel, { color: theme.subtext }]}>{item.event_date || item.date}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.archiveSnippet, { color: theme.subtext }]} numberOfLines={2}>
                        {item.main_issue || item.description || 'No description available for this historical record.'}
                      </Text>
                      <View style={styles.cardFooter}>
                        <View style={styles.authorBox}>
                          <User size={12} color={theme.subtext} />
                          <Text style={[styles.authorName, { color: theme.subtext }]}>System</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.viewBtn}
                          onPress={() => setSelectedEvent(item)}
                        >
                          <Text style={[styles.viewBtnText, { color: theme.primary }]}>View Full</Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        ) : (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatContainer}
          >
            <View style={[styles.chatHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.aiInfo}>
                <View style={[styles.aiAvatar, { backgroundColor: theme.primary }]}>
                  <Bot size={20} color="#ffffff" />
                </View>
                <View>
                  <Text style={[styles.aiName, { color: theme.text }]}>Archivist AI</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                    <Text style={[styles.statusTxt, { color: '#10b981' }]}>Querying Records</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsChatOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.input }]}>
                <MessageSquare size={18} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              ref={scrollRef}
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.messageList}
            >
              {messages.map((msg, i) => (
                <Animated.View 
                  key={msg.id} 
                  entering={msg.sender === 'ai' ? SlideInLeft : SlideInRight}
                  style={[
                    styles.messageBubble, 
                    msg.sender === 'ai' 
                      ? [styles.aiBubble, { backgroundColor: theme.input }] 
                      : [styles.userBubble, { backgroundColor: theme.primary }]
                  ]}
                >
                  <Text style={[
                    styles.messageText, 
                    { color: msg.sender === 'ai' ? theme.text : '#ffffff' }
                  ]}>
                    {msg.text}
                  </Text>
                  <Text style={[
                    styles.messageTime, 
                    { color: msg.sender === 'ai' ? theme.subtext : 'rgba(255,255,255,0.7)' }
                  ]}>
                    {msg.timestamp}
                  </Text>
                </Animated.View>
              ))}
              {isAiTyping && (
                <Animated.View entering={FadeIn} style={[styles.messageBubble, styles.aiBubble, { backgroundColor: theme.input }]}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </Animated.View>
              )}
            </ScrollView>

            <View style={[styles.chatInputSection, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
              <View style={[styles.chatInputWrapper, { backgroundColor: theme.input }]}>
                <TextInput
                  style={[styles.chatInput, { color: theme.text }]}
                  placeholder="Ask about archives..."
                  placeholderTextColor={theme.subtext}
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  multiline
                />
                <TouchableOpacity onPress={handleSendMessage} style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
                  <Send size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* Event Details Modal */}
        <Modal visible={!!selectedEvent} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedEvent?.category || 'Event Details'}</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>{selectedEvent?.event_name || selectedEvent?.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedEvent(null)} style={[styles.closeBtn, { backgroundColor: theme.input }]}>
                  <X size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Info Cards */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <View style={[styles.detailBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <Calendar size={18} color={theme.primary} />
                    <Text style={[styles.detailBoxLabel, { color: theme.subtext }]}>Date</Text>
                    <Text style={[styles.detailBoxValue, { color: theme.text }]}>{selectedEvent?.event_date || 'N/A'}</Text>
                  </View>
                  <View style={[styles.detailBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <MapPin size={18} color={theme.accent} />
                    <Text style={[styles.detailBoxLabel, { color: theme.subtext }]}>Location</Text>
                    <Text style={[styles.detailBoxValue, { color: theme.text }]}>{selectedEvent?.location || 'N/A'}</Text>
                  </View>
                  <View style={[styles.detailBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <Users size={18} color="#10b981" />
                    <Text style={[styles.detailBoxLabel, { color: theme.subtext }]}>Attendees</Text>
                    <Text style={[styles.detailBoxValue, { color: theme.text }]}>{selectedEvent?.participants || 0}</Text>
                  </View>
                </View>

                {/* Financials */}
                <View style={[styles.sectionBlock, { backgroundColor: theme.input, borderColor: theme.border }]}>
                  <Text style={[styles.blockTitle, { color: theme.text }]}>Financials</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <View>
                      <Text style={[styles.financialLabel, { color: theme.subtext }]}>Budget</Text>
                      <Text style={[styles.financialValue, { color: theme.text }]}>{selectedEvent?.budget_tnd} TND</Text>
                    </View>
                    <View>
                      <Text style={[styles.financialLabel, { color: theme.subtext }]}>Revenue</Text>
                      <Text style={[styles.financialValue, { color: '#10b981' }]}>+{selectedEvent?.revenue_tnd} TND</Text>
                    </View>
                  </View>
                </View>

                {/* Performance & Issues */}
                <View style={[styles.sectionBlock, { backgroundColor: theme.input, borderColor: theme.border }]}>
                  <Text style={[styles.blockTitle, { color: theme.text }]}>Retrospective</Text>
                  
                  <View style={styles.retroItem}>
                    <Award size={16} color={theme.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.retroLabel, { color: theme.text }]}>Satisfaction Score</Text>
                      <Text style={[styles.retroValue, { color: theme.subtext }]}>{selectedEvent?.satisfaction_score} / 10</Text>
                    </View>
                  </View>

                  <View style={styles.retroItem}>
                    <AlertTriangle size={16} color="#f59e0b" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.retroLabel, { color: theme.text }]}>Main Issue</Text>
                      <Text style={[styles.retroValue, { color: theme.subtext }]}>{selectedEvent?.main_issue || 'None reported'}</Text>
                    </View>
                  </View>

                  <View style={styles.retroItem}>
                    <Info size={16} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.retroLabel, { color: theme.text }]}>Secondary Issue</Text>
                      <Text style={[styles.retroValue, { color: theme.subtext }]}>{selectedEvent?.secondary_issue || 'None reported'}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
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
  aiToggle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  aiInsightCard: {
    borderRadius: 24,
    padding: 18,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  aiText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  archiveList: {
    gap: 12,
  },
  archiveCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  archiveTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94a3b8',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  archiveSnippet: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  authorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Chat Styles
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiName: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTxt: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 20,
    gap: 16,
  },
  messageBubble: {
    maxWidth: width * 0.8,
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
  chatInputSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  chatInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  chatInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  detailBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  detailBoxValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionBlock: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  financialLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  retroItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  retroLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  retroValue: {
    fontSize: 13,
    lineHeight: 18,
  },
});
