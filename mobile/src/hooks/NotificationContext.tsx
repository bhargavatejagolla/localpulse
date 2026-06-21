import React, { createContext, useContext, useState, useEffect } from "react";
import { Audio } from "expo-av";
import { supabase } from "../lib/supabase";
import { Issue } from "../types";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  clearUnread: () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Load sound once
  useEffect(() => {
    async function loadSound() {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/ding.mp3")
      );
      setSound(sound);
    }
    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("global:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issues" },
        async (payload) => {
          const newIssue = payload.new as Issue;
          
          // Play ding sound
          if (sound) {
            await sound.replayAsync();
          }

          // Create notification item
          const newNotif: AppNotification = {
            id: newIssue.id,
            title: `🚨 New ${newIssue.severity?.toUpperCase() || 'ISSUE'} Reported!`,
            message: newIssue.title,
            created_at: newIssue.created_at || new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sound]);

  const clearUnread = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, clearUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
