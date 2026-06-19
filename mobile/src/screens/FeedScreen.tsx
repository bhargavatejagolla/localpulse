import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Button, SegmentedButtons } from 'react-native-paper';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useLocationContext } from '../hooks/useLocationContext';
import { useAuth } from '../hooks/useAuth';
import { RadiusPicker } from '../components/RadiusPicker';
import { IssueCard } from '../components/IssueCard';
import { getIssuesWithinRadius, toggleUpvote, hasUserUpvoted } from '../services/database';
import { supabase } from '../lib/supabase';
import { Issue } from '../types';

export const FeedScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { location, radius, loading: locationLoading, error, refreshLocation, radiusInMeters } = useLocationContext();
  const { user } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const fetchIssues = useCallback(async () => {
    if (!location) return;
    
    try {
      const data = await getIssuesWithinRadius(
        location.latitude,
        location.longitude,
        radiusInMeters
      );
      setIssues(data || []);
    } catch (error) {
      console.error('Fetch issues error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, radiusInMeters]);

  useEffect(() => {
    if (location) {
      setLoading(true);
      fetchIssues();
    }

    const channel = supabase
      .channel('public:issues')
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
  }, [location, radiusInMeters, fetchIssues]);

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

  if (locationLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading issues...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadiusPicker />

      {error && (
        <View style={styles.errorBanner}>
          <Text variant="bodySmall" style={styles.errorText}>
            ⚠️ {error}
          </Text>
          <Button mode="text" compact onPress={refreshLocation} textColor="#E65100">
            Retry
          </Button>
        </View>
      )}

      <View style={styles.toggleContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'list' | 'map')}
          buttons={[
            { value: 'list', label: 'List View', icon: 'format-list-bulleted' },
            { value: 'map', label: 'Map View', icon: 'map' },
          ]}
        />
      </View>

      {viewMode === 'map' && location ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: (radiusInMeters / 111320) * 2.2,
              longitudeDelta: (radiusInMeters / (111320 * Math.cos(location.latitude * (Math.PI / 180)))) * 2.2,
            }}
          >
            <Circle
              center={{ latitude: location.latitude, longitude: location.longitude }}
              radius={radiusInMeters}
              fillColor="rgba(27, 94, 32, 0.1)"
              strokeColor="#1B5E20"
            />
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              title="You are here"
              pinColor="blue"
            />
            {issues.map((issue) => {
              let lng = 0;
              let lat = 0;
              
              if (typeof issue.location === 'string') {
                const match = (issue.location as string).match(/POINT\(([^ ]+) ([^ ]+)\)/);
                if (!match) return null;
                lng = parseFloat(match[1]);
                lat = parseFloat(match[2]);
              } else if (issue.location && typeof issue.location === 'object') {
                 // Handle GeoJSON format
                 lng = (issue.location as any).coordinates[0];
                 lat = (issue.location as any).coordinates[1];
              } else {
                 return null;
              }

              return (
                <Marker
                  key={issue.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={issue.title}
                  description={issue.category}
                  onCalloutPress={() => handleIssuePress(issue)}
                  pinColor={issue.severity === 'critical' ? 'red' : issue.severity === 'high' ? 'orange' : 'green'}
                />
              );
            })}
          </MapView>
        </View>
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IssueCard
              issue={item}
              onPress={handleIssuePress}
              onUpvote={handleUpvote}
              hasUpvoted={false} // Will improve in Phase 3
              isUpvoting={upvotingIds.has(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1B5E20']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="displaySmall">📍</Text>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Issues Nearby
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Be the first to report a civic problem in your area!
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    color: '#757575',
    marginTop: 12,
  },
  errorBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});