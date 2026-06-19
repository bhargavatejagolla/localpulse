
import { supabase } from "../lib/supabase";
import {
  Issue,
  Profile,
  Comment,
  IssueCategory,
  IssueSeverity,
  IssueStatus,
  Coordinates,
  Notification,
} from "../types";

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

export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>,
) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
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

export const getAllIssues = async () => {
  const { data, error } = await supabase
    .from("issues")
    .select("*, profiles(full_name, avatar_url)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Issue[];
};

export const getIssuesByUser = async (userId: string) => {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

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

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// ==================== CREATE ISSUE ====================

export const createIssue = async (
  userId: string,
  title: string,
  description: string,
  category: IssueCategory,
  severity: IssueSeverity,
  imageUrl: string | null,
  coordinates: Coordinates,
  isAnonymous: boolean,
): Promise<Issue> => {
  const { data, error } = await supabase
    .from("issues")
    .insert({
      user_id: isAnonymous ? null : userId,
      title,
      description,
      category,
      severity,
      image_url: imageUrl,
      location: `POINT(${coordinates.longitude} ${coordinates.latitude})`,
      is_anonymous: isAnonymous,
      status: "Open",
    })
    .select("*")
    .single();

  if (error) {
    console.error("Create issue error:", error);
    throw error;
  }

  return data as Issue;
};

// ==================== IMAGE UPLOAD ====================

export const uploadIssueImage = async (
  uri: string,
  fileName: string,
): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const fileExt = fileName.split(".").pop() || "jpg";

    const filePath = `issues/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("issue-images")
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("issue-images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

// ==================== GET ISSUE ====================

export const getIssueById = async (issueId: string): Promise<Issue | null> => {
  const { data, error } = await supabase
    .from("issues")
    .select("*, profiles(full_name, avatar_url)")
    .eq("id", issueId)
    .single();

  if (error) {
    console.error("Get issue error:", error);
    return null;
  }

  return data as Issue;
};

// ==================== UPVOTES ====================

export const toggleUpvote = async (
  issueId: string,
  userId: string,
): Promise<number> => {
  const { data, error } = await supabase.rpc("toggle_upvote", {
    issue_uuid: issueId,
    user_uuid: userId,
  });

  if (error) {
    console.error("Toggle upvote error:", error);
    throw error;
  }

  return data;
};

export const hasUserUpvoted = async (
  issueId: string,
  userId: string,
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("upvotes")
    .select("id")
    .eq("issue_id", issueId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Check upvote error:", error);
  }

  return !!data;
};

export const getUpvoteCount = async (issueId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("upvotes")
    .select("*", { count: "exact", head: true })
    .eq("issue_id", issueId);

  if (error) {
    console.error("Get upvote count error:", error);
    return 0;
  }

  return count || 0;
};

// ==================== COMMENTS ====================

export const getCommentsForIssue = async (
  issueId: string,
): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(full_name, avatar_url)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Comment[];
};

export const createComment = async (
  issueId: string,
  userId: string,
  content: string,
): Promise<Comment> => {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      issue_id: issueId,
      user_id: userId,
      content,
    })
    .select("*, profiles(full_name, avatar_url)")
    .single();

  if (error) throw error;
  return data as Comment;
};

// ==================== STATUS FUNCTIONS ====================

export const updateIssueStatus = async (
  issueId: string,
  newStatus: IssueStatus,
  userId: string,
): Promise<void> => {
  // Update the issue status
  const { error: updateError } = await supabase
    .from("issues")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", issueId);

  if (updateError) throw updateError;

  // Log status change in status_history
  const { error: historyError } = await supabase.from("status_history").insert({
    issue_id: issueId,
    changed_by: userId,
    new_status: newStatus,
  });

  if (historyError) {
    console.error("Error logging status change:", historyError);
    // Don't throw here - the status update succeeded
  }
};

export const getIssueStatusHistory = async (issueId: string) => {
  const { data, error } = await supabase
    .from("status_history")
    .select("*, profiles(full_name)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// ==================== PUSH NOTIFICATIONS ====================

export const savePushToken = async (
  userId: string,
  token: string,
): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .update({ expo_push_token: token })
    .eq("user_id", userId);

  if (error) console.error("Save push token error:", error);
};

export const removePushToken = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .update({ expo_push_token: null })
    .eq("user_id", userId);

  if (error) console.error("Remove push token error:", error);
};

// ==================== NOTIFICATIONS ====================

export const getNotifications = async (
  userId: string,
): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as Notification[];
};

export const markNotificationRead = async (
  notificationId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) console.error("Mark notification read error:", error);
};

export const markAllNotificationsRead = async (
  userId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) console.error("Mark all notifications read error:", error);
};

export const getUnreadNotificationCount = async (
  userId: string,
): Promise<number> => {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Get unread count error:", error);
    return 0;
  }

  return count || 0;
};

// ==================== DELETE FUNCTIONS ====================

export const deleteIssue = async (
  issueId: string,
  userId: string,
): Promise<void> => {
  // First verify the user owns this issue
  const { data: issue, error: fetchError } = await supabase
    .from("issues")
    .select("user_id")
    .eq("id", issueId)
    .single();

  if (fetchError) throw fetchError;
  if (issue.user_id !== userId)
    throw new Error("Unauthorized: You do not own this issue");

  const { error } = await supabase.from("issues").delete().eq("id", issueId);

  if (error) throw error;
};

export const deleteComment = async (
  commentId: string,
  userId: string,
): Promise<void> => {
  // First verify the user owns this comment
  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .single();

  if (fetchError) throw fetchError;
  if (comment.user_id !== userId)
    throw new Error("Unauthorized: You do not own this comment");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
};
