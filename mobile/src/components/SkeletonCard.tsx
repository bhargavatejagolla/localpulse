import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

export const SkeletonCard = () => {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="100%" height={200} borderRadius={0} />
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <SkeletonLoader width={80} height={28} borderRadius={14} />
          <SkeletonLoader width={60} height={28} borderRadius={14} />
        </View>
        <SkeletonLoader width="70%" height={20} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="100%" height={14} style={{ marginBottom: 6 }} />
        <SkeletonLoader width="80%" height={14} />
      </View>
    </View>
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
  content: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
});

