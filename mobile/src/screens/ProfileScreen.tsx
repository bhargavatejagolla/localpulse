import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, Button, Surface, Avatar, Divider } from "react-native-paper";
import { useAuth } from "../hooks/useAuth";

export const ProfileScreen: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ]);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Avatar.Text
          size={80}
          label={profile?.full_name ? getInitials(profile.full_name) : "U"}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {profile?.full_name || "User"}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
        <View style={styles.roleBadge}>
          <Text variant="labelSmall" style={styles.roleText}>
            {profile?.role?.toUpperCase() || "RESIDENT"}
          </Text>
        </View>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account Settings
        </Text>
        <Divider />
        <Button
          mode="text"
          icon="email"
          style={styles.menuItem}
          contentStyle={styles.menuItemContent}
        >
          Change Email
        </Button>
        <Button
          mode="text"
          icon="lock"
          style={styles.menuItem}
          contentStyle={styles.menuItemContent}
        >
          Change Password
        </Button>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          About
        </Text>
        <Divider />
        <Button
          mode="text"
          icon="information"
          style={styles.menuItem}
          contentStyle={styles.menuItemContent}
        >
          About LocalPulse
        </Button>
        <Button
          mode="text"
          icon="shield-check"
          style={styles.menuItem}
          contentStyle={styles.menuItemContent}
        >
          Privacy Policy
        </Button>
      </Surface>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#D32F2F"
        icon="logout"
      >
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: "#1B5E20",
    marginBottom: 12,
  },
  name: {
    color: "#212121",
    fontWeight: "600",
  },
  email: {
    color: "#757575",
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  roleText: {
    color: "#1B5E20",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#1B5E20",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuItem: {
    justifyContent: "flex-start",
  },
  menuItemContent: {
    justifyContent: "flex-start",
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 8,
  },
});
