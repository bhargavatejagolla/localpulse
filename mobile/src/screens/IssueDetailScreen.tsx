import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
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
import { Issue, Comment, IssueCategory, IssueSeverity } from '../types';
import { getIssueById, toggleUpvote } from '../services/database';
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
      // Update comment count locally
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
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge">Issue not found</Text>
        <Button mode="text" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1B5E20']} />
        }
      >
        {/* Issue Image */}
        {issue.image_url && (
          <Image source={{ uri: issue.image_url }} style={styles.issueImage} />
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

          {/* Upvote & Comment Counts */}
          <View style={styles.actionRow}>
            <View style={styles.actionItem}>
              <IconButton
                icon={hasUpvoted ? 'arrow-up-bold' : 'arrow-up-bold-outline'}
                iconColor={hasUpvoted ? '#1B5E20' : '#757575'}
                size={28}
                onPress={handleUpvote}
                disabled={upvoting}
              />
              <Text style={[styles.actionCount, { color: hasUpvoted ? '#1B5E20' : '#757575' }]}>
                {upvoteCount}
              </Text>
            </View>
            <View style={styles.actionItem}>
              <IconButton icon="comment-outline" iconColor="#757575" size={24} />
              <Text style={styles.actionCount}>{issue.comment_count || 0}</Text>
            </View>
          </View>
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
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text variant="labelMedium" style={styles.commentAuthor}>
                    {comment.profiles?.full_name || 'Anonymous'}
                  </Text>
                  <Text variant="labelSmall" style={styles.commentTime}>
                    {getTimeAgo(comment.created_at)}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.commentText}>
                  {comment.text}
                </Text>
                <Divider style={styles.commentDivider} />
              </View>
            ))
          )}
        </Surface>
      </ScrollView>

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
                color={newComment.trim() ? '#1B5E20' : '#BDBDBD'}
              />
            }
            onSubmitEditing={handleAddComment}
          />
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: '#F5F5F5',
    height: 30,
  },
  categoryText: {
    fontSize: 12,
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
  title: {
    color: '#212121',
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#616161',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    color: '#9E9E9E',
  },
  anonymousText: {
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  commentsTitle: {
    color: '#212121',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
  },
  emptyComments: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9E9E9E',
  },
  commentItem: {
    marginBottom: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  commentTime: {
    color: '#BDBDBD',
  },
  commentText: {
    color: '#424242',
    marginBottom: 8,
  },
  commentDivider: {
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});