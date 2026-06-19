import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Chip,
  Button,
  ActivityIndicator,
  Menu,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useLocationContext } from '../hooks/useLocationContext';
import { supabase } from '../lib/supabase';
import { updateIssueStatus } from '../services/database';
import { Issue, IssueStatus } from '../types';

const STATUS_OPTIONS: IssueStatus[] = ['Open', 'Under Review', 'In Progress', 'Resolved'];

const statusColors: Record<string, string> = {
  Open: '#FF6F00',
  'Under Review': '#1976D2',
  'In Progress': '#388E3C',
  Resolved: '#757575',
};

export const AuthorityScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const { location, radiusInMeters } = useLocationContext();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    if (!location) return;

    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Fetch issues error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    if (!user) return;
    
    setMenuVisible(null);
    setUpdatingId(issueId);

    try {
      await updateIssueStatus(issueId, newStatus, user.id);
      Alert.alert('✅ Updated', `Issue status changed to "${newStatus}"`);
      fetchIssues();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!profile || (profile.role !== 'authority' && profile.role !== 'admin')) {
    return (
      <View style={styles.center}>
        <Text variant="displaySmall">🔒</Text>
        <Text variant="titleMedium" style={styles.accessDenied}>
          Authority Access Only
        </Text>
        <Text variant="bodyMedium" style={styles.accessHint}>
          This screen is for municipal authorities to manage civic issues.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={0}>
        <Text variant="titleMedium" style={styles.headerTitle}>
          📋 Manage Issues
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtext}>
          {issues.length} issues found
        </Text>
      </Surface>

      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Surface style={styles.issueCard} elevation={1}>
            <View style={styles.issueHeader}>
              <Text variant="titleSmall" style={styles.issueTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: statusColors[item.status] + '20' }]}
                textStyle={{ color: statusColors[item.status], fontWeight: '700', fontSize: 11 }}
              >
                {item.status}
              </Chip>
            </View>

            <Text variant="bodySmall" style={styles.issueDesc} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.issueFooter}>
              <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
                {item.category} | {item.severity}
              </Chip>

              <Menu
                visible={menuVisible === item.id}
                onDismiss={() => setMenuVisible(null)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setMenuVisible(item.id)}
                    loading={updatingId === item.id}
                    textColor="#1B5E20"
                    style={styles.statusButton}
                  >
                    Update Status
                  </Button>
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <Menu.Item
                    key={status}
                    onPress={() => handleStatusChange(item.id, status)}
                    title={status}
                    leadingIcon={
                      item.status === status ? 'check-circle' : 'circle-outline'
                    }
                  />
                ))}
              </Menu>
            </View>
          </Surface>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1B5E20']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium">No issues found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDenied: {
    color: '#616161',
    marginTop: 16,
  },
  accessHint: {
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  headerSubtext: {
    color: '#616161',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  issueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueTitle: {
    color: '#212121',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  issueDesc: {
    color: '#616161',
    marginBottom: 12,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: '#F5F5F5',
    height: 28,
  },
  categoryChipText: {
    fontSize: 11,
    color: '#757575',
  },
  statusButton: {
    borderColor: '#1B5E20',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
});