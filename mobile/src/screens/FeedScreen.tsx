import React from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Text, Surface, ActivityIndicator, Button } from "react-native-paper";
import { useLocationContext } from "../hooks/useLocationContext";
import { RadiusPicker } from "../components/RadiusPicker";

export const FeedScreen: React.FC = () => {
  const {
    location,
    radius,
    loading: locationLoading,
    error,
    refreshLocation,
  } = useLocationContext();

  if (locationLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Getting your location...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadiusPicker />

      {error && (
        <Surface style={styles.errorBanner} elevation={0}>
          <Text variant="bodySmall" style={styles.errorText}>
            ⚠️ {error}
          </Text>
          <Button mode="text" compact onPress={refreshLocation}>
            Retry
          </Button>
        </Surface>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshLocation} />
        }
      >
        <Surface style={styles.locationInfo} elevation={1}>
          <Text variant="titleSmall" style={styles.infoTitle}>
            📍 Your Location
          </Text>
          {location ? (
            <Text variant="bodySmall" style={styles.infoText}>
              Lat: {location.latitude.toFixed(4)} | Lng:{" "}
              {location.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text variant="bodySmall" style={styles.infoText}>
              Location not available
            </Text>
          )}
          <Text variant="bodySmall" style={styles.infoText}>
            Showing issues within: <Text style={styles.bold}>{radius} km</Text>
          </Text>
        </Surface>

        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Issues Yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Be the first to report a civic problem in your area!{"\n"}
            Tap the Report tab to get started.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    color: "#757575",
    marginTop: 12,
  },
  errorBanner: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#E65100",
    flex: 1,
  },
  content: {
    padding: 16,
  },
  locationInfo: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    color: "#1B5E20",
    marginBottom: 8,
    fontWeight: "600",
  },
  infoText: {
    color: "#424242",
    marginBottom: 4,
  },
  bold: {
    fontWeight: "700",
    color: "#1B5E20",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    color: "#616161",
    marginBottom: 8,
  },
  emptyText: {
    color: "#9E9E9E",
    textAlign: "center",
    lineHeight: 22,
  },
});
