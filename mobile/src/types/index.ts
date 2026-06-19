// ==================== USER & AUTH ====================

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: 'resident' | 'authority' | 'admin';
  avatar_url: string | null;
  expo_push_token: string | null;
  created_at: string;
}

export type UserRole = 'resident' | 'authority' | 'admin';

// ==================== ISSUES ====================

export type IssueCategory = 'roads' | 'water' | 'electricity' | 'safety' | 'sanitation';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 'Open' | 'Under Review' | 'In Progress' | 'Resolved';

export interface Issue {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  category: IssueCategory;
  severity: IssueSeverity;
  image_url: string | null;
  location: GeoPoint;
  is_anonymous: boolean;
  status: IssueStatus;
  upvote_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields (optional)
  profiles?: Profile | null;
  user_has_upvoted?: boolean;
}

// ==================== GEO ====================

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// ==================== COMMENTS ====================

export interface Comment {
  id: string;
  issue_id: string;
  user_id: string | null;
  text: string;
  created_at: string;
  profiles?: Profile | null;
}

// ==================== UPVOTES ====================

export interface Upvote {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
}

// ==================== EVENTS ====================

export interface Event {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  event_date: string | null;
  image_url: string | null;
  location: GeoPoint;
  created_at: string;
}

// ==================== SERVICE PROVIDERS ====================

export type ProviderCategory = 'plumber' | 'electrician' | 'carpenter' | 'tutor' | 'technician' | 'other';

export interface ServiceProvider {
  id: string;
  name: string;
  category: ProviderCategory;
  phone: string | null;
  rating: number;
  review_count: number;
  location: GeoPoint;
  created_at: string;
}

export interface ProviderReview {
  id: string;
  provider_id: string;
  user_id: string | null;
  rating: number;
  review: string | null;
  created_at: string;
}

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: string;
  user_id: string;
  issue_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ==================== STATUS HISTORY ====================

export interface StatusHistory {
  id: string;
  issue_id: string;
  changed_by: string | null;
  old_status: IssueStatus | null;
  new_status: IssueStatus;
  created_at: string;
}

// ==================== AI CLASSIFICATION ====================

export interface AIClassificationResult {
  category: IssueCategory;
  severity: IssueSeverity;
  confidence?: number;
}

// ==================== RADIUS OPTIONS ====================

export type RadiusOption = 1 | 3 | 5 | 10;

export const RADIUS_OPTIONS: RadiusOption[] = [1, 3, 5, 10];
export const DEFAULT_RADIUS: RadiusOption = 3;

// ==================== FEED SORT ====================

export type FeedSortOption = 'recent' | 'upvotes';

// ==================== NAVIGATION PARAMS ====================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  IssueDetail: { issueId: string };
  ReportIssue: undefined;
  CreateEvent: undefined;
  AddProvider: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Report: undefined;
  Events: undefined;
  Profile: undefined;
};