import React, { useState, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, FileText, Download, Shield, ChevronLeft, Key, HardDrive, AlertCircle, Plus, RefreshCw, Trash2, Fingerprint } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeIn, Layout, SlideInDown } from 'react-native-reanimated';
import api from '@/services/api';

// 🛡️ NATIVE MODULES (Loaded carefully for Expo Go)
let DocumentPicker: any;
let FileSystem: any;
let Sharing: any;
let LocalAuthentication: any;

try {
  DocumentPicker = require('expo-document-picker');
  FileSystem = require('expo-file-system');
  Sharing = require('expo-sharing');
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {
  console.log('Native file modules failed to load');
}

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
  const [usage, setUsage] = useState({ used: 0, total: 50 });
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    if (!LocalAuthentication) return;
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricAvailable(compatible && enrolled);
  };

  const handleBiometricAuth = async () => {
    if (!LocalAuthentication) return;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Secure Vault',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsUnlocked(true);
        fetchFiles();
      }
    } catch (e) {
      console.error('Biometric auth error:', e);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/files');
      const files = res.data.files || [];
      setDocuments(files);
      
      const totalSize = files.reduce((acc: number, doc: any) => acc + parseInt(doc.file_size || 0), 0);
      setUsage({ used: totalSize / (1024 * 1024 * 1024), total: 50 });
    } catch (err: any) {
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

  const handleUpload = async () => {
    if (!DocumentPicker || !DocumentPicker.getDocumentAsync) {
      Alert.alert('System Error', 'Native document picker is not available in Expo Go.');
      return;
    }

    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });

      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Document encrypted and stored.');
      fetchFiles();
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', 'Ensure you have given file permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    if (!FileSystem || !Sharing) {
      Alert.alert('System Error', 'Native file system is not available.');
      return;
    }

    try {
      setLoading(true);
      const downloadUrl = `${api.defaults.baseURL}/files/${fileId}/download`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadRes = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          'Authorization': api.defaults.headers.common['Authorization'] as string,
        },
      });

      if (downloadRes.status === 200) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Could not download the document.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    Alert.alert('Confirm Purge', 'Permanently delete this encrypted file?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/files/${fileId}`);
            fetchFiles();
          } catch (err) {
            Alert.alert('Error', 'Purge failed.');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  if (!isUnlocked) {
    return (
      <SafeAreaView style={[styles.authContainer, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authContent}>
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.authHeader}>
            <View style={styles.lockOuter}>
              <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.lockGradient}>
                <Lock size={42} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={[styles.authTitle, { color: theme.text }]}>Secure Vault</Text>
            <Text style={[styles.authSubtitle, { color: theme.subtext }]}>Encryption key required for entry</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={[styles.authCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
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

            <View style={styles.authActions}>
              <TouchableOpacity onPress={handleUnlock} style={styles.unlockBtn}>
                <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.btnGradient}>
                  <Shield size={20} color="#ffffff" />
                  <Text style={styles.btnText}>Unlock Storage</Text>
                </LinearGradient>
              </TouchableOpacity>

              {isBiometricAvailable && (
                <TouchableOpacity onPress={handleBiometricAuth} style={[styles.biometricBtn, { borderColor: theme.border, backgroundColor: theme.input }]}>
                  <Fingerprint size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
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
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Vault Explorer</Text>
          <View style={styles.statusBadge}>
            <Shield size={14} color="#10b981" />
            <Text style={[styles.statusText, { color: '#10b981' }]}>AES-256 ACTIVE</Text>
          </View>
        </View>
        <TouchableOpacity onPress={fetchFiles} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <RefreshCw size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statsHeader}>
              <View style={styles.statsInfo}>
                <Text style={[styles.statsLabel, { color: theme.subtext }]}>Storage Usage</Text>
                <Text style={[styles.statsValue, { color: theme.text }]}>{usage.used.toFixed(2)} GB / {usage.total} GB</Text>
              </View>
              <HardDrive size={24} color={theme.primary} />
            </View>
            <View style={[styles.progressBg, { backgroundColor: theme.input }]}>
              <LinearGradient 
                colors={[theme.primary, theme.accent]} 
                start={{x:0, y:0}} end={{x:1, y:0}} 
                style={[styles.progressFill, { width: `${(usage.used / usage.total) * 100}%` }]} 
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Secure Documents</Text>
          
          <View style={styles.fileList}>
            {documents.length === 0 && !loading ? (
              <View style={styles.emptyVault}>
                <Lock size={48} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.subtext }]}>No files in the vault</Text>
              </View>
            ) : (
              documents.map((doc, index) => (
                <Animated.View 
                  key={doc.file_id} 
                  entering={FadeInUp.delay(index * 100)}
                  style={[styles.fileCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={[styles.fileIconBox, { backgroundColor: theme.primary + '15' }]}>
                    <FileText size={24} color={theme.primary} />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{doc.file_name}</Text>
                    <Text style={[styles.fileMeta, { color: theme.subtext }]}>
                      {(parseInt(doc.file_size) / 1024).toFixed(1)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.fileActions}>
                    <TouchableOpacity onPress={() => handleDownload(doc.file_id, doc.file_name)} style={styles.actionCircle}>
                      <Download size={18} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(doc.file_id)} style={styles.actionCircle}>
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Animated.View entering={SlideInDown.delay(600)} style={[styles.footer, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={handleUpload} style={styles.uploadMainBtn}>
          <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.uploadGradient}>
            <Plus size={24} color="#ffffff" />
            <Text style={styles.uploadText}>UPLOAD NEW DOCUMENT</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  authContainer: { flex: 1, justifyContent: 'center' },
  authContent: { paddingHorizontal: 24, alignItems: 'center' },
  authHeader: { alignItems: 'center', marginBottom: 40 },
  lockOuter: { width: 100, height: 100, borderRadius: 50, padding: 5, backgroundColor: 'rgba(0,0,0,0.03)', marginBottom: 24 },
  lockGradient: { flex: 1, borderRadius: 50, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  authTitle: { fontSize: 32, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  authSubtitle: { fontSize: 16, fontWeight: '500', opacity: 0.7 },
  authCard: { width: '100%', borderRadius: 32, padding: 28, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderRadius: 18, borderWidth: 1, height: 60, gap: 14 },
  input: { flex: 1, fontSize: 18, fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '700', marginTop: 10, marginLeft: 4 },
  authActions: { flexDirection: 'row', gap: 12 },
  unlockBtn: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  biometricBtn: { width: 60, height: 60, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, gap: 10 },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  cancelBtn: { marginTop: 32, padding: 12 },
  cancelText: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  scrollContent: { paddingBottom: 120 },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  statsCard: { borderRadius: 28, padding: 24, borderWidth: 1 },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statsInfo: { gap: 4 },
  statsLabel: { fontSize: 14, fontWeight: '700', opacity: 0.6 },
  statsValue: { fontSize: 20, fontWeight: '900' },
  progressBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  fileList: { gap: 14 },
  fileCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, gap: 16 },
  fileIconBox: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  fileMeta: { fontSize: 12, fontWeight: '600', opacity: 0.6 },
  fileActions: { flexDirection: 'row', gap: 10 },
  actionCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40 },
  uploadMainBtn: { borderRadius: 24, overflow: 'hidden', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20 },
  uploadGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 14 },
  uploadText: { color: '#ffffff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  emptyVault: { alignItems: 'center', paddingVertical: 60, gap: 16, opacity: 0.5 },
  emptyText: { fontSize: 16, fontWeight: '700' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
});
