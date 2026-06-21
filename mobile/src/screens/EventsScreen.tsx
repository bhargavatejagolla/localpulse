import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
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
import { LeafletMap } from '../components/LeafletMap';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [eventDate, setEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customLocation, setCustomLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
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

  // Animation state
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (location) {
      fetchEvents();
    }
  }, [location, radiusInMeters, fetchEvents]);

  useEffect(() => {
    if (!loading && events.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [loading, events]);

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
      const submitLat = customLocation ? customLocation.lat : location?.latitude;
      const submitLng = customLocation ? customLocation.lng : location?.longitude;

      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate.toISOString().split('T')[0],
        location: `POINT(${submitLng} ${submitLat})`,
      });

      if (error) throw error;

      Alert.alert('✅ Success', 'Event created successfully!');
      setTitle('');
      setDescription('');
      setEventDate(new Date());
      setShowCreateModal(false);
      fetchEvents();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocationSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
        headers: {
          'User-Agent': 'LocalPulseApp/1.0',
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCustomLocation({ lat, lng });
      } else {
        Alert.alert('Location Not Found', 'We couldn\'t find that exact address.\n\nPlease try a broader search or simply tap the map to place the pin manually!');
      }
    } catch (e) {
      Alert.alert("Error", "Could not search location.");
    } finally {
      setIsSearching(false);
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
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          // Stagger effect based on index
          const itemFade = fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          });
          const itemSlide = slideAnim.interpolate({
            inputRange: [0, 50],
            outputRange: [0, 50 + (index * 20)] // staggered drop
          });

          return (
          <Animated.View style={{ opacity: itemFade, transform: [{ translateY: itemSlide }] }}>
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
          </Animated.View>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#22C55E']} tintColor="#22C55E" />
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
        buttonColor="#22C55E"
        textColor="#0B1120"
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
            textColor="#FFFFFF"
            theme={{ colors: { primary: '#22C55E', background: '#0B1120', onSurfaceVariant: '#A0A0A0' } }}
            outlineColor="rgba(255,255,255,0.1)"
            activeOutlineColor="#22C55E"
          />
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            textColor="#FFFFFF"
            theme={{ colors: { primary: '#22C55E', background: '#0B1120', onSurfaceVariant: '#A0A0A0' } }}
            outlineColor="rgba(255,255,255,0.1)"
            activeOutlineColor="#22C55E"
          />
          {Platform.OS === 'ios' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#A0A0A0', marginRight: 16 }}>Date:</Text>
              <DateTimePicker
                value={eventDate}
                mode="date"
                display="default"
                onChange={(e, date) => date && setEventDate(date)}
                themeVariant="dark"
              />
            </View>
          ) : (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#A0A0A0', marginBottom: 8 }}>Date: {eventDate.toLocaleDateString()}</Text>
              <Button mode="outlined" onPress={() => setShowDatePicker(true)} textColor="#FFFFFF" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                Select Date
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={eventDate}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowDatePicker(false);
                    if (date) setEventDate(date);
                  }}
                />
              )}
            </View>
          )}

          <Text style={{ color: '#A0A0A0', marginBottom: 8 }}>Location (Search or Tap Map)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TextInput
              placeholder="Search location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              mode="outlined"
              style={[styles.input, { flex: 1, marginBottom: 0, height: 40 }]}
              textColor="#FFFFFF"
              theme={{ colors: { primary: '#22C55E', background: '#0B1120', onSurfaceVariant: '#A0A0A0' } }}
              outlineColor="rgba(255,255,255,0.1)"
              activeOutlineColor="#22C55E"
            />
            <Button
              mode="contained"
              onPress={handleLocationSearch}
              loading={isSearching}
              disabled={isSearching}
              buttonColor="#22C55E"
              textColor="#0B1120"
              style={{ marginLeft: 8, height: 40, justifyContent: 'center' }}
            >
              Search
            </Button>
          </View>

          <View style={{ height: 150, borderRadius: 12, overflow: 'hidden', marginBottom: 16, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }}>
            {(location || customLocation) && (
              <LeafletMap 
                center={{
                  latitude: customLocation ? customLocation.lat : (location?.latitude || 0),
                  longitude: customLocation ? customLocation.lng : (location?.longitude || 0)
                }}
                onMapPress={(lat, lng) => setCustomLocation({ lat, lng })}
                showRadius={false}
                interactive={true}
              />
            )}
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => setShowCreateModal(false)}
              style={styles.modalButton}
              textColor="#A0A0A0"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateEvent}
              loading={submitting}
              style={styles.modalButton}
              buttonColor="#22C55E"
              textColor="#0B1120"
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
    backgroundColor: '#0B1120',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1120',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  eventCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateChip: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    height: 28,
  },
  dateChipText: {
    fontSize: 11,
    color: '#22C55E',
  },
  eventTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 6,
  },
  eventDescription: {
    color: '#A0A0A0',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyText: {
    color: '#A0A0A0',
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
    backgroundColor: '#111827',
    margin: 20,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  modalTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});