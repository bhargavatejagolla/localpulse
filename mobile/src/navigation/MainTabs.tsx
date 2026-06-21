import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedScreen } from "../screens/FeedScreen";
import { ReportScreen } from "../screens/ReportScreen";
import { EventsScreen } from "../screens/EventsScreen";
import { DirectoryScreen } from "../screens/DirectoryScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { IssueDetailScreen } from "../screens/IssueDetailScreen";
import { CopilotScreen } from "../screens/CopilotScreen";
import { AuthorityScreen } from '../screens/AuthorityScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();
const FeedStack = createNativeStackNavigator<any>();

// Feed Stack Navigator
const FeedStackScreen = () => {
  return (
    <FeedStack.Navigator>
      <FeedStack.Screen
        name="FeedList"
        component={FeedScreen}
        options={{
          headerShown: false,
        }}
      />

      <FeedStack.Screen
        name="IssueDetail"
        component={IssueDetailScreen}
        options={{
          title: "Issue Details",
          headerStyle: {
            backgroundColor: "#0B1120",
          },
          headerTintColor: "#FFFFFF",
        }}
      />

      <FeedStack.Screen
        name="Copilot"
        component={CopilotScreen}
        options={{
          headerShown: false,
          presentation: "modal", // slides up from bottom
        }}
      />
    </FeedStack.Navigator>
  );
};

export const MainTabs: React.FC = () => {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const isAuthority = profile?.role === 'authority' || profile?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#22C55E",
        tabBarInactiveTintColor: "#757575",

        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.05)",
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 4,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },

        headerStyle: {
          backgroundColor: "#0B1120",
        },

        headerTintColor: "#FFFFFF",

        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedStackScreen}
        options={{
          headerShown: false,
          title: "Feed",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="newspaper-variant"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          title: "Report",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="plus-circle"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-star"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{
          title: "Directory",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="tools" color={color} size={size} />
          ),
        }}
      />

      {isAuthority && (
        <Tab.Screen name="Authority" component={AuthorityScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shield-check" color={color} size={size} />
            ),
            title: 'Manage',
          }}
        />
      )}

      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="brain" color={color} size={size} />
          ),
          title: 'Intelligence',
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
