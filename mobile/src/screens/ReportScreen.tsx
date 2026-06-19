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
import { createIssue, uploadIssueImage } from "../services/database";
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
  } | null>(null);

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

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Required", "Please describe the issue.");
      return;
    }

    if (!imageUri) {
      Alert.alert("Required", "Please add a photo of the issue.");
      return;
    }

    if (!location) {
      Alert.alert(
        "Error",
        "Location not available. Please enable location services.",
      );
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload image
      const imageUrl = await uploadIssueImage(imageUri, "issue.jpg");

      // Step 2: AI Classification
      const classification = await classifyIssue(imageUrl, description);
      setAiResult(classification);

      // Check duplicates
      const duplicates = await checkDuplicates(description, classification.category, location);

      if (duplicates.length > 0) {
        Alert.alert(
          '⚠️ Similar Issue Found',
          `There ${duplicates.length === 1 ? 'is' : 'are'} ${duplicates.length} similar issue${duplicates.length > 1 ? 's' : ''} nearby:\n\n${duplicates.map(d => `• ${d.title}`).join('\n')}\n\nStill want to report?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Report Anyway', onPress: () => submitIssue(classification, imageUrl) },
          ]
        );
        return;
      }

      await submitIssue(classification, imageUrl);
    } catch (error: any) {
      console.error("Submit error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to submit issue. Please try again.",
      );
      setLoading(false);
    }
  };

  const submitIssue = async (classification: any, imageUrl: string) => {
    try {
      const title = generateTitle(classification.category, description);

      await createIssue(
        user!.id,
        title,
        description,
        classification.category,
        classification.severity,
        imageUrl,
        location!,
        isAnonymous,
      );

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
              setIsAnonymous(false);
              navigation.navigate("Feed");
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

        {/* Description */}
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
            style={styles.textArea}
          />
        </Surface>

        {/* Anonymous Toggle */}
        <Surface style={styles.formSection} elevation={1}>
          <View style={styles.anonymousRow}>
            <View>
              <Text variant="titleSmall">👤 Anonymous Report</Text>
              <Text variant="bodySmall" style={styles.anonymousHint}>
                Your name won't be shown publicly
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              color="#1B5E20"
            />
          </View>
        </Surface>

        {/* AI Result Preview */}
        {aiResult && (
          <Surface style={styles.aiResult} elevation={1}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              🤖 AI Analysis
            </Text>
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
          </Surface>
        )}

        {/* Location Info */}
        {location && (
          <Surface style={styles.locationSection} elevation={0}>
            <Text variant="bodySmall" style={styles.locationText}>
              📍 Location: {location.latitude.toFixed(4)},{" "}
              {location.longitude.toFixed(4)}
            </Text>
          </Surface>
        )}

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !description || !imageUri}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          icon="send"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#212121",
    marginBottom: 12,
    fontWeight: "600",
  },
  imagePicker: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E0E0E0",
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
    backgroundColor: "#FAFAFA",
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderSubtext: {
    color: "#9E9E9E",
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: "#FFFFFF",
  },
  anonymousRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  anonymousHint: {
    color: "#757575",
    marginTop: 2,
  },
  aiResult: {
    backgroundColor: "#E8F5E9",
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
    backgroundColor: "#FFFFFF",
  },
  locationSection: {
    backgroundColor: "transparent",
    padding: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  locationText: {
    color: "#757575",
  },
  submitButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
