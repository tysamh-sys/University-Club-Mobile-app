import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';

import { Edit2, Trash2, Shield, User as UserIcon, Search, MoreVertical, X, Check, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeIn, Layout, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface UserData {
  id: string | number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'member';
  department?: string;
  [key: string]: any;
}

export default function UserManagement() {
  const { theme, isDarkMode } = useTheme();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users from server.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleRole = async (user: UserData) => {
    try {
      const newRole = user.role === 'admin' ? 'member' : 'admin';
      await api.put(`/users/${user.id}`, { role: newRole });
      setUsers(users.map(u => (u.id === user.id ? { ...u, role: newRole } : u)));
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update user role.');
    }
  };

  const deleteUser = (userId: string | number) => {
    Alert.alert('Erase User Data?', 'This action is irreversible.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Erase', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await api.delete(`/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
          } catch (error) {
            console.error('Error deleting user:', error);
            Alert.alert('Error', 'Failed to delete user.');
          }
        } 
      }
    ]);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      const response = await api.put(`/users/${editingUser.id}`, editingUser);
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...response.data } : u));
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to save changes.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.text }]}>Users</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Manage organization access</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Search size={18} color={theme.subtext} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search directory..."
            placeholderTextColor={theme.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.usersList} showsVerticalScrollIndicator={false}>
        {filteredUsers.map((user, index) => (
          <Animated.View 
            key={user.id} 
            entering={FadeInUp.delay(200 + index * 50)}
            style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.cardMain}>
              <View style={[styles.avatarBox, { backgroundColor: user.role === 'admin' ? theme.primary + '20' : theme.input }]}>
                {user.role === 'admin' ? (
                  <Shield size={22} color={theme.primary} />
                ) : (
                  <UserIcon size={22} color={theme.subtext} />
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: theme.subtext }]}>{user.email}</Text>
                <View style={styles.tagRow}>
                  <View style={[styles.roleTag, { backgroundColor: user.role === 'admin' ? theme.primary : theme.input }]}>
                    <Text style={[styles.roleTagText, { color: user.role === 'admin' ? '#ffffff' : theme.text }]}>
                      {user.role.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.deptTag, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <Text style={[styles.deptTagText, { color: theme.subtext }]}>{user.department}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleRole(user)} style={[styles.shieldBtn, { backgroundColor: theme.input }]}>
                <Shield size={18} color={user.role === 'admin' ? theme.primary : theme.subtext} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => setEditingUser(user)} style={[styles.actionBtn, { backgroundColor: theme.input }]}>
                <Edit2 size={16} color={theme.text} />
                <Text style={[styles.actionBtnText, { color: theme.text }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteUser(user.id)} style={[styles.actionBtn, styles.deleteBtn]}>
                <Trash2 size={16} color="#ef4444" />
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editingUser} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditingUser(null)} style={[styles.closeBtn, { backgroundColor: theme.input }]}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                  value={editingUser?.name}
                  onChangeText={(text) => setEditingUser(editingUser ? { ...editingUser, name: text } : null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                  value={editingUser?.email}
                  onChangeText={(text) => setEditingUser(editingUser ? { ...editingUser, email: text } : null)}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Department</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                  value={editingUser?.department}
                  onChangeText={(text) => setEditingUser(editingUser ? { ...editingUser, department: text } : null)}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditingUser(null)} style={[styles.cancelBtn, { backgroundColor: theme.input }]}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={{ flex: 1 }}>
                <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.saveBtn}>
                  <Check size={20} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
    fontWeight: '600',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  usersList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  userCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  deptTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  deptTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  shieldBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionBtnText: {
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
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalForm: {
    maxHeight: 400,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
});
