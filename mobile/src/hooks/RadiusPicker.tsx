import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { RADIUS_OPTIONS, RadiusOption } from '../types';
import { useLocationContext } from '../hooks/useLocationContext';

export const RadiusPicker: React.FC = () => {
  const { radius, setRadius } = useLocationContext();

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>
        Show within:
      </Text>
      <View style={styles.chipRow}>
        {RADIUS_OPTIONS.map((option) => (
          <Chip
            key={option}
            selected={radius === option}
            onPress={() => setRadius(option)}
            style={[
              styles.chip,
              radius === option && styles.selectedChip,
            ]}
            textStyle={[
              styles.chipText,
              radius === option && styles.selectedChipText,
            ]}
            showSelectedCheck={false}
          >
            {option} km
          </Chip>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    color: '#757575',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  selectedChip: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  chipText: {
    color: '#757575',
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
});