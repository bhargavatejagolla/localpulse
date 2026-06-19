import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Searchbar,
  Chip,
  ActivityIndicator,
  IconButton,
  Button,
  Modal,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useLocationContext } from '../hooks/useLocationContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ServiceProvider, ProviderCategory } from '../types';

const PROVIDER_CATEGORIES: ProviderCategory[] = [
  'plumber',
  'electrician',
  'carpenter',
  'tutor',
  'technician',
  'other',
];

export const DirectoryScreen: React.FC = () => {
  const { location, radiusInMeters } = useLocationContext();
  const { user } = useAuth();

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<ProviderCategory>('plumber');
  const [submitting, setSubmitting] = useState(false);

  const fetchProviders = useCallback(async () => {
    if (!location) return;

    try {
      let query = supabase.rpc('get_providers_within_radius', {
        lat: location.latitude,
        lng: location.longitude,
        radius_meters: radiusInMeters,
      });

      const { data, error } = await query;

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Fetch providers error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, radiusInMeters]);

  useEffect(() => {
    if (location) fetchProviders();
  }, [location, radiusInMeters, fetchProviders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProviders();
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleAddProvider = async () => {
    if (!user || !location) return;
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required', 'Please fill in name and phone number.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('providers').insert({
        name: name.trim(),
        phone: phone.trim(),
        category,
        location: `POINT(${location.longitude} ${location.latitude})`,
      });

      if (error) throw error;

      Alert.alert('✅ Success', 'Service provider added!');
      setName('');
      setPhone('');
      setCategory('plumber');
      setShowAddModal(false);
      fetchProviders();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add provider.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(rating) ? '⭐' : '☆');
    }
    return stars.join('');
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
      {/* Search Bar */}
      <Searchbar
        placeholder="Search providers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        iconColor="#1B5E20"
      />

      {/* Category Filters */}
      <View style={styles.categoryRow}>
        <Chip
          selected={selectedCategory === 'all'}
          onPress={() => setSelectedCategory('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        {PROVIDER_CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
            style={styles.filterChip}
          >
            {cat}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filteredProviders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Surface style={styles.providerCard} elevation={1}>
            <View style={styles.providerInfo}>
              <Text variant="titleSmall" style={styles.providerName}>
                {item.name}
              </Text>
              <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
                {item.category}
              </Chip>
              <Text variant="bodySmall" style={styles.ratingText}>
                {renderStars(item.rating)} ({item.review_count || 0} reviews)
              </Text>
            </View>
            <IconButton
              icon="phone"
              iconColor="#1B5E20"
              size={24}
              onPress={() => item.phone && handleCall(item.phone)}
            />
          </Surface>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1B5E20']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="displaySmall">🔧</Text>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Providers Found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Add a service provider to help your community!
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Button
        mode="contained"
        icon="plus"
        onPress={() => setShowAddModal(true)}
        style={styles.fab}
        buttonColor="#1B5E20"
      >
        Add Provider
      </Button>

      {/* Add Provider Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Add Service Provider
          </Text>

          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text variant="bodyMedium" style={styles.categoryLabel}>
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {PROVIDER_CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={category === cat}
                onPress={() => setCategory(cat)}
                style={styles.categoryOption}
              >
                {cat}
              </Chip>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowAddModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddProvider}
              loading={submitting}
              style={styles.modalButton}
              buttonColor="#1B5E20"
            >
              Add
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
  searchbar: {
    margin: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryChip: {
    backgroundColor: '#E8F5E9',
    height: 24,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryChipText: {
    fontSize: 10,
    color: '#1B5E20',
  },
  ratingText: {
    color: '#757575',
    fontSize: 12,
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
  categoryLabel: {
    color: '#424242',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryOption: {
    height: 32,
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