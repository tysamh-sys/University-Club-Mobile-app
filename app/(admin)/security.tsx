import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, AlertTriangle, Clock, User, Lock, Unlock, Terminal, ChevronLeft, Globe, Cpu, Server, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeInRight, FadeIn } from 'react-native-reanimated';
import api from '@/services/api';

interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  endpoint: string;
  method: string;
  ip: string;
  action: string;
  status: 'success' | 'warning' | 'danger';
  user_agent: string;
  created_at: string;
}

interface BlockedUser {
  id: number;
  user_id: number | null;
  ip_address: string | null;
  name: string | null;
  email: string | null;
  reason: string;
  created_at: string;
}

interface SuspiciousIp {
  ip_address: string;
  fail_count: string;
  last_attempt: string;
}

interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  is_blacklisted: boolean;
}

export default function SecurityDashboard() {
  const { theme, isDarkMode } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [systemMoves, setSystemMoves] = useState<ActivityLog[]>([]);
  const [blockedEntities, setBlockedEntities] = useState<BlockedUser[]>([]);
  const [suspiciousIps, setSuspiciousIps] = useState<SuspiciousIp[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [userLogs, setUserLogs] = useState<ActivityLog[]>([]);
  const [loadingUserLogs, setLoadingUserLogs] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [threatsRes, usersRes, movesRes] = await Promise.all([
        api.get('/security/threats'),
        api.get('/users'),
        api.get('/security/logs?type=blocks')
      ]);

      setBlockedEntities(threatsRes.data?.blocked || []);
      setSuspiciousIps(threatsRes.data?.suspicious || []);
      setUsers(usersRes.data || []);
      setSystemMoves(movesRes.data || []);
    } catch (err) {
      console.error("Failed to load security data", err);
      Alert.alert("Error", "Could not load security feed.");
    } finally {
      setLoading(false);
    }
  };

  const openUserMonitor = async (user: SystemUser) => {
    setSelectedUser(user);
    setUserLogs([]);
    setLoadingUserLogs(true);
    try {
      const res = await api.get(`/security/logs?userId=${user.id}`);
      setUserLogs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch user logs", err);
    } finally {
      setLoadingUserLogs(false);
    }
  };

  const unblockEntity = (entity: BlockedUser) => {
    Alert.alert('System Auth', `Unblock ${entity.ip_address || entity.name}?`, [
      { text: 'Abort', style: 'cancel' },
      { text: 'Proceed', style: 'destructive', onPress: async () => {
          try {
            if (entity.ip_address) {
              await api.delete(`/security/block-ip/${entity.ip_address}`);
            } else if (entity.user_id) {
              await api.delete(`/users/${entity.user_id}/block`);
            }
            fetchSecurityData();
          } catch (err) {
            Alert.alert("Error", "Failed to unblock entity");
          }
      } }
    ]);
  };

  const blockIp = (ip: string) => {
    Alert.alert('System Auth', `Block IP ${ip}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: async () => {
          try {
            await api.post(`/security/block-ip`, { ip, reason: 'Manual IP Blacklist' });
            fetchSecurityData();
          } catch (err) {
            Alert.alert("Error", "Failed to block IP");
          }
      } }
    ]);
  };

  const toggleUserBlock = async (user: SystemUser) => {
    try {
      if (user.is_blacklisted) {
        await api.delete(`/users/${user.id}/block`);
      } else {
        await api.post(`/users/${user.id}/block`, { reason: 'Admin manual block' });
      }
      // Re-fetch everything to ensure UI is in sync
      fetchSecurityData();
    } catch (err) {
      Alert.alert("Error", "Action failed");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Security Center</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.statusText, { color: '#10b981' }]}>System Protected</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Threat Alerts */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Threat Management</Text>
            <View style={[styles.countBadge, { backgroundColor: '#ef4444' + '20' }]}>
              <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 12 }}>{blockedEntities.length + suspiciousIps.length}</Text>
            </View>
          </View>
          <View style={styles.listContainer}>
            {/* Blocked Entities */}
            {blockedEntities.map((entity, index) => (
              <Animated.View 
                key={`blocked-${entity.id}`} 
                entering={FadeInRight.delay(300 + index * 50)}
                style={[styles.threatCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.threatIcon, { backgroundColor: '#ef4444' + '10' }]}>
                  <Lock size={20} color="#ef4444" />
                </View>
                <View style={styles.threatInfo}>
                  <Text style={[styles.threatName, { color: theme.text }]}>
                    {entity.ip_address ? `Blocked IP: ${entity.ip_address}` : `Blocked User: ${entity.name}`}
                  </Text>
                  <Text style={[styles.threatReason, { color: theme.subtext }]}>{entity.reason}</Text>
                </View>
                <TouchableOpacity onPress={() => unblockEntity(entity)} style={[styles.unblockBtn, { backgroundColor: theme.primary }]}>
                  <Unlock size={16} color="#ffffff" />
                </TouchableOpacity>
              </Animated.View>
            ))}

            {/* Suspicious IPs */}
            {suspiciousIps.map((ipObj, index) => (
              <Animated.View 
                key={`suspicious-${ipObj.ip_address}`} 
                entering={FadeInRight.delay(400 + index * 50)}
                style={[styles.threatCard, { backgroundColor: theme.input, borderColor: '#f59e0b' }]}
              >
                <View style={[styles.threatIcon, { backgroundColor: '#f59e0b' + '10' }]}>
                  <AlertTriangle size={20} color="#f59e0b" />
                </View>
                <View style={styles.threatInfo}>
                  <Text style={[styles.threatName, { color: theme.text }]}>Suspicious IP: {ipObj.ip_address}</Text>
                  <Text style={[styles.threatReason, { color: theme.subtext }]}>{ipObj.fail_count} Failed Logins Detected</Text>
                </View>
                <TouchableOpacity onPress={() => blockIp(ipObj.ip_address)} style={[styles.unblockBtn, { backgroundColor: '#ef4444' }]}>
                  <Lock size={16} color="#ffffff" />
                </TouchableOpacity>
              </Animated.View>
            ))}

            {blockedEntities.length === 0 && suspiciousIps.length === 0 && (
               <Text style={{color: theme.subtext, fontStyle: 'italic', padding: 10}}>No active threats detected.</Text>
            )}
          </View>
        </Animated.View>

        {/* Users Directory */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>User Security Monitoring</Text>
          <View style={{ gap: 12 }}>
             {users.map((user, idx) => (
               <TouchableOpacity 
                 key={`user-${user.id}`} 
                 style={[styles.userCard, { backgroundColor: theme.card, borderColor: user.is_blacklisted ? '#ef4444' : theme.border }]}
                 onPress={() => openUserMonitor(user)}
               >
                 <View style={[styles.userAvatar, { backgroundColor: user.is_blacklisted ? '#ef444420' : theme.primary + '20' }]}>
                   <User size={24} color={user.is_blacklisted ? '#ef4444' : theme.primary} />
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={[styles.userCardName, { color: theme.text }]} numberOfLines={1}>{user.name}</Text>
                   <Text style={[styles.userCardRole, { color: theme.subtext }]}>{user.role.toUpperCase()}</Text>
                 </View>
               </TouchableOpacity>
             ))}
          </View>
        </Animated.View>

        {/* System Moves */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>System Action Feed</Text>
          <View style={[styles.logList, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {systemMoves.slice(0, 20).map((log, index) => (
              <View key={`move-${index}`} style={[styles.logItem, index !== Math.min(19, systemMoves.length - 1) && { borderBottomColor: theme.border }]}>
                <View style={[styles.logStatus, { backgroundColor: log.action.includes('UNBLOCK') ? '#10b981' : '#ef4444' }]} />
                <View style={styles.logContent}>
                  <View style={styles.logHeader}>
                    <Text style={[styles.logAction, { color: theme.text }]}>{log.action}</Text>
                    <Text style={[styles.logTime, { color: theme.subtext }]}>
                      {new Date(log.created_at).toLocaleString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                  </View>
                  <Text style={[styles.logUser, { color: theme.subtext }]} numberOfLines={1}>
                    {log.user_name ? `${log.user_name} • ` : ''}Target IP: {log.ip || 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
            {systemMoves.length === 0 && (
               <Text style={{color: theme.subtext, fontStyle: 'italic', padding: 10, textAlign: 'center'}}>No recent system moves.</Text>
            )}
          </View>
        </Animated.View>


      </ScrollView>

      {/* Security Monitor Modal */}
      <Modal visible={!!selectedUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, height: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Security Monitor</Text>
                <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>{selectedUser?.name} ({selectedUser?.email})</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUser(null)} style={[styles.closeBtn, { backgroundColor: theme.input }]}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.terminalCard, { backgroundColor: '#030213', borderColor: theme.border, marginBottom: 16 }]}>
              <LinearGradient colors={['rgba(99, 102, 241, 0.15)', 'transparent']} style={styles.terminalOverlay} />
              <View style={styles.terminalHeader}>
                <Terminal size={18} color="#10b981" />
                <Text style={styles.terminalTitle}>USER_METRICS</Text>
              </View>
              <View style={styles.terminalGrid}>
                <View style={styles.terminalItem}>
                  <Cpu size={14} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.terminalLabel}>STATUS</Text>
                  <Text style={[styles.terminalValue, selectedUser?.is_blacklisted && {color: '#ef4444'}]}>
                    {selectedUser?.is_blacklisted ? 'BLOCKED' : 'ACTIVE'}
                  </Text>
                </View>
                <View style={styles.terminalItem}>
                  <Globe size={14} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.terminalLabel}>LAST IP</Text>
                  <Text style={styles.terminalValue}>{userLogs[0]?.ip || 'N/A'}</Text>
                </View>
                <View style={styles.terminalItem}>
                  <Clock size={14} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.terminalLabel}>LAST ACTION TIME</Text>
                  <Text style={styles.terminalValue}>{userLogs[0] ? new Date(userLogs[0].created_at).toLocaleString([], {hour12: false, second: '2-digit'}) : 'N/A'}</Text>
                </View>
              </View>
              <View style={{ marginTop: 12, gap: 4 }}>
                <Text style={{color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'}}>
                   DEVICE/USER-AGENT: {userLogs[0]?.user_agent || 'Unknown'}
                </Text>
                <Text style={{color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'}}>
                   MAC ADDRESS: N/A (Standard security restriction)
                </Text>
                <Text style={{color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'}}>
                   LAST ENDPOINT: {userLogs[0]?.endpoint || 'N/A'} [{userLogs[0]?.method || 'N/A'}]
                </Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', gap: 12, marginBottom: 20}}>
                {selectedUser?.role !== 'admin' && selectedUser?.role !== 'president' ? (
                  <TouchableOpacity 
                    style={[styles.monitorActionBtn, { backgroundColor: selectedUser?.is_blacklisted ? '#10b981' : '#ef4444' }]}
                    onPress={() => {
                      if (selectedUser) toggleUserBlock(selectedUser);
                      setSelectedUser(null);
                    }}
                  >
                    {selectedUser?.is_blacklisted ? <Unlock size={18} color="#fff"/> : <Lock size={18} color="#fff"/>}
                    <Text style={{color: '#fff', fontWeight: 'bold', marginLeft: 8}}>
                      {selectedUser?.is_blacklisted ? 'UNBLOCK USER' : 'BLOCK USER'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.monitorActionBtn, { backgroundColor: theme.border, opacity: 0.6 }]}>
                    <Shield size={18} color={theme.subtext}/>
                    <Text style={{color: theme.subtext, fontWeight: 'bold', marginLeft: 8}}>
                      ADMIN PROTECTED
                    </Text>
                  </View>
                )}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Personal Event Feed</Text>
            {loadingUserLogs ? (
               <ActivityIndicator color={theme.primary} />
            ) : (
               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.logList, { backgroundColor: theme.input, borderColor: theme.border }]}>
                 {userLogs.length === 0 ? (
                    <Text style={{color: theme.subtext, fontStyle: 'italic', padding: 10}}>No events found for this user.</Text>
                 ) : (
                    userLogs.map((log, index) => (
                      <View key={`ulog-${index}`} style={[styles.logItem, index !== userLogs.length - 1 && { borderBottomColor: theme.border }]}>
                        <View style={[styles.logStatus, { backgroundColor: log.status === 'success' ? '#10b981' : log.status === 'danger' ? '#ef4444' : '#f59e0b' }]} />
                        <View style={styles.logContent}>
                          <View style={styles.logHeader}>
                            <Text style={[styles.logAction, { color: theme.text }]}>{log.action}</Text>
                            <Text style={[styles.logTime, { color: theme.subtext }]}>
                              {new Date(log.created_at).toLocaleString()}
                            </Text>
                          </View>
                          <Text style={[styles.logUser, { color: theme.subtext }]} numberOfLines={1}>{log.endpoint} [{log.method}]</Text>
                        </View>
                      </View>
                    ))
                 )}
               </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  terminalCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', padding: 20, position: 'relative' },
  terminalOverlay: { ...StyleSheet.absoluteFillObject },
  terminalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  terminalTitle: { color: '#10b981', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, fontWeight: '800' },
  terminalGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  terminalItem: { alignItems: 'flex-start', gap: 4 },
  terminalLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  terminalValue: { color: '#ffffff', fontSize: 12, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  listContainer: { gap: 12 },
  threatCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, gap: 14 },
  threatIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  threatInfo: { flex: 1 },
  threatName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  threatReason: { fontSize: 13, fontWeight: '500' },
  unblockBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logList: { borderRadius: 24, borderWidth: 1, padding: 16 },
  logItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  logStatus: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  logContent: { flex: 1 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  logAction: { fontSize: 14, fontWeight: '800' },
  logTime: { fontSize: 12, fontWeight: '600' },
  logUser: { fontSize: 12, fontWeight: '500' },
  logUserAgent: { fontSize: 10, fontStyle: 'italic', marginTop: 2, opacity: 0.7 },
  userCard: { flexDirection: 'row', padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  userAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  userCardName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  userCardRole: { fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  modalSubtitle: { fontSize: 14, fontWeight: '600' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  monitorActionBtn: { flex: 1, flexDirection: 'row', height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }
});
