import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const SkeletonCard = () => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={styles.chipPlaceholder} />
          <View style={styles.chipPlaceholder} />
        </View>
        <View style={styles.titlePlaceholder} />
        <View style={styles.descriptionPlaceholder} />
        <View style={styles.descriptionPlaceholderShort} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  content: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chipPlaceholder: {
    height: 28,
    width: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 14,
  },
  titlePlaceholder: {
    height: 20,
    width: '70%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  descriptionPlaceholder: {
    height: 14,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
  descriptionPlaceholderShort: {
    height: 14,
    width: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
});
