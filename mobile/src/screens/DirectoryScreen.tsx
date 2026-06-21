import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
  Animated,
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
import { createProvider } from '../services/database';
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

  // Animation state
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (location) fetchProviders();
  }, [location, radiusInMeters, fetchProviders]);

  useEffect(() => {
    if (!loading && providers.length > 0) {
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
  }, [loading, providers]);

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
      await createProvider(name.trim(), phone.trim(), category, location.latitude, location.longitude);

      Alert.alert('✅ Success', 'Service provider added!');
      setName('');
      setPhone('');
      setCategory('plumber');
      setShowAddModal(false);
      fetchProviders();
    } catch (error: any) {
      if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        Alert.alert(
          'Supabase Config Needed', 
          'You need to allow inserting providers in your Supabase database.\n\n1. Go to Supabase Dashboard > Authentication > Policies\n2. Find the "providers" table\n3. Add a new policy to allow INSERT for authenticated users.',
          [{ text: 'Got it' }]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to add provider.');
      }
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
        <ActivityIndicator size="large" color="#22C55E" />
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
        iconColor="#22C55E"
        placeholderTextColor="#A0A0A0"
        theme={{ colors: { onSurfaceVariant: '#FFFFFF', elevation: { level3: '#111827' } } }}
      />

      {/* Category Filters */}
      <View style={styles.categoryRow}>
        <Chip
          selected={selectedCategory === 'all'}
          onPress={() => setSelectedCategory('all')}
          style={[styles.filterChip, selectedCategory === 'all' && styles.activeFilter]}
          textStyle={{ color: selectedCategory === 'all' ? '#0B1120' : '#FFFFFF' }}
        >
          All
        </Chip>
        {PROVIDER_CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.filterChip, selectedCategory === cat && styles.activeFilter]}
            textStyle={{ color: selectedCategory === cat ? '#0B1120' : '#FFFFFF' }}
          >
            {cat}
          </Chip>
        ))}
      </View>

      <Animated.FlatList
        data={filteredProviders}
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
            <Surface style={styles.providerCard} elevation={1}>
              <View style={styles.providerInfo}>
                <Text variant="titleSmall" style={styles.providerName}>
                  {item.name}
                </Text>
                <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
                  {item.category}
                </Chip>
                <Text variant="bodySmall" style={{ color: '#E0E0E0', marginBottom: 4, marginTop: 4 }}>
                  📞 {item.phone}
                </Text>
                <Text variant="bodySmall" style={styles.ratingText}>
                  {renderStars(item.rating)} ({item.review_count || 0} reviews)
                </Text>
              </View>
              <IconButton
                icon="phone"
                iconColor="#22C55E"
                size={24}
                onPress={() => item.phone && handleCall(item.phone)}
              />
            </Surface>
          </Animated.View>
          );
        }}
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
        buttonColor="#22C55E"
        textColor="#0B1120"
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
            textColor="#FFFFFF"
            theme={{ colors: { primary: '#22C55E', background: '#0B1120', onSurfaceVariant: '#A0A0A0' } }}
            outlineColor="rgba(255,255,255,0.1)"
            activeOutlineColor="#22C55E"
          />
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            textColor="#FFFFFF"
            theme={{ colors: { primary: '#22C55E', background: '#0B1120', onSurfaceVariant: '#A0A0A0' } }}
            outlineColor="rgba(255,255,255,0.1)"
            activeOutlineColor="#22C55E"
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
                style={[styles.categoryOption, category === cat && { backgroundColor: '#22C55E' }]}
                textStyle={{ color: category === cat ? '#0B1120' : '#FFFFFF' }}
              >
                {cat}
              </Chip>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => setShowAddModal(false)}
              style={styles.modalButton}
              textColor="#A0A0A0"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddProvider}
              loading={submitting}
              style={styles.modalButton}
              buttonColor="#22C55E"
              textColor="#0B1120"
            >
              Add Provider
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
  searchbar: {
    margin: 12,
    elevation: 2,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  activeFilter: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  providerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: 'rgba(34,197,94,0.3)',
    borderWidth: 1,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 6,
  },
  categoryChip: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ADE80',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  ratingText: {
    color: '#A0A0A0',
    fontSize: 12,
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
  categoryLabel: {
    color: '#A0A0A0',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryOption: {
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
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