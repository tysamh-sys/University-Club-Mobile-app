import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Send, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';

import api from '@/services/api';
import { initCrypto, encryptMessage, decryptMessage } from '@/services/cryptoService';
import { useAuth } from '@/context/AuthContext';

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
  color?: string[];
}

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

const colors = [
  ['#FF3366', '#FF6B6B'],
  ['#4facfe', '#00f2fe'],
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#43e97b', '#38f9d7']
];

export default function ChatScreen() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [myPublicKey, setMyPublicKey] = useState('');

  React.useEffect(() => {
    setupChat();
  }, []);

  const setupChat = async () => {
    try {
      const keys = await initCrypto();
      setMyPublicKey(keys.publicKey);
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
        color: colors[idx % colors.length],
        online: Math.random() > 0.5,
        timestamp: '',
        lastMessage: u.public_key ? 'Ready to chat securely' : 'User not ready'
      }));
      setUsers(mapped);
    } catch (err) {
      console.error('Failed to load chat users', err);
    }
  };

  React.useEffect(() => {
    if (selectedUser) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const loadMessages = async () => {
    if (!selectedUser || !selectedUser.public_key) return;
    try {
      const res = await api.get(`/chat/messages/${selectedUser.id}`);
      const rawMessages = res.data.messages || [];
      
      const decryptedMessages: Message[] = [];
      for (const msg of rawMessages) {
        try {
          const senderPubKey = msg.sender_id === user?.id ? selectedUser.public_key : selectedUser.public_key;
          // Wait, actually if I am the sender, I encrypt with THEIR public key, but I CANNOT decrypt it later with my private key + their public key unless I decrypt it as the sender?
          // No, nacl.box decrypt uses (senderPubKey, mySecretKey).
          // If I sent the message, it was encrypted with (mySecretKey, theirPubKey). 
          // Wait, Box is symmetric in keys! nacl.box.open(..., nonce, theirPubKey, mySecretKey) works to decrypt messages sent BY me to THEM!
          
          const text = await decryptMessage(msg.encrypted_message, msg.nonce, selectedUser.public_key);
          decryptedMessages.push({
            id: msg.id,
            text,
            sender: msg.sender_id === user?.id ? 'me' : 'them',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        } catch (e) {
          decryptedMessages.push({
            id: msg.id,
            text: '🔒 [Decryption failed]',
            sender: msg.sender_id === user?.id ? 'me' : 'them',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }
      setMessages(decryptedMessages);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUser || !selectedUser.public_key) return;
    try {
      const { encryptedMessage, nonce } = await encryptMessage(messageText, selectedUser.public_key);
      
      const res = await api.post('/chat/message', {
        receiverId: selectedUser.id,
        encryptedMessage,
        nonce
      });

      const newMessage: Message = {
        id: res.data.data.id,
        text: messageText,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (selectedUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.chatHeader, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={selectedUser.color}
              style={styles.avatarSmall}
            >
              <Text style={styles.avatarTextSmall}>{selectedUser.avatar}</Text>
            </LinearGradient>
            {selectedUser.online && <View style={[styles.onlineDotSmall, { borderColor: theme.background }]} />}
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: theme.text }]}>{selectedUser.name}</Text>
            <Text style={[styles.headerStatus, { color: theme.subtext }]}>{selectedUser.online ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.messagesList} 
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <Animated.View 
                key={message.id} 
                entering={FadeInUp.delay(index * 50)}
                style={[
                  styles.messageWrapper,
                  message.sender === 'me' ? styles.myMessageWrapper : styles.theirMessageWrapper
                ]}
              >
                <View style={[
                  styles.messageBubble,
                  message.sender === 'me' ? styles.myMessageBubble : [styles.theirMessageBubble, { backgroundColor: theme.input, borderColor: theme.border }]
                ]}>
                  {message.sender === 'me' ? (
                    <LinearGradient
                      colors={['#030213', '#717182']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientBubble}
                    >
                      <Text style={styles.myMessageText}>{message.text}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.theirMessageText, { color: theme.text }]}>{message.text}</Text>
                  )}
                </View>
                <Text style={[styles.timestamp, { color: theme.subtext }]}>{message.timestamp}</Text>
              </Animated.View>
            ))}
          </ScrollView>

          <View style={[
            styles.inputArea, 
            { 
              backgroundColor: theme.card, 
              borderTopColor: theme.border,
              paddingBottom: insets.bottom + 12
            }
          ]}>
            <View style={[styles.inputContainer, { backgroundColor: theme.input }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                placeholderTextColor={theme.subtext}
                multiline
              />
              <TouchableOpacity onPress={sendMessage} disabled={!messageText.trim()}>
                <LinearGradient
                  colors={['#030213', '#4a4a5a']}
                  style={styles.sendButton}
                >
                  <Send size={18} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Connect with your club members</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.input, borderColor: theme.border }]}>
          <Search size={20} color={theme.subtext} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users..."
            placeholderTextColor={theme.subtext}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.usersList} showsVerticalScrollIndicator={false}>
        {filteredUsers.map((user, index) => (
          <Animated.View 
            key={user.id} 
            entering={FadeInRight.delay(index * 100)}
            layout={Layout.springify()}
          >
            <TouchableOpacity
              onPress={() => setSelectedUser(user)}
              activeOpacity={0.7}
              style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={user.color}
                  style={styles.avatarLarge}
                >
                  <Text style={styles.avatarTextLarge}>{user.avatar}</Text>
                </LinearGradient>
                {user.online && <View style={[styles.onlineDotLarge, { borderColor: theme.card }]} />}
              </View>

              <View style={styles.userCardContent}>
                <View style={styles.userNameRow}>
                  <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
                  <Text style={[styles.userTimestamp, { color: theme.subtext }]}>{user.timestamp}</Text>
                </View>
                <Text style={[styles.lastMessage, { color: theme.subtext }]} numberOfLines={1}>{user.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchInputWrapper: {
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
  usersList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  userCard: {
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
  avatarContainer: {
    position: 'relative',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextLarge: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  onlineDotLarge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00ff88',
    borderWidth: 3,
  },
  userCardContent: {
    flex: 1,
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  lastMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  userTimestamp: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  onlineDotSmall: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff88',
    borderWidth: 2,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    padding: 20,
    gap: 16,
  },
  messageWrapper: {
    maxWidth: '85%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    borderBottomLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
  },
  gradientBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  myMessageText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  theirMessageText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    marginHorizontal: 8,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
