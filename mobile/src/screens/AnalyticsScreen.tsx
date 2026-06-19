import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, ActivityIndicator, Chip } from 'react-native-paper';
import { useLocationContext } from '../hooks/useLocationContext';
import { supabase } from '../lib/supabase';
import { IssueCategory } from '../types';

interface Stats {
  total: number;
  open: number;
  resolved: number;
  byCategory: Record<IssueCategory, number>;
  topIssue: string;
}

export const AnalyticsScreen: React.FC = () => {
  const { location, radiusInMeters } = useLocationContext();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!location) return;

      try {
        const { data: issues } = await supabase
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (!issues) return;

        const categoryCount: Record<string, number> = {
          roads: 0, water: 0, electricity: 0, safety: 0, sanitation: 0,
        };

        issues.forEach((issue) => {
          if (categoryCount[issue.category] !== undefined) {
            categoryCount[issue.category]++;
          }
        });

        const sorted = [...issues].sort((a, b) => b.upvote_count - a.upvote_count);

        setStats({
          total: issues.length,
          open: issues.filter((i) => i.status === 'Open').length,
          resolved: issues.filter((i) => i.status === 'Resolved').length,
          byCategory: categoryCount as Record<IssueCategory, number>,
          topIssue: sorted[0]?.title || 'N/A',
        });
      } catch (error) {
        console.error('Stats error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [location]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  if (!stats) return null;

  const categoryEmojis: Record<string, string> = {
    roads: '🛣️',
    water: '💧',
    electricity: '⚡',
    safety: '🛡️',
    sanitation: '🧹',
  };

  const maxCategory = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>
        📊 Civic Analytics
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Insights from your community
      </Text>

      {/* Summary Cards */}
      <View style={styles.row}>
        <Surface style={[styles.card, { backgroundColor: '#E8F5E9' }]} elevation={1}>
          <Text style={styles.cardNumber}>{stats.total}</Text>
          <Text style={styles.cardLabel}>Total Issues</Text>
        </Surface>
        <Surface style={[styles.card, { backgroundColor: '#FFF3E0' }]} elevation={1}>
          <Text style={styles.cardNumber}>{stats.open}</Text>
          <Text style={styles.cardLabel}>Open</Text>
        </Surface>
        <Surface style={[styles.card, { backgroundColor: '#E3F2FD' }]} elevation={1}>
          <Text style={styles.cardNumber}>{stats.resolved}</Text>
          <Text style={styles.cardLabel}>Resolved</Text>
        </Surface>
      </View>

      {/* Resolution Rate */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          📈 Resolution Rate
        </Text>
        <Text style={styles.bigStat}>
          {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%` },
            ]}
          />
        </View>
      </Surface>

      {/* By Category */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          📂 Issues by Category
        </Text>
        {Object.entries(stats.byCategory).map(([cat, count]) => (
          <View key={cat} style={styles.categoryRow}>
            <Text style={styles.categoryEmoji}>{categoryEmojis[cat]}</Text>
            <Text style={styles.categoryName}>{cat}</Text>
            <View style={styles.categoryBarContainer}>
              <View
                style={[
                  styles.categoryBar,
                  {
                    width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                    backgroundColor: cat === maxCategory[0] ? '#1B5E20' : '#81C784',
                  },
                ]}
              />
            </View>
            <Text style={styles.categoryCount}>{count}</Text>
          </View>
        ))}
      </Surface>

      {/* Top Issue */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          🔥 Most Upvoted Issue
        </Text>
        <Chip icon="arrow-up-bold" style={styles.topIssueChip}>
          {stats.topIssue}
        </Chip>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: '#1B5E20', fontWeight: '700' },
  subtitle: { color: '#757575', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  card: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  cardNumber: { fontSize: 32, fontWeight: '700', color: '#212121' },
  cardLabel: { fontSize: 12, color: '#616161', marginTop: 4 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { color: '#212121', fontWeight: '600', marginBottom: 12 },
  bigStat: { fontSize: 48, fontWeight: '700', color: '#1B5E20', textAlign: 'center' },
  progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginTop: 8 },
  progressFill: { height: 8, backgroundColor: '#1B5E20', borderRadius: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryEmoji: { fontSize: 18, width: 30 },
  categoryName: { width: 90, fontSize: 13, color: '#424242', textTransform: 'capitalize' },
  categoryBarContainer: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, marginHorizontal: 8 },
  categoryBar: { height: 6, borderRadius: 3 },
  categoryCount: { fontSize: 14, fontWeight: '600', color: '#212121', width: 30, textAlign: 'right' },
  topIssueChip: { backgroundColor: '#FFF3E0', marginTop: 4 },
});
