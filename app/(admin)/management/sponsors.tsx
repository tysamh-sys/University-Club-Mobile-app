import React, { useState } from 'react';
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
} from 'react-native';

import { Plus, Edit2, Trash2, Mail, Building2, Phone, User, Award, X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

import api from '@/services/api';

type SponsorTier = 'Platinum' | 'Gold' | 'Silver';

interface Sponsor {
  id: string;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  tier: SponsorTier;
}

export default function SponsorManagement() {
  const { theme, isDarkMode } = useTheme();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const res = await api.get('/sponsors');
      setSponsors(res.data.sponsors || []);
    } catch (err) {
      console.error('Error fetching sponsors:', err);
      Alert.alert('Error', 'Failed to load sponsors.');
    } finally {
      setLoading(false);
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactPerson: '',
    phone: '',
    tier: 'Silver' as SponsorTier
  });

  const openAddModal = () => {
    setFormData({ name: '', email: '', contactPerson: '', phone: '', tier: 'Silver' });
    setEditingSponsor(null);
    setShowModal(true);
  };

  const openEditModal = (sponsor: Sponsor) => {
    setFormData({
      name: sponsor.name,
      email: sponsor.email,
      contactPerson: sponsor.contactPerson,
      phone: sponsor.phone,
      tier: sponsor.tier
    });
    setEditingSponsor(sponsor);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingSponsor) {
        const res = await api.put(`/sponsors/${editingSponsor.id}`, formData);
        if (res.data.sponsor) {
          setSponsors(sponsors.map(s =>
            s.id === editingSponsor.id ? res.data.sponsor : s
          ));
        }
      } else {
        const res = await api.post('/sponsors', formData);
        if (res.data.sponsor) {
          setSponsors([...sponsors, res.data.sponsor]);
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving sponsor:', err);
      Alert.alert('Error', 'Failed to save sponsor.');
    }
  };

  const deleteSponsor = (id: string) => {
    Alert.alert('Terminate Partnership?', 'This will remove the sponsor from the active directory.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Terminate', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/sponsors/${id}`);
            setSponsors(sponsors.filter(s => s.id !== id));
          } catch (err) {
            console.error('Error deleting sponsor:', err);
            Alert.alert('Error', 'Failed to delete sponsor.');
          }
      } }
    ]);
  };

  const getTierColor = (tier: SponsorTier): [string, string] => {
    switch (tier) {
      case 'Platinum': return ['#94a3b8', '#475569'];
      case 'Gold': return ['#fbbf24', '#d97706'];
      case 'Silver': return ['#cbd5e1', '#64748b'];
      default: return [theme.primary, '#4f46e5'];
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.text }]}>Sponsors</Text>
          <TouchableOpacity onPress={openAddModal}>
            <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.addBtn}>
              <Plus size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Strategic Relationship Hub</Text>
      </View>

      <ScrollView contentContainerStyle={styles.sponsorList} showsVerticalScrollIndicator={false}>
        {sponsors.map((sponsor, index) => (
          <Animated.View 
            key={sponsor.id || index} 
            entering={FadeInUp.delay(200 + index * 100)}
            style={[styles.sponsorCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.cardTop}>
              <LinearGradient colors={getTierColor(sponsor.tier)} style={styles.avatarBox}>
                <Building2 size={24} color="#ffffff" />
              </LinearGradient>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.sponsorName, { color: theme.text }]}>{sponsor.name}</Text>
                  <View style={[styles.tierBadge, { backgroundColor: theme.input }]}>
                    <Award size={12} color={getTierColor(sponsor.tier)[1]} />
                    <Text style={[styles.tierText, { color: getTierColor(sponsor.tier)[1] }]}>{sponsor.tier}</Text>
                  </View>
                </View>
                <View style={styles.contactBrief}>
                  <User size={12} color={theme.subtext} />
                  <Text style={[styles.contactPerson, { color: theme.subtext }]}>{sponsor.contactPerson}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.detailsGrid, { backgroundColor: theme.input }]}>
              <View style={styles.detailItem}>
                <Mail size={14} color={theme.primary} />
                <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>{sponsor.email}</Text>
              </View>
              <View style={styles.detailItem}>
                <Phone size={14} color={theme.accent} />
                <Text style={[styles.detailValue, { color: theme.text }]}>{sponsor.phone}</Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEditModal(sponsor)} style={[styles.actionBtn, { backgroundColor: theme.input }]}>
                <Edit2 size={16} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteSponsor(sponsor.id)} style={[styles.actionBtn, styles.deleteBtn]}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}

        {sponsors.length === 0 && (
          <View style={styles.emptyState}>
            <Building2 size={64} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>No strategic partners found</Text>
            <TouchableOpacity onPress={openAddModal}>
              <LinearGradient colors={[theme.primary, '#4f46e5']} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Initialize First Sponsor</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sponsor Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingSponsor ? 'Modify Partner' : 'New Strategic Partner'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.closeBtn, { backgroundColor: theme.input }]}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Company Entity</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Inc / LLC"
                  placeholderTextColor={theme.subtext}
                />
              </View>
              
              <View style={styles.tierSelector}>
                {(['Platinum', 'Gold', 'Silver'] as SponsorTier[]).map((tier) => (
                  <TouchableOpacity 
                    key={tier}
                    onPress={() => setFormData({ ...formData, tier })}
                    style={[
                      styles.tierOption, 
                      { backgroundColor: theme.input, borderColor: formData.tier === tier ? theme.primary : theme.border }
                    ]}
                  >
                    <Text style={[styles.tierOptionText, { color: formData.tier === tier ? theme.primary : theme.subtext }]}>
                      {tier}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Primary Liaison</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                  value={formData.contactPerson}
                  onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                  placeholder="Full Name"
                  placeholderTextColor={theme.subtext}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Official Email</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="corporate@domain.com"
                  placeholderTextColor={theme.subtext}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="+1 234 567 890"
                  placeholderTextColor={theme.subtext}
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.cancelBtn, { backgroundColor: theme.input }]}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>Abort</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSave}
                disabled={!formData.name || !formData.email}
                style={{ flex: 1 }}
              >
                <LinearGradient 
                  colors={[theme.primary, '#4f46e5']} 
                  style={[styles.saveBtn, (!formData.name || !formData.email) && { opacity: 0.5 }]}
                >
                  <Check size={20} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Commit Changes</Text>
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
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsorList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  sponsorCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sponsorName: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  contactBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactPerson: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsGrid: {
    borderRadius: 16,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: '#ffffff',
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
  tierSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tierOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  tierOptionText: {
    fontSize: 13,
    fontWeight: '700',
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
