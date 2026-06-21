import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface GamificationStats {
  xp: number;
  level: number;
  rank: string;
  badges: {
    id: string;
    name: string;
    icon: string;
    unlocked: boolean;
    description: string;
  }[];
}

export interface LeaderboardUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  xp: number;
}

export const useGamification = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateUserStats = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch user's issues
      const { data: userIssues, error } = await supabase
        .from('issues')
        .select('category, status')
        .eq('user_id', user.id);

      if (error) throw error;

      let xp = 0;
      let waterCount = 0;
      let resolvedCount = 0;

      if (userIssues) {
        userIssues.forEach(issue => {
          xp += 50; // 50 XP per report
          if (issue.status === 'Resolved') {
            xp += 100; // Bonus 100 XP if resolved
            resolvedCount++;
          }
          if (issue.category === 'water') {
            waterCount++;
          }
        });
      }

      // Calculate level based on XP (every 200 XP = 1 Level)
      const level = Math.floor(xp / 200) + 1;
      
      let rank = "Citizen";
      if (level >= 3) rank = "Active Reporter";
      if (level >= 5) rank = "Civic Guardian";
      if (level >= 10) rank = "City Champion";

      // Determine Badges
      const badges = [
        {
          id: 'first_reporter',
          name: 'First Reporter',
          icon: '🏅',
          description: 'Submit your first civic issue report.',
          unlocked: (userIssues?.length || 0) > 0,
        },
        {
          id: 'civic_hero',
          name: 'Civic Hero',
          icon: '🌍',
          description: 'Reach Level 5 by earning 800 XP.',
          unlocked: level >= 5,
        },
        {
          id: 'water_guardian',
          name: 'Water Guardian',
          icon: '🚰',
          description: 'Report at least one water-related issue.',
          unlocked: waterCount > 0,
        },
        {
          id: 'city_builder',
          name: 'City Builder',
          icon: '🏙️',
          description: 'Have at least 3 of your reports marked as Resolved.',
          unlocked: resolvedCount >= 3,
        }
      ];

      setStats({ xp, level, rank, badges });
    } catch (err) {
      console.error("Error calculating gamification stats:", err);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      // 1. Fetch all issues (in a real prod app, use a SQL View or RPC to aggregate)
      const { data: allIssues } = await supabase
        .from('issues')
        .select('user_id, status');
        
      if (!allIssues) return;

      // 2. Aggregate XP per user_id
      const xpMap: Record<string, number> = {};
      allIssues.forEach(issue => {
        if (!issue.user_id) return; // ignore anonymous
        if (!xpMap[issue.user_id]) xpMap[issue.user_id] = 0;
        
        xpMap[issue.user_id] += 50; // base points
        if (issue.status === 'Resolved') {
          xpMap[issue.user_id] += 100; // resolved bonus
        }
      });

      // 3. Sort to get top 10 user IDs
      const topUserIds = Object.keys(xpMap)
        .sort((a, b) => xpMap[b] - xpMap[a])
        .slice(0, 10);

      if (topUserIds.length === 0) return;

      // 4. Fetch profiles for these top 10 users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', topUserIds);

      if (!profiles) return;

      // 5. Combine and format leaderboard
      const leaderboardData: LeaderboardUser[] = topUserIds.map(uid => {
        const profile = profiles.find(p => p.user_id === uid);
        return {
          user_id: uid,
          full_name: profile?.full_name || 'Anonymous Citizen',
          avatar_url: profile?.avatar_url || null,
          xp: xpMap[uid]
        };
      });

      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  }, []);

  const refreshGamification = useCallback(async () => {
    setLoading(true);
    await Promise.all([calculateUserStats(), fetchLeaderboard()]);
    setLoading(false);
  }, [calculateUserStats, fetchLeaderboard]);

  useEffect(() => {
    refreshGamification();
  }, [refreshGamification]);

  return { stats, leaderboard, loading, refreshGamification };
};
