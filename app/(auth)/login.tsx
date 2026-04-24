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
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, Globe, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    email: '',
    password: '',
  });

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      if (activeTab === 'signup') {
        await login(formData, true);
      } else {
        await login({ email: formData.email, password: formData.password }, false);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Authentication Failed', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    console.log('Google Auth not yet connected to backend flow');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDarkMode ? ['#020617', '#1e1b4b'] : ['#f8fafc', '#e0e7ff']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
              <View style={styles.logoWrapper}>
                <LinearGradient
                  colors={[theme.primary, '#4f46e5']}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoLetter}>V</Text>
                </LinearGradient>
                <Text style={[styles.logoText, { color: theme.text }]}>VITAL<Text style={{ color: theme.primary }}>CORE</Text></Text>
              </View>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>L'Intelligence Motrice du Club</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(400)} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.tabs, { backgroundColor: theme.input }]}>
                <TouchableOpacity
                  onPress={() => setActiveTab('login')}
                  style={[
                    styles.tab,
                    activeTab === 'login' && { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
                  ]}
                >
                  <Text style={[
                    styles.tabText,
                    { color: activeTab === 'login' ? theme.text : theme.subtext }
                  ]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab('signup')}
                  style={[
                    styles.tab,
                    activeTab === 'signup' && { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
                  ]}
                >
                  <Text style={[
                    styles.tabText,
                    { color: activeTab === 'signup' ? theme.text : theme.subtext }
                  ]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                {activeTab === 'signup' && (
                  <Animated.View entering={FadeIn.duration(400)}>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: theme.input, borderColor: theme.border }]}>
                        <User size={20} color={theme.subtext} />
                        <TextInput
                          style={[styles.input, { color: theme.text }]}
                          placeholder="John Doe"
                          placeholderTextColor={theme.subtext}
                          value={formData.name}
                          onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: theme.text }]}>Department</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: theme.input, borderColor: theme.border }]}>
                        <Briefcase size={20} color={theme.subtext} />
                        <TextInput
                          style={[styles.input, { color: theme.text }]}
                          placeholder="Marketing"
                          placeholderTextColor={theme.subtext}
                          value={formData.department}
                          onChangeText={(text) => setFormData({ ...formData, department: text })}
                        />
                      </View>
                    </View>
                  </Animated.View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <Mail size={20} color={theme.subtext} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="name@email.com"
                      placeholderTextColor={theme.subtext}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                    {activeTab === 'login' && (
                      <TouchableOpacity>
                        <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot?</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <Lock size={20} color={theme.subtext} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={theme.subtext}
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} color={theme.subtext} /> : <Eye size={20} color={theme.subtext} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  style={styles.submitContainer}
                >
                  <LinearGradient
                    colors={[theme.primary, '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>
                          {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                        </Text>
                        <ChevronRight size={20} color="#ffffff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={[styles.line, { backgroundColor: theme.border }]} />
                  <Text style={[styles.dividerText, { color: theme.subtext }]}>Or continue with</Text>
                  <View style={[styles.line, { backgroundColor: theme.border }]} />
                </View>

                <TouchableOpacity 
                  style={[styles.googleBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                  onPress={handleGoogleAuth}
                >
                  <Globe size={20} color={theme.text} />
                  <Text style={[styles.googleText, { color: theme.text }]}>Google</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.subtext }]}>
                {activeTab === 'login' ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}>
                <Text style={[styles.footerAction, { color: theme.primary }]}>
                  {activeTab === 'login' ? 'Sign Up' : 'Log In'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logoGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  submitContainer: {
    marginTop: 6,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  googleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footerAction: {
    fontSize: 14,
    fontWeight: '700',
  },
});
