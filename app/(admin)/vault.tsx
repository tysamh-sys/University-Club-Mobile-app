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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, FileText, Download, Eye, Shield, CheckCircle, ChevronLeft, Key, HardDrive, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeIn, Layout, BounceIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

import api from '@/services/api';

interface Document {
  file_id: string;
  file_name: string;
  file_type: string;
  file_size: string;
  uploaded_at: string;
  access_role: string;
}

export default function SecureVault() {
  const { theme, isDarkMode } = useTheme();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/files');
      setDocuments(res.data.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = () => {
    if (password === 'secure123') {
      setIsUnlocked(true);
      setError('');
      fetchFiles();
    } else {
      setError('Invalid Access Key');
    }
  };

  if (!isUnlocked) {
    return (
      <SafeAreaView style={[styles.authContainer, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authContent}>
          <Animated.View entering={BounceIn.duration(800)} style={styles.authHeader}>
            <View style={styles.lockOuter}>
              <LinearGradient colors={['#ef4444', '#7c3aed']} style={styles.lockGradient}>
                <Lock size={40} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={[styles.authTitle, { color: theme.text }]}>Secure Vault</Text>
            <Text style={[styles.authSubtitle, { color: theme.subtext }]}>Encryption key required for entry</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)} style={[styles.authCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Vault Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.input, borderColor: error ? '#ef4444' : theme.border }]}>
                <Key size={18} color={theme.subtext} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.subtext}
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <TouchableOpacity onPress={handleUnlock} style={styles.unlockBtn}>
              <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.btnGradient}>
                <Shield size={20} color="#ffffff" />
                <Text style={styles.btnText}>Unlock Storage</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: theme.subtext }]}>Return to Terminal</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsUnlocked(false)} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Lock size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Vault Explorer</Text>
          <View style={styles.statusBadge}>
            <Shield size={14} color="#10b981" />
            <Text style={[styles.statusText, { color: '#10b981' }]}>AES-256 Active</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Storage Stats */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
          <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statsHeader}>
              <View style={styles.statsInfo}>
                <Text style={[styles.statsLabel, { color: theme.subtext }]}>Storage Usage</Text>
                <Text style={[styles.statsValue, { color: theme.text }]}>12.4 GB / 50 GB</Text>
              </View>
              <HardDrive size={24} color={theme.primary} />
            </View>
            <View style={[styles.progressBg, { backgroundColor: theme.input }]}>
              <LinearGradient 
                colors={[theme.primary, theme.accent]} 
                start={{x:0, y:0}} end={{x:1, y:0}} 
                style={[styles.progressFill, { width: '25%' }]} 
              />
            </View>
          </View>
        </Animated.View>

        {/* Document List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Secure Documents</Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>Filter</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.fileList}>
            {documents.map((doc, index) => (
              <Animated.View 
                key={doc.file_id} 
                entering={FadeInUp.delay(300 + index * 100)}
                style={[styles.fileCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.fileIconBox, { backgroundColor: theme.input }]}>
                  <FileText size={24} color={theme.primary} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{doc.file_name}</Text>
                  <View style={styles.fileMeta}>
                    <Text style={[styles.fileSize, { color: theme.subtext }]}>{Math.round(parseInt(doc.file_size)/1024)} KB</Text>
                    <View style={styles.dotSeparator} />
                    <Text style={[styles.fileDate, { color: theme.subtext }]}>{new Date(doc.uploaded_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.fileActions}>
                  <TouchableOpacity style={styles.fileActionBtn}>
                    <Download size={18} color={theme.subtext} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.fileActionBtn}>
                    <Eye size={18} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.classificationTag, { backgroundColor: doc.access_role === 'admin' ? '#ef444420' : '#f59e0b20' }]}>
                  <Lock size={10} color={doc.access_role === 'admin' ? '#ef4444' : '#f59e0b'} />
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Security Alerts */}
        <Animated.View entering={FadeInUp.delay(800)} style={styles.section}>
          <View style={[styles.alertCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <AlertCircle size={20} color="#ef4444" />
            <Text style={styles.alertText}>3 Sensitive documents require manual audit.</Text>
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  authContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  lockOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 24,
  },
  lockGradient: {
    flex: 1,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  authCard: {
    width: '100%',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 4,
  },
  unlockBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 24,
    padding: 10,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsInfo: {
    gap: 2,
  },
  statsLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  fileList: {
    gap: 12,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  fileIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileSize: {
    fontSize: 12,
    fontWeight: '500',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#717182',
    opacity: 0.3,
  },
  fileDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 4,
  },
  fileActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classificationTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 6,
    borderBottomLeftRadius: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  alertText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
