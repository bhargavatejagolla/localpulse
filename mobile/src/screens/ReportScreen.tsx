import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Surface,
  Chip,
  ActivityIndicator,
  Switch,
  useTheme,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../hooks/useAuth";
import { useLocationContext } from "../hooks/useLocationContext";
import { LeafletMap } from '../components/LeafletMap';
import { createIssue, uploadIssueImage } from "../services/database";
import { triggerNotification } from "../services/api";
import { classifyIssue, generateTitle, checkDuplicates } from "../services/aiService";
import { IssueCategory, IssueSeverity } from "../types";

export const ReportScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const { location } = useLocationContext();
  const theme = useTheme();

  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    category: IssueCategory;
    severity: IssueSeverity;
    confidence: number;
    reasoning?: string;
  } | null>(null);

  const [customLocation, setCustomLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Animations
  const imageAnim = React.useRef(new Animated.Value(0)).current;
  const descAnim = React.useRef(new Animated.Value(0)).current;
  const anonAnim = React.useRef(new Animated.Value(0)).current;
  const btnAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createAnim = (anim: Animated.Value) => {
      return Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      });
    };

    Animated.stagger(100, [
      createAnim(imageAnim),
      createAnim(descAnim),
      createAnim(anonAnim),
      createAnim(btnAnim),
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
    ],
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera permission is required to capture issues.",
      );
      return;
    }

    Alert.alert("Choose Image", "Take a photo or choose from gallery?", [
      {
        text: "Camera",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setAiResult(null);
          }
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setAiResult(null);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleLocationSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Append , India for better local search accuracy as requested
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', India')}&limit=1`, {
        headers: {
          'User-Agent': 'LocalPulseApp/1.0',
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCustomLocation({ lat, lng });
      } else {
        Alert.alert('Location Not Found', 'We couldn\'t find that exact address.\n\nPlease try a broader search or simply tap the map to place the pin manually!');
      }
    } catch (e) {
      Alert.alert("Error", "Could not search location.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Error", "Please describe the issue");
      return;
    }

    const submitLat = customLocation ? customLocation.lat : location?.latitude;
    const submitLng = customLocation ? customLocation.lng : location?.longitude;

    if (!submitLat || !submitLng) {
      Alert.alert("Error", "Location is required to report an issue.");
      return;
    }

    if (!imageUri) {
      Alert.alert("Required", "Please add a photo of the issue.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload image
      let imageUrl: string | null = null;
      if (imageUri) {
        try {
          imageUrl = await uploadIssueImage(imageUri, "issue.jpg");
        } catch (uploadError: any) {
          if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('Storage')) {
            console.log('Skipping image upload due to missing bucket');
            Alert.alert("Notice", "Image skipped. Please create an 'issue-images' public bucket in your Supabase dashboard.");
          } else {
            throw uploadError;
          }
        }
      }

      // Step 2: AI Classification
      const classification = await classifyIssue(imageUrl, description);
      setAiResult(classification);

      // Check duplicates
      const duplicates = await checkDuplicates(description, classification.category, { latitude: submitLat, longitude: submitLng });

      if (duplicates.length > 0) {
        Alert.alert(
          '⚠️ Similar Issue Found',
          `There ${duplicates.length === 1 ? 'is' : 'are'} ${duplicates.length} similar issue${duplicates.length > 1 ? 's' : ''} nearby:\n\n${duplicates.map(d => `• ${d.title}`).join('\n')}\n\nStill want to report?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Report Anyway', onPress: () => submitIssue(classification, imageUrl, { latitude: submitLat, longitude: submitLng }) },
          ]
        );
        return;
      }

      await submitIssue(classification, imageUrl, { latitude: submitLat, longitude: submitLng });
    } catch (error: any) {
      console.error("Submit error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to submit issue. Please try again.",
      );
      setLoading(false);
    }
  };

  const submitIssue = async (classification: any, imageUrl: string | null, loc: { latitude: number, longitude: number }) => {
    try {
      const title = generateTitle(classification.category, description);

      const issue = await createIssue(
        user!.id,
        title,
        description,
        classification.category,
        classification.severity,
        imageUrl,
        loc,
        isAnonymous,
      );

      // Trigger the backend notification engine asynchronously (no await needed for UI flow)
      triggerNotification(issue.id).catch(console.error);

      Alert.alert(
        "✅ Issue Reported!",
        `Category: ${classification.category}\nSeverity: ${classification.severity}\n\nYour report has been submitted successfully.`,
        [
          {
            text: "OK",
            onPress: () => {
              setDescription("");
              setImageUri(null);
              setAiResult(null);
              setCustomLocation(null);
              setSearchQuery("");
              navigation.navigate('FeedList');
            },
          },
        ],
      );
    } catch (error: any) {
      console.error("Submit final error:", error);
      Alert.alert("Error", error.message || "Failed to create issue.");
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: Record<IssueCategory, string> = {
    roads: "🛣️ Roads",
    water: "💧 Water",
    electricity: "⚡ Electricity",
    safety: "🛡️ Safety",
    sanitation: "🧹 Sanitation",
  };

  const severityColors: Record<IssueSeverity, string> = {
    low: "#FFC107",
    medium: "#FF9800",
    high: "#F44336",
    critical: "#B71C1C",
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Picker */}
        <Animated.View style={getAnimStyle(imageAnim)}>
        <Surface style={styles.imageSection} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            📸 Photo Evidence
          </Text>
          <TouchableOpacity
            onPress={handlePickImage}
            style={styles.imagePicker}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text variant="bodyLarge" style={styles.imagePlaceholderText}>
                  📷
                </Text>
                <Text
                  variant="bodyMedium"
                  style={styles.imagePlaceholderSubtext}
                >
                  Tap to capture or upload
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {imageUri && (
            <Button mode="text" onPress={handlePickImage} compact>
              Change Photo
            </Button>
          )}
        </Surface>
        </Animated.View>

        <Animated.View style={getAnimStyle(descAnim, 10)}>
          <Surface style={styles.formSection} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📍 Location
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <TextInput
                mode="outlined"
                placeholder="Search address or area..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", height: 40 }}
                textColor="#FFFFFF"
                theme={{ colors: { onSurfaceVariant: "#A0A0A0", primary: "#22C55E" } }}
                onSubmitEditing={handleLocationSearch}
              />
              <Button 
                mode="contained" 
                onPress={handleLocationSearch} 
                loading={isSearching}
                buttonColor="#22C55E"
                textColor="#0B1120"
                style={{ marginLeft: 8 }}
              >
                Search
              </Button>
            </View>
            <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <LeafletMap 
                center={{ latitude: customLocation?.lat || location?.latitude || 0, longitude: customLocation?.lng || location?.longitude || 0 }} 
                mode="picker" 
                onLocationSelect={(lat, lng) => setCustomLocation({ lat, lng })}
              />
            </View>
            <Text style={{ color: '#A0A0A0', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              Tap the map to manually pin the exact issue location.
            </Text>
          </Surface>
        </Animated.View>

        {/* Description */}
        <Animated.View style={getAnimStyle(descAnim, 20)}>
        <Surface style={styles.formSection} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            📝 Description
          </Text>
          <TextInput
            label="What's the issue?"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Describe the problem you found..."
            placeholderTextColor="#A0A0A0"
            style={styles.textArea}
            theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }}
          />
          <Button 
            mode="contained-tonal" 
            icon="magic-staff" 
            onPress={async () => {
              if (!description.trim()) {
                Alert.alert("Required", "Type a description first!"); return;
              }
              setLoading(true);
              const result = await classifyIssue(null, description);
              setAiResult(result);
              setLoading(false);
            }}
            style={{ marginTop: 8 }}
          >
            AI Auto-Fill Category
          </Button>
        </Surface>
        </Animated.View>

        {/* Anonymous Toggle */}
        <Animated.View style={getAnimStyle(anonAnim, 30)}>
        <Surface style={styles.formSection} elevation={1}>
          <View style={styles.anonymousRow}>
            <View>
              <Text variant="titleSmall" style={{ color: '#FFFFFF' }}>👤 Anonymous Report</Text>
              <Text variant="bodySmall" style={styles.anonymousHint}>
                Your name won't be shown publicly
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              color="#22C55E"
            />
          </View>
        </Surface>

        {/* AI Result Preview */}
        {aiResult && (
          <Surface style={styles.aiResult} elevation={1}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                🤖 AI Severity Detection
              </Text>
              <Text style={{ color: '#22C55E', fontWeight: 'bold', fontSize: 12 }}>
                {Math.round(aiResult.confidence * 100)}% Confidence
              </Text>
            </View>
            <View style={styles.aiRow}>
              <Chip icon="tag" style={styles.aiChip}>
                {categoryLabels[aiResult.category]}
              </Chip>
              <Chip
                icon="alert"
                style={[
                  styles.aiChip,
                  { backgroundColor: severityColors[aiResult.severity] + "20" },
                ]}
                textStyle={{ color: severityColors[aiResult.severity] }}
              >
                {aiResult.severity.toUpperCase()}
              </Chip>
            </View>
            {aiResult.reasoning && (
              <Text style={{ color: '#A0A0A0', fontSize: 13, marginTop: 12, fontStyle: 'italic' }}>
                " {aiResult.reasoning} "
              </Text>
            )}
          </Surface>
        )}
        </Animated.View>

        {/* Submit Button */}
        <Animated.View style={[styles.section, getAnimStyle(btnAnim), { flexDirection: 'row', gap: 12 }]}>
          <Button
            mode="outlined"
            onPress={() => {
              setDescription('');
              setImageUri(null);
              navigation.navigate('FeedList');
            }}
            style={[styles.submitButton, { flex: 1 }]}
            textColor="#A0A0A0"
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={[styles.submitButton, { flex: 2 }]}
            buttonColor="#22C55E"
            textColor="#0B1120"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1120",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageSection: {
    backgroundColor: "#111827",
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#FFFFFF",
    marginBottom: 12,
    fontWeight: "600",
  },
  imagePicker: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    borderStyle: "dashed",
  },
  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderSubtext: {
    color: "#A0A0A0",
  },
  formSection: {
    backgroundColor: "#111827",
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  anonymousRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  anonymousHint: {
    color: "#A0A0A0",
    marginTop: 2,
  },
  aiResult: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.3)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  aiRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  aiChip: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  locationSection: {
    backgroundColor: "transparent",
    padding: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  locationText: {
    color: "#A0A0A0",
  },
  submitButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
