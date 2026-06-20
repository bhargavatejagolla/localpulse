import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { Profile, UserRole } from "../types";
import { getProfile, createProfile, savePushToken } from "../services/database";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

import { registerForPushNotifications } from '../services/notificationService';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profileData = await getProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.log("Profile fetch error:", error);
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id)
          .then(setProfile)
          .catch(console.log)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        getProfile(session.user.id).then(setProfile).catch(console.log);

        // Register for push notifications on login
        registerForPushNotifications(session.user.id).catch(console.log);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      
      if (data.user) {
        try {
          await getProfile(data.user.id);
        } catch (e) {
          // Profile is missing (maybe failed during signup), create a fallback profile
          await createProfile(data.user.id, email.split('@')[0]);
        }
      }
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        try {
          await createProfile(data.user.id, fullName);
          await registerForPushNotifications(data.user.id).catch(console.log);
        } catch (profileError: any) {
          // If foreign key constraint fails, Supabase returned a fake user because the email is already registered
          if (profileError.message?.includes('foreign key constraint') || profileError.message?.includes('fkey')) {
            return { error: 'This email is already registered. Please go back and Sign In.' };
          }
          return { error: profileError.message };
        }
      }
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn() as any;
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      
      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) return { error: error.message };

        // Ensure profile is created if it doesn't exist
        if (data.user) {
          try {
            await getProfile(data.user.id);
          } catch (e) {
            // Profile doesn't exist, create it using Google name
            const name = userInfo.data?.user?.name || userInfo.user?.name || 'Google User';
            await createProfile(data.user.id, name);
            await registerForPushNotifications(data.user.id).catch(console.log);
          }
        }
        return {};
      } else {
        return { error: 'No ID token present!' };
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: 'Sign in cancelled' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { error: 'Sign in already in progress' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: 'Play services not available' };
      } else {
        return { error: error.message };
      }
    }
  };

  const signOut = async () => {
    try {
      // Optionally remove push token on signout
      if (user) {
        await savePushToken(user.id, ""); // Clear the token
      }
    } catch (error) {
      console.error("Error clearing push token:", error);
    }

    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
