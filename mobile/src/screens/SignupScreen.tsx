import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../hooks/useAuth";
import { AnimatedBackground } from "../components/AnimatedBackground";

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const formBgAnim = React.useRef(new Animated.Value(0)).current;
  const nameAnim = React.useRef(new Animated.Value(0)).current;
  const emailAnim = React.useRef(new Animated.Value(0)).current;
  const passAnim = React.useRef(new Animated.Value(0)).current;
  const btnAnim = React.useRef(new Animated.Value(0)).current;
  const footerAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createAnim = (anim: Animated.Value, delay: number) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 700,
        delay,
        useNativeDriver: true,
      });
    };

    Animated.stagger(150, [
      createAnim(headerAnim, 0),
      createAnim(formBgAnim, 0),
      createAnim(nameAnim, 0),
      createAnim(emailAnim, 0),
      createAnim(passAnim, 0),
      createAnim(btnAnim, 0),
      createAnim(footerAnim, 0),
    ]).start();

    // Continuous spinning for border glow
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Continuous floating for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const getAnimStyle = (anim: Animated.Value, translateY: number = 30) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [translateY, 0],
        }),
      },
    ],
  });

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsEmailLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setIsEmailLoading(false);

    if (error) {
      Alert.alert("Signup Failed", error);
    } else {
      Alert.alert(
        "Success",
        "Account created! Please check your email for confirmation.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AnimatedBackground colors={['#166534', '#22C55E', '#0B1120']} style="gridscan" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.header, getAnimStyle(headerAnim, 40), { transform: [{ translateY: floatAnim }] }]}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={{ width: 100, height: 100, borderRadius: 24, marginBottom: 16 }} 
              resizeMode="contain" 
            />
            <Text variant="displaySmall" style={styles.title}>
              LocalPulse
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Join your neighbourhood network.
            </Text>
          </Animated.View>

          <Animated.View style={[getAnimStyle(formBgAnim, 50), styles.formWrapper]}>
            {/* Animated Glowing Border */}
            <View style={styles.glowContainer}>
              <Animated.View style={[styles.glowSpinner, { transform: [{ rotate: spin }] }]}>
                <LinearGradient 
                  colors={['#22C55E', 'transparent', 'transparent', '#166534']} 
                  style={StyleSheet.absoluteFill} 
                />
              </Animated.View>
            </View>
            
            <View style={styles.formInner}>
              <BlurView intensity={40} tint="dark" style={styles.form}>
            <Text variant="headlineSmall" style={styles.formTitle}>
              Create Account
            </Text>

          <Animated.View style={getAnimStyle(nameAnim, 20)}>
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={styles.input}
              textColor="#FFFFFF"
              theme={{ colors: { background: "#111827", onSurfaceVariant: "#A0A0A0", primary: "#22C55E" } }}
              left={<TextInput.Icon icon="account" color="#A0A0A0" />}
            />
          </Animated.View>

          <Animated.View style={getAnimStyle(emailAnim, 20)}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              textColor="#FFFFFF"
              theme={{ colors: { background: "#111827", onSurfaceVariant: "#A0A0A0", primary: "#22C55E" } }}
              left={<TextInput.Icon icon="email" color="#A0A0A0" />}
            />
          </Animated.View>

          <Animated.View style={getAnimStyle(passAnim, 20)}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              textColor="#FFFFFF"
              theme={{ colors: { background: "#111827", onSurfaceVariant: "#A0A0A0", primary: "#22C55E" } }}
              left={<TextInput.Icon icon="lock" color="#A0A0A0" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  color="#A0A0A0"
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              textColor="#FFFFFF"
              theme={{ colors: { background: "#111827", onSurfaceVariant: "#A0A0A0", primary: "#22C55E" } }}
              left={<TextInput.Icon icon="lock-check" color="#A0A0A0" />}
            />
          </Animated.View>

          <Animated.View style={getAnimStyle(btnAnim, 20)}>
            <Button
              mode="contained"
              onPress={handleSignup}
              loading={isEmailLoading}
              disabled={isEmailLoading || isGoogleLoading}
              style={styles.button}
              labelStyle={{ fontWeight: "bold", fontSize: 16 }}
              textColor="#0B1120"
              contentStyle={styles.buttonContent}
            >
              Create Account
            </Button>

            <Button
              mode="outlined"
              icon="google"
              onPress={async () => {
                setIsGoogleLoading(true);
                const { error } = await signInWithGoogle();
                setIsGoogleLoading(false);
                if (error) Alert.alert("Google Sign In Failed", error);
              }}
              loading={isGoogleLoading}
              disabled={isEmailLoading || isGoogleLoading}
              style={{ marginTop: 12, borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.05)" }}
              textColor="#FFFFFF"
              contentStyle={styles.buttonContent}
            >
              Sign up with Google
            </Button>
          </Animated.View>

          <Animated.View style={[styles.loginRow, getAnimStyle(footerAnim, 10)]}>
            <Text variant="bodyMedium" style={{ color: "#A0A0A0" }}>Already have an account? </Text>
            <Button mode="text" onPress={() => navigation.goBack()} textColor="#22C55E" compact>
              Sign In
            </Button>
            </Animated.View>
            </BlurView>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  subtitle: {
    color: "#A0A0A0",
    marginTop: 8,
  },
  formWrapper: {
    position: 'relative',
    borderRadius: 24,
    marginHorizontal: 4,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 26,
  },
  glowSpinner: {
    width: '200%',
    height: '200%',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
  },
  formInner: {
    backgroundColor: '#0B1120',
    borderRadius: 24,
    margin: 2,
    overflow: 'hidden',
  },
  form: {
    backgroundColor: "rgba(11, 17, 32, 0.85)",
    padding: 24,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#22C55E",
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
});
