import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Send, ArrowLeft, MoreVertical, ShieldCheck, Clock, Check, CheckCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import Animated, { 
  FadeInUp, 
  FadeInRight, 
  FadeIn,
  Layout, 
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';

import api from '@/services/api';
import { initCrypto, encryptMessage, decryptMessage } from '@/services/cryptoService';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  public_key: string;
  lastMessage?: string;
  timestamp?: string;
  online?: boolean;
  avatar?: string;
  color: [string, string];
}

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

const AVATAR_COLORS: [string, string][] = [
  ['#FF3366', '#FF6B6B'],
  ['#4facfe', '#00f2fe'],
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
];

export default function ChatScreen() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    setupChat();
  }, []);

  const setupChat = async () => {
    try {
      await initCrypto();
      fetchUsers();
    } catch (err) {
      console.error('Failed to init crypto:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/chat/users');
      const mapped = res.data.users.map((u: any, idx: number) => ({
        ...u,
        avatar: u.name.substring(0, 2).toUpperCase(),
        color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
        online: Math.random() > 0.3,
        timestamp: 'Active now',
        lastMessage: u.public_key ? '🔒 Secure connection ready' : 'Waiting for setup...'
      }));
      setUsers(mapped);
    } catch (err) {
      console.error('Failed to load chat users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      setMessages([]); // Clear messages immediately when switching user
      setMessagesLoading(true);
      loadMessages();
      const interval = setInterval(loadMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedUser?.id]);

  const loadMessages = async () => {
    if (!selectedUser || !selectedUser.public_key) {
      setMessagesLoading(false);
      return;
    }
    try {
      const res = await api.get(`/chat/messages/${selectedUser.id}`);
      const rawMessages = res.data.messages || [];
      
      const decryptedMessages: Message[] = [];
      for (const msg of rawMessages) {
        try {
          const text = await decryptMessage(msg.encrypted_message, msg.nonce, selectedUser.public_key);
          decryptedMessages.push({
            id: msg.id,
            text,
            sender: msg.sender_id === user?.id ? 'me' : 'them',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read'
          });
        } catch (e) {
          decryptedMessages.push({
            id: msg.id,
            text: '🔒 [Decryption failed]',
            sender: msg.sender_id === user?.id ? 'me' : 'them',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read'
          });
        }
      }
      setMessages(decryptedMessages);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUser) return;
    
    if (!selectedUser.public_key) {
      Alert.alert('E2EE Security', 'The recipient has not set up their encryption keys yet.');
      return;
    }

    const currentText = messageText;
    setMessageText('');

    try {
      const { encryptedMessage, nonce } = await encryptMessage(currentText, selectedUser.public_key);
      const res = await api.post('/chat/message', {
        receiverId: selectedUser.id,
        encryptedMessage,
        nonce
      });

      const newMessage: Message = {
        id: res.data.data.id,
        text: currentText,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };
      setMessages(prev => [...prev, newMessage]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('Failed to send message', err);
      Alert.alert('Transmission Error', 'Your message could not be sent. Please check your connection.');
      setMessageText(currentText); // Restore text on failure
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Chat Header */}
        <LinearGradient
          colors={isDarkMode ? ['#1e1b4b', '#020617'] : ['#f1f5f9', '#ffffff']}
          style={[styles.chatHeader, { paddingTop: insets.top }]}
        >
          <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.iconBtn}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerProfile}>
            <LinearGradient
              colors={selectedUser.color}
              style={styles.avatarMini}
            >
              <Text style={styles.avatarMiniText}>{selectedUser.avatar}</Text>
            </LinearGradient>
            <View>
              <Text style={[styles.headerName, { color: theme.text }]}>{selectedUser.name}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: selectedUser.online ? '#10b981' : '#94a3b8' }]} />
                <Text style={[styles.statusText, { color: theme.subtext }]}>
                  {selectedUser.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.iconBtn}>
            <MoreVertical size={24} color={theme.text} />
          </TouchableOpacity>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={{ flex: 1 }}>
            {messagesLoading && messages.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : (
              <ScrollView 
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={styles.messagesContainer}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              >
              <View style={styles.securityBanner}>
                <ShieldCheck size={14} color={theme.subtext} />
                <Text style={[styles.securityText, { color: theme.subtext }]}>
                  Messages are end-to-end encrypted.
                </Text>
              </View>

              {messages.map((msg, idx) => (
                <Animated.View 
                  key={msg.id || idx}
                  entering={FadeInUp.delay(50)}
                  style={[
                    styles.messageWrapper,
                    msg.sender === 'me' ? styles.myMessageWrapper : styles.theirMessageWrapper
                  ]}
                >
                  <View style={[
                    styles.bubble,
                    msg.sender === 'me' ? [styles.myBubble, { backgroundColor: theme.primary }] : [styles.theirBubble, { backgroundColor: theme.card, borderColor: theme.border }]
                  ]}>
                    <Text style={[
                      styles.messageText,
                      { color: msg.sender === 'me' ? '#ffffff' : theme.text }
                    ]}>
                      {msg.text}
                    </Text>
                    <View style={styles.messageFooter}>
                      <Text style={[
                        styles.msgTimestamp,
                        { color: msg.sender === 'me' ? 'rgba(255,255,255,0.7)' : theme.subtext }
                      ]}>
                        {msg.timestamp}
                      </Text>
                      {msg.sender === 'me' && (
                        <CheckCheck size={14} color="rgba(255,255,255,0.8)" />
                      )}
                    </View>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          )}
          </View>

          {/* Input Area */}
          <View style={[styles.inputArea, { backgroundColor: theme.card, paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.input, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type your message..."
                placeholderTextColor={theme.subtext}
                multiline
              />
              <TouchableOpacity 
                onPress={sendMessage} 
                disabled={!messageText.trim()}
                style={[styles.sendBtn, !messageText.trim() && { opacity: 0.5 }]}
              >
                <LinearGradient
                  colors={[theme.primary, '#4f46e5']}
                  style={styles.sendGradient}
                >
                  <Send size={20} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Secure Club Communication</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.input, borderColor: theme.border }]}>
          <Search size={20} color={theme.subtext} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search members..."
            placeholderTextColor={theme.subtext}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.userList}>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.subtext }}>No members found</Text>
            </View>
          ) : (
            filteredUsers.map((item, idx) => (
              <Animated.View 
                key={item.id} 
                entering={FadeInRight.delay(idx * 100)}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  onPress={() => setSelectedUser(item)}
                  style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarWrapper}>
                    <LinearGradient
                      colors={item.color}
                      style={styles.avatarLarge}
                    >
                      <Text style={styles.avatarTextLarge}>{item.avatar}</Text>
                    </LinearGradient>
                    {item.online && <View style={styles.onlineIndicator} />}
                  </View>

                  <View style={styles.userCardInfo}>
                    <View style={styles.userCardTop}>
                      <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[styles.timeLabel, { color: theme.subtext }]}>{item.timestamp}</Text>
                    </View>
                    <Text style={[styles.previewText, { color: theme.subtext }]} numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  userList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextLarge: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userCardInfo: {
    flex: 1,
    gap: 4,
  },
  userCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messagesContainer: {
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    borderRadius: 12,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  messageWrapper: {
    maxWidth: '85%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  msgTimestamp: {
    fontSize: 10,
    fontWeight: '700',
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    maxHeight: 120,
  },
  sendBtn: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
