import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Alert, ScrollView, Animated, Modal } from "react-native";
import { Text, Button, Surface, Avatar, Divider, TextInput, ActivityIndicator } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { TouchableOpacity } from 'react-native';
import { useAuth } from "../hooks/useAuth";
import { useGamification } from "../hooks/useGamification";
import { supabase } from "../lib/supabase";
import { uploadAvatar, updateProfile } from "../services/database";

export const ProfileScreen: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { stats, loading: gamifyLoading } = useGamification();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'email' | 'password' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ]);
  };

  const handlePickAvatar = async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSubmitting(true);
      try {
        const url = await uploadAvatar(result.assets[0].uri, user.id);
        await updateProfile(user.id, { avatar_url: url });
        Alert.alert('Success', 'Profile photo updated! Please restart the app or refresh to see changes globally.');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to upload photo.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!inputValue) return;
    setSubmitting(true);
    try {
      if (modalType === 'email') {
         const { error } = await supabase.auth.updateUser({ email: inputValue });
         if (error) throw error;
         Alert.alert("Success", "Check your new email to confirm the change.");
      } else if (modalType === 'password') {
         const { error } = await supabase.auth.updateUser({ password: inputValue });
         if (error) throw error;
         Alert.alert("Success", "Password updated successfully.");
      }
      setModalVisible(false);
      setInputValue('');
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const gamifyAnim = useRef(new Animated.Value(0)).current;
  const badgesAnim = useRef(new Animated.Value(0)).current;
  const settingsAnim = useRef(new Animated.Value(0)).current;
  const aboutAnim = useRef(new Animated.Value(0)).current;
  const logoutAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnim = (anim: Animated.Value) => {
      return Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      });
    };

    Animated.stagger(100, [
      createAnim(headerAnim),
      createAnim(gamifyAnim),
      createAnim(badgesAnim),
      createAnim(settingsAnim),
      createAnim(aboutAnim),
      createAnim(logoutAnim),
    ]).start();
  }, []);

  const getAnimStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View style={getAnimStyle(headerAnim)}>
        <Surface style={styles.header} elevation={2}>
        <TouchableOpacity onPress={handlePickAvatar} disabled={submitting}>
          {profile?.avatar_url ? (
            <Avatar.Image size={80} source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <Avatar.Text
              size={80}
              label={profile?.full_name ? getInitials(profile.full_name) : "U"}
              style={styles.avatar}
            />
          )}
          {submitting && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 40, width: 80, height: 80, alignSelf: 'center', marginBottom: 12 }}>
              <ActivityIndicator color="#22C55E" />
            </View>
          )}
        </TouchableOpacity>
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
      </Animated.View>

      {/* GAMIFICATION SECTION */}
      <Animated.View style={[styles.gamificationRow, getAnimStyle(gamifyAnim)]}>
        <Surface style={styles.scoreCard} elevation={2}>
          <Text style={styles.scoreValue}>⭐ {stats?.xp || 0}</Text>
          <Text style={styles.scoreLabel}>Civic XP</Text>
        </Surface>
        <Surface style={styles.scoreCard} elevation={2}>
          <Text style={styles.scoreValue}>🏆 Lvl {stats?.level || 1}</Text>
          <Text style={styles.scoreLabel}>{stats?.rank || 'Citizen'}</Text>
        </Surface>
      </Animated.View>

      <Animated.View style={getAnimStyle(badgesAnim)}>
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Civic Badges
        </Text>
        <Divider />
        <View style={styles.badgesContainer}>
          {stats?.badges.map((badge) => (
            <View key={badge.id} style={[styles.badgeItem, !badge.unlocked && { opacity: 0.3 }]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeText}>{badge.name}</Text>
            </View>
          ))}
          {!stats && gamifyLoading && <ActivityIndicator color="#22C55E" />}
        </View>
      </Surface>
      </Animated.View>

      <Animated.View style={getAnimStyle(settingsAnim)}>
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
          onPress={() => { setModalType('email'); setInputValue(''); setModalVisible(true); }}
        >
          Change Email
        </Button>
        <Button
          mode="text"
          icon="lock"
          style={styles.menuItem}
          contentStyle={styles.menuItemContent}
          onPress={() => { setModalType('password'); setInputValue(''); setModalVisible(true); }}
        >
          Change Password
        </Button>
      </Surface>
      </Animated.View>

      <Animated.View style={getAnimStyle(aboutAnim)}>
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
      </Animated.View>

      <Animated.View style={getAnimStyle(logoutAnim)}>
      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#D32F2F"
        icon="logout"
      >
        Logout
      </Button>
      </Animated.View>
      
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent} elevation={5}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {modalType === 'email' ? 'Change Email' : 'Change Password'}
            </Text>
            <TextInput
              mode="outlined"
              label={modalType === 'email' ? 'New Email Address' : 'New Password'}
              value={inputValue}
              onChangeText={setInputValue}
              secureTextEntry={modalType === 'password'}
              autoCapitalize="none"
              style={{ backgroundColor: '#120F17', marginBottom: 16 }}
              textColor="#FFFFFF"
              theme={{ colors: { onSurfaceVariant: '#A0A0A0', primary: '#22C55E' } }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button onPress={() => setModalVisible(false)} textColor="#A0A0A0">Cancel</Button>
              <Button mode="contained" onPress={handleUpdateUser} buttonColor="#22C55E" textColor="#0B1120" loading={submitting}>
                Update
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1120",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#111827",
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: "#166534",
    marginBottom: 12,
  },
  name: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  email: {
    color: "#A0A0A0",
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: "rgba(34,197,94,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  roleText: {
    color: "#22C55E",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#111827",
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuItem: {
    justifyContent: "flex-start",
  },
  menuItemContent: {
    justifyContent: "flex-start",
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0B1120',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  gamificationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderColor: 'rgba(34,197,94,0.3)',
    borderWidth: 1,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 4,
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
