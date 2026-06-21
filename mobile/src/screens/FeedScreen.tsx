import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text, ActivityIndicator, Button, SegmentedButtons, Surface, Chip } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocationContext } from '../hooks/useLocationContext';
import { useAuth } from '../hooks/useAuth';
import { RadiusPicker } from '../components/RadiusPicker';
import { IssueCard } from '../components/IssueCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { AnimatedEmptyState } from '../components/AnimatedEmptyState';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { LeafletMap } from '../components/LeafletMap';
import { getAllIssues, toggleUpvote, hasUserUpvoted } from '../services/database';
import { supabase } from '../lib/supabase';
import { Issue } from '../types';
import { useNotifications } from '../hooks/NotificationContext';
import { NotificationModal } from '../components/NotificationModal';
import { Badge } from 'react-native-paper';

export const FeedScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { location, radius, loading: locationLoading, error, refreshLocation, radiusInMeters } = useLocationContext();
  const { user } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'heatmap'>('list');
  const [sortBy, setSortBy] = useState<'recent' | 'top_voted'>('recent');
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);

  const { unreadCount } = useNotifications();

  // Animation for Header
  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const fetchIssues = useCallback(async () => {
    if (!location) return;
    
    try {
      // For hackathon presentation, we fetch ALL issues globally to prevent the radius 
      // filter from hiding reports if the user's GPS is far from the tapped map location.
      const data = await getAllIssues();
      
      let sortedData = data || [];
      if (sortBy === 'top_voted') {
        sortedData.sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0));
      } else {
        sortedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      
      setIssues(sortedData);
    } catch (error) {
      console.error('Fetch issues error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, radiusInMeters]);

  useFocusEffect(
    useCallback(() => {
      if (location) {
        setLoading(true);
        fetchIssues();
      }
    }, [location, fetchIssues])
  );

  useEffect(() => {
    // Only subscribe to refresh the feed list when a new issue occurs, 
    // but NotificationContext handles the actual global alert & sound.
    const channel = supabase
      .channel('feed:issues')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        () => {
          fetchIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location, radiusInMeters, sortBy, fetchIssues]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    await fetchIssues();
  };

  const handleUpvote = async (issueId: string) => {
    if (!user) return;
    
    setUpvotingIds((prev) => new Set(prev).add(issueId));
    
    try {
      await toggleUpvote(issueId, user.id);
      await fetchIssues(); // Refresh to get updated counts
    } catch (error) {
      console.error('Upvote error:', error);
    } finally {
      setUpvotingIds((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  const handleIssuePress = (issue: Issue) => {
    navigation.navigate('IssueDetail', { issueId: issue.id });
  };

  const handleDeleteIssue = (issue: Issue) => {
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        "Delete Report",
        "Are you sure you want to permanently delete this report?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive",
            onPress: async () => {
              try {
                const { error } = await supabase.from('issues').delete().eq('id', issue.id);
                if (error) throw error;
                fetchIssues();
              } catch (e: any) {
                console.error('Delete error', e);
              }
            }
          }
        ]
      );
    });
  };

  const handleResolveIssue = (issue: Issue) => {
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        "Resolve Report",
        "Are you sure you want to mark this report as Resolved?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Resolve", 
            style: "default",
            onPress: async () => {
              try {
                const { error } = await supabase.from('issues').update({ status: 'Resolved' }).eq('id', issue.id);
                if (error) throw error;
                Alert.alert('🎉 Incredible!', 'Thank you for resolving this issue! You have earned 100 Civic XP!');
                fetchIssues();
              } catch (e: any) {
                console.error('Resolve error', e);
              }
            }
          }
        ]
      );
    });
  };

  if (locationLoading || loading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background for Dark Mode */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#120F17' }]} />

      <FlatList
        data={viewMode === 'list' ? issues.filter(i => quickFilter === 'all' || i.category === quickFilter) : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <IssueCard
            issue={item}
            onPress={handleIssuePress}
            onUpvote={handleUpvote}
            hasUpvoted={false} // Will improve in Phase 3
            isUpvoting={upvotingIds.has(item.id)}
            index={index}
            isOwner={user?.id === item.user_id}
            onDelete={handleDeleteIssue}
            onResolve={handleResolveIssue}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#22C55E']} // Neon Green
            tintColor="#22C55E"
            progressViewOffset={200}
          />
        }
        ListEmptyComponent={
          viewMode === 'list' ? (
          <Surface style={[styles.emptyState, { borderRadius: 16, backgroundColor: '#111827', elevation: 2, margin: 16 }]} elevation={2}>
            <AnimatedEmptyState 
              icon="shield-check" 
              title="You're in a Safe Zone!" 
              subtitle="No civic issues reported within this radius. Found something? Be the first to report it and help your community."
            />
            <Button mode="contained" onPress={() => navigation.navigate('Report')} style={{ backgroundColor: '#22C55E' }} textColor="#0B1120">
              Report an Issue
            </Button>
          </Surface>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Glassmorphism Header */}
      <Animated.View style={[styles.headerAbsolute, {
        opacity: headerAnim,
        transform: [{
          translateY: headerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-200, 0],
          })
        }]
      }]}>
        <View style={StyleSheet.absoluteFill}>
          <AnimatedBackground colors={['#166534', '#22C55E', '#0B1120']} style="lightfall" />
        </View>
        <BlurView intensity={80} tint="dark" style={[styles.headerBlur, { paddingTop: 50, paddingBottom: 10 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
            <Text variant="titleLarge" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Community Feed</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* Notification Bell */}
              <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.bellContainer}>
                <MaterialCommunityIcons name="bell-outline" size={26} color="#A0A0A0" />
                {unreadCount > 0 && (
                  <Badge size={18} style={styles.badge}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
                <MaterialCommunityIcons name={showFilters ? "close" : "filter-variant"} size={28} color="#22C55E" />
              </TouchableOpacity>
            </View>
          </View>
          
          {showFilters && (
            <View>
              <RadiusPicker />
              <View style={[styles.toggleContainer, { marginTop: 0 }]}>
                <SegmentedButtons
                  value={sortBy}
                  onValueChange={(value) => { setSortBy(value as 'recent' | 'top_voted'); fetchIssues(); }}
                  style={{ marginBottom: 10 }}
                  buttons={[
                    { value: 'recent', label: 'Recent', icon: 'clock-outline' },
                    { value: 'top_voted', label: 'Top Voted', icon: 'arrow-up-bold' },
                  ]}
                  theme={{ colors: { secondaryContainer: 'rgba(34,197,94,0.2)', onSecondaryContainer: '#22C55E', onSurface: '#FFFFFF', outline: 'rgba(255,255,255,0.2)' } }}
                />
              </View>
            </View>
          )}

          <View style={[styles.toggleContainer, { paddingTop: 0, marginTop: 0 }]}>
            {/* Segmented Control */}
            <View style={styles.segmentContainer}>
              <SegmentedButtons
                value={viewMode}
                onValueChange={(val) => setViewMode(val as 'list' | 'map')}
                buttons={[
                  { value: 'list', label: 'Feed', icon: 'format-list-bulleted' },
                  { value: 'map', label: 'PulseMap AI', icon: 'map-search' },
                ]}
                style={styles.segmentedButtons}
                theme={{ colors: { secondaryContainer: 'rgba(34,197,94,0.2)', onSecondaryContainer: '#22C55E', onSurface: '#FFFFFF', outline: 'rgba(255,255,255,0.2)' } }}
              />
            </View>
          </View>

          <View style={styles.quickFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilters}>
              <Chip style={[styles.filterChip, quickFilter === 'all' && styles.activeFilter]} textStyle={{ color: quickFilter === 'all' ? '#0B1120' : '#FFFFFF' }} selected={quickFilter === 'all'} onPress={() => setQuickFilter('all')}>All</Chip>
              <Chip style={[styles.filterChip, quickFilter === 'roads' && styles.activeFilter]} textStyle={{ color: quickFilter === 'roads' ? '#0B1120' : '#FFFFFF' }} selected={quickFilter === 'roads'} onPress={() => setQuickFilter('roads')}>🛣️ Roads</Chip>
              <Chip style={[styles.filterChip, quickFilter === 'water' && styles.activeFilter]} textStyle={{ color: quickFilter === 'water' ? '#0B1120' : '#FFFFFF' }} selected={quickFilter === 'water'} onPress={() => setQuickFilter('water')}>💧 Water</Chip>
              <Chip style={[styles.filterChip, quickFilter === 'electricity' && styles.activeFilter]} textStyle={{ color: quickFilter === 'electricity' ? '#0B1120' : '#FFFFFF' }} selected={quickFilter === 'electricity'} onPress={() => setQuickFilter('electricity')}>⚡ Electric</Chip>
              <Chip style={[styles.filterChip, quickFilter === 'safety' && styles.activeFilter]} textStyle={{ color: quickFilter === 'safety' ? '#0B1120' : '#FFFFFF' }} selected={quickFilter === 'safety'} onPress={() => setQuickFilter('safety')}>🛡️ Safety</Chip>
              <Chip style={[styles.filterChip, quickFilter === 'sanitation' && styles.activeFilter]} textStyle={{ color: quickFilter === 'sanitation' ? '#0B1120' : '#FFFFFF' }} selected={quickFilter === 'sanitation'} onPress={() => setQuickFilter('sanitation')}>🧹 Sanitation</Chip>
            </ScrollView>
          </View>
        </BlurView>
      </Animated.View>

      {/* Map Views */}
      {(viewMode === 'map' || viewMode === 'heatmap') && location && (
        <Animated.View style={StyleSheet.absoluteFill}>
          <LeafletMap
            center={{ latitude: location.latitude, longitude: location.longitude }}
            radiusInMeters={radiusInMeters}
            issues={issues}
            mode={viewMode === 'heatmap' ? 'heatmap' : 'feed'}
            onIssuePress={(id) => {
              const issue = issues.find(i => i.id === id);
              if (issue) handleIssuePress(issue);
            }}
          />
        </Animated.View>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Copilot AI Button */}
        <Animated.View style={[{ transform: [{ scale: pulseAnim }], marginBottom: 16 }]}>
          <Surface style={[styles.fabSurface, { backgroundColor: '#111827', borderColor: '#22C55E', borderWidth: 1 }]} elevation={4}>
            <TouchableOpacity 
              style={styles.fab} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Copilot')}
            >
              <MaterialCommunityIcons name="robot" size={24} color="#22C55E" />
              <Text style={[styles.fabText, { color: '#22C55E', fontSize: 14 }]}>Ask AI</Text>
            </TouchableOpacity>
          </Surface>
        </Animated.View>

        {/* Report Button */}
        <Animated.View style={[{ transform: [{ scale: pulseAnim }] }]}>
          <Surface style={styles.fabSurface} elevation={4}>
            <TouchableOpacity 
              style={styles.fab} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Report')}
            >
              <MaterialCommunityIcons name="plus" size={28} color="#0B1120" />
              <Text style={styles.fabText}>Report</Text>
            </TouchableOpacity>
          </Surface>
        </Animated.View>
      </View>

      {/* Notification Modal */}
      <NotificationModal 
        visible={showNotifications} 
        onDismiss={() => setShowNotifications(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  headerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerBlur: {
    paddingTop: 50, // Safe area + spacing
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1120',
  },
  loadingText: {
    color: '#A0A0A0',
    marginBottom: 16,
  },
  quickFiltersContainer: {
    marginTop: 4,
  },
  quickFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  activeFilter: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  bellContainer: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F44336',
    color: '#FFF',
    fontWeight: 'bold',
  },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#E65100',
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 180, // Reduced from 240 since header is smaller
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#616161',
    marginTop: 16,
  },
  emptyText: {
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  toggleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: 10,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  customPin: {
    backgroundColor: '#111827',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  pinEmoji: {
    fontSize: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fabSurface: {
    borderRadius: 30,
    backgroundColor: '#22C55E', // Neon Green
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fabText: {
    color: '#0B1120',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 16,
  },
});