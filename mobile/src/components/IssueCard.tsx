import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { Text, Surface, Chip, IconButton, useTheme } from 'react-native-paper';
import { Issue, IssueCategory, IssueSeverity } from '../types';

interface IssueCardProps {
  issue: Issue;
  onPress: (issue: Issue) => void;
  onUpvote: (issueId: string) => void;
  hasUpvoted: boolean;
  isUpvoting: boolean;
  index?: number;
  isOwner?: boolean;
  onDelete?: (issue: Issue) => void;
  onResolve?: (issue: Issue) => void;
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

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onPress,
  onUpvote,
  hasUpvoted,
  isUpvoting,
  index = 0,
  isOwner = false,
  onDelete,
  onResolve,
}) => {
  const theme = useTheme();
  const timeAgo = getTimeAgo(issue.created_at);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100, // Stagger effect
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] }}>
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <TouchableOpacity 
          onPress={() => onPress(issue)} 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
        {/* Image */}
        {issue.image_url && (
          <Image source={{ uri: issue.image_url }} style={styles.image} />
        )}

        <View style={styles.content}>
          {/* Category & Severity Badges */}
          <View style={styles.badgeRow}>
            <Chip
              style={styles.categoryChip}
              textStyle={styles.categoryText}
              icon={() => (
                <Text style={styles.chipIcon}>
                  {categoryIcons[issue.category]}
                </Text>
              )}
            >
              {issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}
            </Chip>
            <Chip
              style={[
                styles.severityChip,
                { backgroundColor: severityColors[issue.severity] + '20' },
              ]}
              textStyle={{
                color: severityColors[issue.severity],
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              {issue.severity.toUpperCase()}
            </Chip>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors[issue.status] + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusColors[issue.status] },
                ]}
              >
                {issue.status}
              </Text>
            </View>
            {issue.upvote_count >= 5 && (
              <Chip
                icon="check-decagram"
                style={styles.verifiedBadge}
                textStyle={styles.verifiedText}
              >
                Community Verified
              </Chip>
            )}
            <View style={{ flex: 1 }} />
            {isOwner && issue.status !== 'Resolved' && onResolve && (
              <IconButton
                icon="check-circle-outline"
                iconColor="#22C55E"
                size={22}
                onPress={() => onResolve(issue)}
                style={{ margin: 0, marginRight: 8 }}
              />
            )}
            {isOwner && onDelete && (
              <IconButton
                icon="delete-outline"
                iconColor="#F44336"
                size={20}
                onPress={() => onDelete(issue)}
                style={{ margin: 0 }}
              />
            )}
          </View>

          {/* Title */}
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={2}>
            {issue.title}
          </Text>

          {/* Description */}
          {issue.description && (
            <Text variant="bodyMedium" style={{ color: '#A0A0A0', marginBottom: 10, lineHeight: 20 }} numberOfLines={2}>
              {issue.description}
            </Text>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text variant="labelSmall" style={styles.timeText}>
                {timeAgo}
              </Text>
              {issue.is_anonymous && (
                <Text variant="labelSmall" style={styles.anonymousText}>
                  • Anonymous
                </Text>
              )}
            </View>

            <View style={styles.footerRight}>
              <View style={styles.upvoteContainer}>
                <IconButton
                  icon={hasUpvoted ? 'arrow-up-bold' : 'arrow-up-bold-outline'}
                  iconColor={hasUpvoted ? theme.colors.primary : '#A0A0A0'}
                  size={22}
                  onPress={() => onUpvote(issue.id)}
                  disabled={isUpvoting}
                />
                <Text
                  style={[
                    styles.upvoteCount,
                    { color: hasUpvoted ? theme.colors.primary : '#A0A0A0' },
                  ]}
                >
                  {issue.upvote_count || 0}
                </Text>
              </View>
              <View style={styles.commentContainer}>
                <IconButton icon="comment-outline" iconColor="#A0A0A0" size={20} />
                <Text style={[styles.commentCount, { color: '#A0A0A0' }]}>
                  {issue.comment_count || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Surface>
    </Animated.View>
  );
};

// Helper function
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

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 28,
  },
  categoryText: {
    fontSize: 11,
  },
  chipIcon: {
    fontSize: 12,
  },
  severityChip: {
    height: 28,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    height: 28,
  },
  verifiedText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: '#616161',
    marginBottom: 10,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#9E9E9E',
  },
  anonymousText: {
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upvoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteCount: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: -6,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    color: '#757575',
    fontSize: 13,
    marginLeft: -6,
  },
});