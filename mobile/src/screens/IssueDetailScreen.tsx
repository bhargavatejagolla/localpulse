import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Keyboard,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  Surface,
  Chip,
  IconButton,
  TextInput,
  Button,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Issue, Comment, IssueCategory, IssueSeverity } from '../types';
import { getIssueById, toggleUpvote, updateIssueStatus } from '../services/database';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface IssueDetailScreenProps {
  route: { params: { issueId: string } };
  navigation: any;
}

const categoryIcons: Record<IssueCategory, string> = {
  roads: '🛣️',
  water: '💧',
  electricity: '⚡',
  safety: '🛡️',
  sanitation: '🧹',
};

const severityColors: Record<IssueSeverity, string> = {
  low: '#FFC107',
  medium: '#FF9800',
  high: '#F44336',
  critical: '#B71C1C',
};

const statusColors: Record<string, string> = {
  Open: '#FF6F00',
  'Under Review': '#1976D2',
  'In Progress': '#388E3C',
  Resolved: '#757575',
};

export const IssueDetailScreen = ({ route, navigation }: any) => {
  const { issueId } = route.params;
  const { user, profile } = useAuth();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  const fetchIssue = useCallback(async () => {
    if (!issueId) return;
    try {
      const data = await getIssueById(issueId);
      if (data) {
        setIssue(data);
        setUpvoteCount(data.upvote_count || 0);
      }
    } catch (error) {
      console.error('Fetch issue error:', error);
    }
  }, [issueId]);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(full_name, avatar_url)')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setComments(data as Comment[]);
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
    }
  }, [issueId]);

  const checkUpvote = useCallback(async () => {
    if (!user || !issueId) return;
    try {
      const { data } = await supabase
        .from('upvotes')
        .select('id')
        .eq('issue_id', issueId)
        .eq('user_id', user.id)
        .single();
      setHasUpvoted(!!data);
    } catch (error) {
      setHasUpvoted(false);
    }
  }, [user, issueId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchIssue(), fetchComments(), checkUpvote()]);
      setLoading(false);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    };
    loadData();
  }, [fetchIssue, fetchComments, checkUpvote]);

  // Real-time comments subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${issueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `issue_id=eq.${issueId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, fetchComments]);

  const handleUpvote = async () => {
    if (!user || !issue) return;
    setUpvoting(true);

    try {
      const newCount = await toggleUpvote(issue.id, user.id);
      setUpvoteCount(newCount);
      setHasUpvoted(!hasUpvoted);
    } catch (error) {
      console.error('Upvote error:', error);
    } finally {
      setUpvoting(false);
    }
  };

  const handleResolve = async () => {
    if (!issue || !user) return;
    Alert.alert(
      "Resolve Issue",
      "Are you sure you want to mark this issue as Resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);
              await supabase.from('issues').update({ status: 'Resolved' }).eq('id', issue.id);
              Alert.alert('🎉 Incredible!', 'Thank you for making your community a better place! You have earned 100 Civic XP!');
              fetchIssue();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to resolve issue.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDelete = async () => {
    if (!issue || !user || issue.user_id !== user.id) return;
    Alert.alert(
      "Withdraw Issue",
      "Are you sure you want to withdraw this report? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await supabase.from('issues').delete().eq('id', issue.id);
              navigation.goBack();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to withdraw issue.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !issue) return;
    setSubmittingComment(true);

    try {
      const { error } = await supabase.from('comments').insert({
        issue_id: issue.id,
        user_id: user.id,
        text: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      Keyboard.dismiss();
      if (issue) {
        setIssue({ ...issue, comment_count: (issue.comment_count || 0) + 1 });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
      console.error('Comment error:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchIssue(), fetchComments(), checkUpvote()]);
    setRefreshing(false);
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge" style={{ color: '#A0A0A0' }}>Issue not found</Text>
        <Button mode="text" textColor="#22C55E" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1B5E20']} />
        }
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Issue Image */}
        {issue.image_url && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setIsZoomVisible(true)}>
            <Image source={{ uri: issue.image_url }} style={styles.issueImage} />
          </TouchableOpacity>
        )}

        {/* Issue Details */}
        <Surface style={styles.detailSection} elevation={1}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            <Chip style={styles.categoryChip} textStyle={styles.categoryText}>
              {categoryIcons[issue.category]} {issue.category}
            </Chip>
            <Chip
              style={[styles.severityChip, { backgroundColor: severityColors[issue.severity] + '20' }]}
              textStyle={{ color: severityColors[issue.severity], fontWeight: '700', fontSize: 11 }}
            >
              {issue.severity.toUpperCase()}
            </Chip>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[issue.status] + '20' }]}>
              <Text style={[styles.statusText, { color: statusColors[issue.status] }]}>
                {issue.status}
              </Text>
            </View>
          </View>

          {/* AI Timeline */}
          <Surface style={styles.section} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🤖 AI Timeline
            </Text>
            <View style={styles.timelineItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#A0A0A0" />
              <Text style={styles.timelineText}>{getTimeAgo(issue.created_at)} - Reported by Citizen</Text>
            </View>
            <View style={styles.timelineItem}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color="#22C55E" />
              <Text style={styles.timelineText}>AI Classified Category</Text>
            </View>
            <View style={styles.timelineItem}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={severityColors[issue.severity]} />
              <Text style={styles.timelineText}>AI Severity Estimated</Text>
            </View>
          </Surface>

          {/* Title */}
          <Text variant="headlineSmall" style={styles.title}>
            {issue.title}
          </Text>

          {/* Description */}
          {issue.description && (
            <Text variant="bodyMedium" style={styles.description}>
              {issue.description}
            </Text>
          )}

          {/* Meta */}
          <View style={styles.metaRow}>
            <Text variant="labelSmall" style={styles.metaText}>
              {getTimeAgo(issue.created_at)}
            </Text>
            {issue.is_anonymous && (
              <Text variant="labelSmall" style={styles.anonymousText}>
                • Reported Anonymously
              </Text>
            )}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.actionItem}>
                <IconButton
                  icon={hasUpvoted ? 'arrow-up-bold' : 'arrow-up-bold-outline'}
                  iconColor={hasUpvoted ? '#22C55E' : '#757575'}
                  size={28}
                  onPress={handleUpvote}
                  disabled={upvoting}
                />
                <Text style={[styles.actionCount, { color: hasUpvoted ? '#22C55E' : '#757575' }]}>
                  {upvoteCount}
                </Text>
              </View>
              <View style={styles.actionItem}>
                <IconButton icon="comment-outline" iconColor="#A0A0A0" size={24} />
                <Text style={styles.actionCount}>{issue.comment_count || 0}</Text>
              </View>
            </View>

            {/* Withdraw Action (Creator only) */}
            {user?.id === issue.user_id && issue.status !== 'Resolved' && (
              <Button 
                mode="text" 
                textColor="#F44336" 
                icon="delete-outline" 
                onPress={handleDelete}
              >
                Withdraw
              </Button>
            )}
          </View>
          
          {/* Resolve Action */}
          {issue.status !== 'Resolved' && (user?.id === issue.user_id || user?.user_metadata?.role === 'authority') && (
            <Button
              mode="contained"
              buttonColor="#22C55E"
              textColor="#0B1120"
              icon="check-decagram"
              style={{ marginTop: 16, borderRadius: 12, paddingVertical: 4 }}
              labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
              onPress={handleResolve}
            >
              Mark as Resolved (+100 XP)
            </Button>
          )}
        </Surface>

        {/* Comments Section */}
        <Surface style={styles.commentsSection} elevation={1}>
          <Text variant="titleMedium" style={styles.commentsTitle}>
            💬 Comments ({comments.length})
          </Text>
          <Divider style={styles.divider} />

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No comments yet. Be the first to share your thoughts.
              </Text>
            </View>
          ) : (
            comments.map((comment, index) => (
              <Animated.View key={comment.id} style={[styles.commentItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.commentHeader}>
                  <Avatar.Text 
                    size={28} 
                    label={comment.profiles?.full_name?.charAt(0) || 'A'} 
                    style={{ backgroundColor: 'rgba(34,197,94,0.2)', marginRight: 12 }} 
                    color="#22C55E" 
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelMedium" style={styles.commentAuthor}>
                      {comment.profiles?.full_name || 'Anonymous Civic Hero'}
                    </Text>
                    <Text variant="labelSmall" style={styles.commentTime}>
                      {getTimeAgo(comment.created_at)}
                    </Text>
                  </View>
                </View>
                <Surface style={styles.commentBubble} elevation={0}>
                  <Text variant="bodyMedium" style={styles.commentText}>
                    {comment.text}
                  </Text>
                </Surface>
              </Animated.View>
            ))
          )}
        </Surface>
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Image Zoom Modal */}
      {issue.image_url && (
        <Modal visible={isZoomVisible} transparent={true} animationType="fade" onRequestClose={() => setIsZoomVisible(false)}>
          <View style={{ flex: 1, backgroundColor: '#000000' }}>
            <IconButton
              icon="close"
              iconColor="#FFFFFF"
              size={28}
              style={{ position: 'absolute', top: 50, right: 16, zIndex: 10 }}
              onPress={() => setIsZoomVisible(false)}
            />
            <ImageViewer
              imageUrls={[{ url: issue.image_url }]}
              enableSwipeDown={true}
              onSwipeDown={() => setIsZoomVisible(false)}
              renderIndicator={() => <View />}
            />
          </View>
        </Modal>
      )}

      {/* Comment Input */}
      <Surface style={styles.commentInputContainer} elevation={4}>
        <View style={styles.commentInputRow}>
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
            mode="outlined"
            style={styles.commentInput}
            dense
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
                color={newComment.trim() ? '#22C55E' : '#A0A0A0'}
              />
            }
            onSubmitEditing={handleAddComment}
            theme={{ colors: { onSurfaceVariant: '#FFFFFF', primary: '#22C55E' } }}
          />
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1120',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  issueImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  detailSection: {
    backgroundColor: '#111827',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 30,
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  severityChip: {
    height: 30,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineText: {
    color: '#A0A0A0',
    fontSize: 13,
    marginLeft: 8,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#A0A0A0',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    color: '#757575',
  },
  anonymousText: {
    color: '#757575',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: -4,
    color: '#FFFFFF'
  },
  commentsSection: {
    backgroundColor: '#111827',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  commentsTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emptyComments: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#A0A0A0',
  },
  commentItem: {
    marginBottom: 20,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  commentTime: {
    color: '#757575',
  },
  commentBubble: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    marginLeft: 40,
  },
  commentText: {
    color: '#E0E0E0',
    lineHeight: 20,
  },
  commentDivider: {
    display: 'none',
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B1120',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#111827',
  },
});