import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

export const ReportScreen: React.FC<{ navigation: any }> = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Report Issue</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Report a civic problem in your area
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  placeholder: {
    marginTop: 8,
    color: '#757575',
  },
});