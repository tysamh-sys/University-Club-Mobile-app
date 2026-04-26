import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  Copy, 
  Camera as Instagram, 
  Mail, 
  Zap, 
  ChevronLeft,
  MessageSquare,
  Check
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import api from '../../services/api';
import Animated, { 
  FadeInUp, 
  FadeOut, 
  Layout, 
  FadeInDown,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

interface GeneratedContent {
  instagram: string;
  email: string;
  color_palette: string[];
}

export default function LiaisonAgent() {
  const { theme, isDarkMode } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setContent(null);

    try {
      const response = await api.post('/ai/liaison', { event: prompt });
      const { data } = response.data;
      setContent({
        instagram: data.instagram_caption,
        email: `Subject: ${data.sponsor_email.subject}\n\n${data.sponsor_email.body}`,
        color_palette: data.color_palette || [],
      });
    } catch (error) {
      console.error("Liaison API error:", error);
      Alert.alert("Error", "Failed to generate branding content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const ResultCard = ({ title, icon: Icon, children, sectionId, contentStr }: any) => (
    <Animated.View 
      entering={FadeInDown.springify()} 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
          <Icon size={18} color={theme.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      </View>
      
      <View style={[styles.contentBox, { backgroundColor: theme.input }]}>
        <Text style={[styles.contentText, { color: theme.text }]}>{children}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          onPress={() => copyToClipboard(contentStr, sectionId)}
          style={[styles.actionBtn, { backgroundColor: theme.input }]}
        >
          {copiedSection === sectionId ? (
            <Check size={16} color={theme.accent} />
          ) : (
            <Copy size={16} color={theme.subtext} />
          )}
          <Text style={[styles.actionBtnText, { color: copiedSection === sectionId ? theme.accent : theme.subtext }]}>
            {copiedSection === sectionId ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.input }]}>
          <RefreshCw size={16} color={theme.subtext} />
          <Text style={[styles.actionBtnText, { color: theme.subtext }]}>Regenerate</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Liaison Agent</Text>
          <View style={styles.statusBadge}>
            <Sparkles size={12} color={theme.primary} />
            <Text style={[styles.statusText, { color: theme.primary }]}>AI ASSISTANT</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Input Section */}
        <Animated.View layout={Layout.springify()} style={styles.inputSection}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Describe your event idea..."
              placeholderTextColor={theme.subtext}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity 
              onPress={handleGenerate} 
              disabled={isGenerating || !prompt.trim()}
              style={styles.generateBtn}
            >
              <LinearGradient 
                colors={isGenerating || !prompt.trim() ? [theme.border, theme.border] : [theme.primary, '#4f46e5']} 
                style={styles.generateBtnGradient}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.generateBtnText}>Generate</Text>
                    <Send size={18} color="#ffffff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Empty State */}
        {!isGenerating && !content && (
          <Animated.View entering={FadeInUp} style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: theme.card }]}>
              <MessageSquare size={40} color={theme.border} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Start a Collaboration</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              Tell me about your event goals and I'll generate the marketing assets for you.
            </Text>
          </Animated.View>
        )}

        {/* Loading State */}
        {isGenerating && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.subtext }]}>AI is analyzing your vision...</Text>
          </View>
        )}

        {/* Results Section */}
        {content && !isGenerating && (
          <View style={styles.resultsGrid}>
            <ResultCard 
              title="Instagram Caption" 
              icon={Instagram} 
              sectionId="instagram"
              contentStr={content.instagram}
            >
              {content.instagram}
            </ResultCard>

            <ResultCard 
              title="Sponsor Outreach Email" 
              icon={Mail} 
              sectionId="email"
              contentStr={content.email}
            >
              {content.email}
            </ResultCard>

            <ResultCard 
              title="Color Palette" 
              icon={Zap} 
              sectionId="colors"
              contentStr={content.color_palette.join(', ')}
            >
              <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
                {content.color_palette.map((color, i) => (
                  <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                    <View 
                      style={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: 22, 
                        backgroundColor: color, 
                        borderWidth: 1, 
                        borderColor: theme.border,
                        shadowColor: color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4
                      }} 
                    />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.text }}>{color}</Text>
                  </View>
                ))}
              </View>
            </ResultCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  inputWrapper: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  generateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  generateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  generateBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  resultsGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  contentBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  hookItem: {
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
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
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
