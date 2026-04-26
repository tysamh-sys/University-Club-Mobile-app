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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Save, User, Lock, ChevronRight, Mail, Building, Bell, Shield, CircleHelp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [activeSection, setActiveSection] = useState<'profile' | 'password'>('profile');
  
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: user?.email || '',
    department: 'Engineering'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSaveProfile = () => {
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }
    Alert.alert('Success', 'Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>Optimize your workspace</Text>
          </Animated.View>

          {/* Profile Overview */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.profileOverview}>
            <LinearGradient
              colors={isDarkMode ? ['#4a4a5a', '#2a2a3a'] : ['#030213', '#2a2a3a']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{profileData.name.charAt(0)}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>{profileData.name}</Text>
              <Text style={[styles.profileRole, { color: theme.subtext }]}>{user?.role === 'admin' ? 'Administrator' : 'Club Member'}</Text>
            </View>
          </Animated.View>

          {/* Tab Switcher */}
          <Animated.View entering={FadeInUp.delay(600)} style={styles.tabWrapper}>
            <View style={[styles.tabs, { backgroundColor: theme.input }]}>
              <TouchableOpacity
                onPress={() => setActiveSection('profile')}
                style={[styles.tab, activeSection === 'profile' && styles.activeTab, activeSection === 'profile' && { backgroundColor: theme.card }]}
              >
                <Text style={[styles.tabText, activeSection === 'profile' ? { color: theme.text } : { color: theme.subtext }]}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveSection('password')}
                style={[styles.tab, activeSection === 'password' && styles.activeTab, activeSection === 'password' && { backgroundColor: theme.card }]}
              >
                <Text style={[styles.tabText, activeSection === 'password' ? { color: theme.text } : { color: theme.subtext }]}>Security</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Form Content */}
          <Animated.View 
            entering={FadeInUp.delay(800)} 
            layout={Layout.springify()}
            style={styles.formContainer}
          >
            {activeSection === 'profile' ? (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.input }]}>
                    <User size={20} color={theme.subtext} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={profileData.name}
                      onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                      placeholderTextColor={theme.subtext}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.input }]}>
                    <Mail size={20} color={theme.subtext} />
                    <TextInput
                      style={[styles.input, { color: theme.text, opacity: 0.6 }]}
                      value={profileData.email}
                      editable={false}
                      placeholderTextColor={theme.subtext}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Department</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.input }]}>
                    <Building size={20} color={theme.subtext} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={profileData.department}
                      onChangeText={(text) => setProfileData({ ...profileData, department: text })}
                      placeholderTextColor={theme.subtext}
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleSaveProfile} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[theme.primary, '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButton}
                  >
                    <Save size={20} color="#ffffff" />
                    <Text style={styles.buttonText}>Update Profile</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Current Password</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.input }]}>
                    <Lock size={20} color={theme.subtext} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={passwordData.currentPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                      placeholder="••••••••"
                      secureTextEntry
                      placeholderTextColor={theme.subtext}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.input }]}>
                    <Shield size={20} color={theme.subtext} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={passwordData.newPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                      placeholder="••••••••"
                      secureTextEntry
                      placeholderTextColor={theme.subtext}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Confirm New Password</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.input }]}>
                    <Shield size={20} color={theme.subtext} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={passwordData.confirmPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                      placeholder="••••••••"
                      secureTextEntry
                      placeholderTextColor={theme.subtext}
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleChangePassword} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[theme.primary, '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButton}
                  >
                    <Lock size={20} color="#ffffff" />
                    <Text style={styles.buttonText}>Change Password</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Preferences */}
          <Animated.View entering={FadeInUp.delay(1000)} style={styles.quickSettings}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
            <View style={styles.settingsGrid}>
              <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.settingIcon, { backgroundColor: theme.primary + '10' }]}>
                  <Shield size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingSubLabel, { color: theme.subtext }]}>Switch to dark interface</Text>
                </View>
                <TouchableOpacity 
                  onPress={toggleTheme}
                  style={[styles.toggleBtn, isDarkMode && { backgroundColor: theme.accent }]}
                >
                  <Animated.View style={[styles.toggleCircle, isDarkMode && { transform: [{ translateX: 20 }] }]} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(51, 153, 255, 0.1)' }]}>
                  <Bell size={20} color="#3399ff" />
                </View>
                <Text style={[styles.settingLabel, { color: theme.text, flex: 1 }]}>Notifications</Text>
                <ChevronRight size={18} color={theme.subtext} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push('/(tabs)/support' as any)}
              >
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(102, 102, 255, 0.1)' }]}>
                  <CircleHelp size={20} color="#6666ff" />
                </View>
                <Text style={[styles.settingLabel, { color: theme.text, flex: 1 }]}>Help & Support</Text>
                <ChevronRight size={18} color={theme.subtext} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInUp.delay(1200)}>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.8}>
              <LogOut size={20} color="#ff3366" />
              <Text style={styles.logoutText}>Sign Out of VITAL</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 20,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileInfo: {
    gap: 4,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 15,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  formContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  card: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  quickSettings: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  settingsGrid: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  toggleBtn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ececf0',
    padding: 2,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  logoutBtn: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: 'rgba(255, 51, 102, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.1)',
    gap: 12,
  },
  logoutText: {
    color: '#ff3366',
    fontSize: 16,
    fontWeight: '700',
  },
});
