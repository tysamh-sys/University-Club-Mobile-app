import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Send, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';

export default function SupportScreen() {
  const { theme } = useTheme();
  const [problemText, setProblemText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!problemText.trim()) {
      Alert.alert('Required', 'Please describe your problem.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/problems', { problemText });
      Alert.alert('Success', 'Your issue has been reported. Admins will respond shortly via notifications.');
      setProblemText('');
    } catch (err) {
      console.error('Failed to submit problem', err);
      Alert.alert('Error', 'Could not submit your issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Support & Feedback</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Having trouble? Report it to our admins securely.</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <AlertCircle size={24} color="#ef4444" />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: '#ef4444' }]}>Confidential Report</Text>
            <Text style={[styles.infoDesc, { color: theme.text }]}>
              This report is sent directly to the administrative team. You will receive a response as a direct notification.
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.text }]}>Describe Your Issue</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
            placeholder="I am experiencing an issue with..."
            placeholderTextColor={theme.subtext}
            value={problemText}
            onChangeText={setProblemText}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={styles.submitBtnContainer}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient 
              colors={[theme.primary, '#4f46e5']} 
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            >
              <Send size={20} color="#ffffff" />
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : 'Send to Admin'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '500' },
  infoCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 30, gap: 16, alignItems: 'flex-start' },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  infoDesc: { fontSize: 13, lineHeight: 20 },
  form: { gap: 12 },
  label: { fontSize: 16, fontWeight: '700', marginLeft: 4 },
  input: { borderRadius: 16, borderWidth: 1, padding: 16, minHeight: 150, fontSize: 16 },
  submitBtnContainer: { marginTop: 10 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 10 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
