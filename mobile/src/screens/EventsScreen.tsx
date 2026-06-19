import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

export const EventsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Local Events</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Upcoming events in your neighbourhood
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  placeholder: {
    marginTop: 8,
    color: "#757575",
  },
});
