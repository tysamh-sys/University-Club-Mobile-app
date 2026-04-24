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

interface User {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  online: boolean;
  avatar: string;
  color: string[];
}

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

const mockUsers: User[] = [
  { id: 1, name: 'Sarah Chen', lastMessage: 'See you at the workshop!', timestamp: '2m ago', online: true, avatar: 'SC', color: ['#FF3366', '#FF6B6B'] },
  { id: 2, name: 'Marcus Johnson', lastMessage: 'Thanks for the info', timestamp: '15m ago', online: true, avatar: 'MJ', color: ['#4facfe', '#00f2fe'] },
  { id: 3, name: 'Emma Williams', lastMessage: 'Looking forward to it', timestamp: '1h ago', online: false, avatar: 'EW', color: ['#667eea', '#764ba2'] },
  { id: 4, name: 'David Park', lastMessage: 'Got the details', timestamp: '3h ago', online: true, avatar: 'DP', color: ['#f093fb', '#f5576c'] },
  { id: 5, name: 'Lisa Anderson', lastMessage: 'Perfect timing!', timestamp: '5h ago', online: false, avatar: 'LA', color: ['#43e97b', '#38f9d7'] }
];

export default function ChatScreen() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hey! Are you coming to the workshop tomorrow?', sender: 'them', timestamp: '10:30 AM' },
    { id: 2, text: 'Yes, definitely! What time does it start?', sender: 'me', timestamp: '10:32 AM' },
    { id: 3, text: 'It starts at 2 PM. Should be great!', sender: 'them', timestamp: '10:33 AM' },
    { id: 4, text: 'See you at the workshop!', sender: 'them', timestamp: '10:35 AM' }
  ]);

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendMessage = () => {
    if (!messageText.trim()) return;
    const newMessage: Message = {
      id: messages.length + 1,
      text: messageText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setMessageText('');
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
