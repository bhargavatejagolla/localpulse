import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  Chip,
  ActivityIndicator,
  TextInput,
  Modal,
  Portal,
  IconButton,
} from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useLocationContext } from '../hooks/useLocationContext';
import { supabase } from '../lib/supabase';
import { Event } from '../types';

export const EventsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const { location, radiusInMeters } = useLocationContext();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!location) return;

    try {
      const { data, error } = await supabase.rpc('get_events_within_radius', {
        lat: location.latitude,
        lng: location.longitude,
        radius_meters: radiusInMeters,
      });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Fetch events error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, radiusInMeters]);

  useEffect(() => {
    if (location) {
      fetchEvents();
    }
  }, [location, radiusInMeters, fetchEvents]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleCreateEvent = async () => {
    if (!user || !location) return;
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required', 'Please fill in title and description.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate || null,
        location: `POINT(${location.longitude} ${location.latitude})`,
      });

      if (error) throw error;

      Alert.alert('✅ Success', 'Event created successfully!');
      setTitle('');
      setDescription('');
      setEventDate('');
      setShowCreateModal(false);
      fetchEvents();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('events').delete().eq('id', eventId);
              if (error) throw error;
              await fetchEvents();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Surface style={styles.eventCard} elevation={1}>
            <View style={styles.eventHeader}>
              <Chip icon="calendar" style={styles.dateChip} textStyle={styles.dateChipText}>
                {formatDate(item.event_date)}
              </Chip>
              {user && item.user_id === user.id && (
                <IconButton
                  icon="delete"
                  iconColor="#D32F2F"
                  size={20}
                  onPress={() => handleDeleteEvent(item.id)}
                  style={{ margin: 0 }}
                />
              )}
            </View>
            <Text variant="titleMedium" style={styles.eventTitle}>
              {item.title}
            </Text>
            <Text variant="bodyMedium" style={styles.eventDescription} numberOfLines={3}>
              {item.description}
            </Text>
          </Surface>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1B5E20']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="displaySmall">📅</Text>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Events Nearby
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Be the first to create an event in your area!
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB to create event */}
      <Button
        mode="contained"
        icon="plus"
        onPress={() => setShowCreateModal(true)}
        style={styles.fab}
        buttonColor="#1B5E20"
      >
        Create Event
      </Button>

      {/* Create Event Modal */}
      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Create Event
          </Text>

          <TextInput
            label="Event Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <TextInput
            label="Date (YYYY-MM-DD)"
            value={eventDate}
            onChangeText={setEventDate}
            mode="outlined"
            placeholder="2026-06-25"
            style={styles.input}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowCreateModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateEvent}
              loading={submitting}
              style={styles.modalButton}
              buttonColor="#1B5E20"
            >
              Create
            </Button>
          </View>
        </Modal>
      </Portal>
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateChip: {
    backgroundColor: '#E8F5E9',
    height: 28,
  },
  dateChipText: {
    fontSize: 11,
    color: '#1B5E20',
  },
  eventTitle: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 6,
  },
  eventDescription: {
    color: '#616161',
    lineHeight: 20,
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
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 8,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  input: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    minWidth: 100,
  },
});