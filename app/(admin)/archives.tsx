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
  Info
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
  
  // AI Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I'm the VITAL Archivist AI. I have access to all historical records, budget reports, and member data. What would you like to know?", sender: 'ai', timestamp: 'Now' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const res = await api.get('/events'); // fallback to all events if no archived exist
      setArchives(res.data.events || []);
    } catch (err) {
      console.error('Error fetching archives:', err);
    }
  };

  const filteredArchives = archives.filter(archive =>
    (selectedCategory === 'All' || archive.category === selectedCategory) &&
    ((archive.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                          <Text style={[styles.archiveTitle, { color: theme.text }]}>{item.title}</Text>
                          <View style={styles.tagRow}>
                            <Text style={[styles.categoryLabel, { color: theme.primary }]}>{item.category || 'Record'}</Text>
                            <View style={styles.dot} />
                            <Text style={[styles.dateLabel, { color: theme.subtext }]}>{item.date}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.archiveSnippet, { color: theme.subtext }]} numberOfLines={2}>
                        {item.description || 'No description available for this historical record.'}
                      </Text>
                      <View style={styles.cardFooter}>
                        <View style={styles.authorBox}>
                          <User size={12} color={theme.subtext} />
                          <Text style={[styles.authorName, { color: theme.subtext }]}>System</Text>
                        </View>
                        <TouchableOpacity style={styles.viewBtn}>
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
});
