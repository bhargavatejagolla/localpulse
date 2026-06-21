import React from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { LocationProvider } from "./src/hooks/useLocationContext";
import { NotificationProvider } from "./src/hooks/NotificationContext";

import { LoginScreen } from "./src/screens/LoginScreen";
import { SignupScreen } from "./src/screens/SignupScreen";
import { MainTabs } from "./src/navigation/MainTabs";
import { ErrorBoundary } from './src/components/ErrorBoundary';

const Stack = createNativeStackNavigator();

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#166534", // Emerald Green
    secondary: "#22C55E", // Neon Green
    background: "#0B1120", // Dark Navy
    surface: "#111827", // Cards
    onSurface: "#FFFFFF",
  },
};

const LoadingScreen = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0B1120",
      }}
    >
      <ActivityIndicator size="large" color="#22C55E" />
    </View>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <LocationProvider>
              <NotificationProvider>
                <NavigationContainer theme={NavigationDarkTheme}>
                  <AppNavigator />
                </NavigationContainer>
              </NotificationProvider>
            </LocationProvider>
          </AuthProvider>

          <StatusBar style="light" />
        </PaperProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
