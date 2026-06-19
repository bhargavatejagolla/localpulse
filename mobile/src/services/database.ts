import { supabase } from "../lib/supabase";
import { Issue, Profile, Comment } from "../types";

// ==================== PROFILES ====================

export const createProfile = async (userId: string, fullName: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .insert({ user_id: userId, full_name: fullName, role: "resident" })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as Profile;
};

// ==================== ISSUES ====================

export const getIssuesWithinRadius = async (
  latitude: number,
  longitude: number,
  radiusMeters: number,
) => {
  const { data, error } = await supabase.rpc("get_issues_within_radius", {
    lat: latitude,
    lng: longitude,
    radius_meters: radiusMeters,
  });

  if (error) throw error;
  return data as Issue[];
};

// ==================== AUTH ====================

export const signUp = async (
  email: string,
  password: string,
  fullName: string,
) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Signup failed");

  // Create profile
  await createProfile(authData.user.id, fullName);

  return authData;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
