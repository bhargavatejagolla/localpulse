import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { Text, Surface, IconButton, Portal, Modal, Badge } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNotifications } from "../hooks/NotificationContext";

interface NotificationModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { notifications, clearUnread } = useNotifications();

  React.useEffect(() => {
    if (visible) {
      clearUnread();
    }
  }, [visible]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.surface} elevation={5}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title}>
              🔔 Notifications
            </Text>
            <IconButton icon="close" size={20} onPress={onDismiss} iconColor="#A0A0A0" />
          </View>

          <ScrollView style={styles.scrollArea}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="bell-sleep-outline" size={48} color="#4B5563" />
                <Text style={styles.emptyText}>No recent notifications.</Text>
              </View>
            ) : (
              notifications.map((notif) => (
                <View key={notif.id} style={[styles.notificationCard, notif.read ? styles.readCard : styles.unreadCard]}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={24} color={notif.read ? "#A0A0A0" : "#22C55E"} />
                  </View>
                  <View style={styles.textContent}>
                    <Text variant="titleSmall" style={{ color: notif.read ? "#E5E7EB" : "#FFFFFF" }}>
                      {notif.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: "#9CA3AF", marginTop: 2 }}>
                      {notif.message}
                    </Text>
                    <Text variant="labelSmall" style={{ color: "#6B7280", marginTop: 4 }}>
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  surface: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#111827",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  scrollArea: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#9CA3AF",
    marginTop: 12,
  },
  notificationCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  unreadCard: {
    backgroundColor: "rgba(34,197,94,0.05)",
    borderLeftWidth: 3,
    borderLeftColor: "#22C55E",
  },
  readCard: {
    opacity: 0.7,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
  },
});
