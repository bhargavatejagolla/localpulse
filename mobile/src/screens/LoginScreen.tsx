import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
  Alert,
} from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../hooks/useAuth";
import { AnimatedBackground } from "../components/AnimatedBackground";

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const theme = useTheme();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const formBgAnim = useRef(new Animated.Value(0)).current;
  const emailAnim = useRef(new Animated.Value(0)).current;
  const passAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setIsEmailLoading(true);
    const { error } = await signIn(email.trim(), password);
    setIsEmailLoading(false);

    if (error) {
      let errorMsg = error;
      if (error.toLowerCase().includes("invalid login credentials")) {
        errorMsg = "Incorrect email or password. Please try again or create an account if you don't have one.";
      }
      Alert.alert("Login Failed", errorMsg);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AnimatedBackground colors={['#166534', '#22C55E', '#0B1120']} style="lightfall" />
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
            Your neighbourhood, connected.
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
                Welcome Back
              </Text>

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
          </Animated.View>

          <Animated.View style={getAnimStyle(btnAnim, 20)}>
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isEmailLoading}
              disabled={isEmailLoading || isGoogleLoading}
              style={styles.button}
              labelStyle={{ fontWeight: "bold", fontSize: 16 }}
              textColor="#0B1120"
              contentStyle={styles.buttonContent}
            >
              Sign In
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
              Sign in with Google
            </Button>
          </Animated.View>

          <Animated.View style={[styles.signupRow, getAnimStyle(footerAnim, 10)]}>
            <Text variant="bodyMedium" style={{ color: "#A0A0A0" }}>Don't have an account? </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate("Signup")}
              textColor="#22C55E"
              compact
            >
              Sign Up
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
    borderRadius: 26, // Slightly larger than form
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
    margin: 2, // This creates the 2px glowing border
    overflow: 'hidden',
  },
  form: {
    backgroundColor: "rgba(11, 17, 32, 0.85)", // Dark Navy glass
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
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
});
