import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { MessageSquare, Check, X } from 'lucide-react-native';
import api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProblemsDashboard() {
  const { theme } = useTheme();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const res = await api.get('/problems');
      setProblems(res.data.problems);
    } catch (err) {
      console.error("Failed to fetch problems", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText[id]?.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/problems/${id}/reply`, { replyText: replyText[id] });
      Alert.alert("Success", "Reply sent to user as a notification.");
      fetchProblems();
    } catch (err) {
      console.error("Failed to reply", err);
      Alert.alert("Error", "Failed to send reply.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>User Problems</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Review and resolve user issues</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {problems.map((prob) => (
          <View key={prob.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.userName, { color: theme.text }]}>{prob.user_name}</Text>
              <Text style={[styles.date, { color: theme.subtext }]}>
                {new Date(prob.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.problemText, { color: theme.text }]}>{prob.problem_text}</Text>
            
            {prob.is_resolved ? (
              <View style={[styles.resolvedBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Check size={16} color="#10b981" />
                <Text style={{ color: '#10b981', fontWeight: 'bold', marginLeft: 6 }}>Resolved</Text>
              </View>
            ) : (
              <View style={styles.replyArea}>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                  placeholder="Type your reply..."
                  placeholderTextColor={theme.subtext}
                  value={replyText[prob.id] || ''}
                  onChangeText={(text) => setReplyText({ ...replyText, [prob.id]: text })}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.replyBtn, { backgroundColor: theme.primary }]}
                  onPress={() => handleReply(prob.id)}
                  disabled={submitting}
                >
                  <Text style={styles.replyBtnText}>Send Reply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        {problems.length === 0 && (
          <Text style={[styles.empty, { color: theme.subtext }]}>No problems reported yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  date: { fontSize: 12 },
  problemText: { fontSize: 15, marginBottom: 16, lineHeight: 22 },
  replyArea: { gap: 10 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top' },
  replyBtn: { padding: 12, borderRadius: 12, alignItems: 'center' },
  replyBtnText: { color: 'white', fontWeight: 'bold' },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 }
});
