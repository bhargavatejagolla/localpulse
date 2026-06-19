import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { useLocationContext } from '../hooks/useLocationContext';
import { RADIUS_OPTIONS, RadiusOption } from '../types';

export const RadiusPicker: React.FC = () => {
  const { radius, setRadius } = useLocationContext();

  const buttons = RADIUS_OPTIONS.map((opt) => ({
    value: opt.toString(),
    label: `${opt} km`,
  }));

  const handleValueChange = (val: string) => {
    setRadius(parseInt(val, 10) as RadiusOption);
  };

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>
        Search Radius
      </Text>
      <SegmentedButtons
        value={radius.toString()}
        onValueChange={handleValueChange}
        buttons={buttons}
        density="small"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    marginBottom: 8,
    color: '#424242',
  },
});
