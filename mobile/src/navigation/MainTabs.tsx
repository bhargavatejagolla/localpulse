import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { FeedScreen } from "../screens/FeedScreen";
import { ReportScreen } from "../screens/ReportScreen";
import { EventsScreen } from "../screens/EventsScreen";
import { DirectoryScreen } from "../screens/DirectoryScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { IssueDetailScreen } from "../screens/IssueDetailScreen";
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
          title: "Community Feed",
          headerStyle: {
            backgroundColor: "#1B5E20",
          },
          headerTintColor: "#FFFFFF",
        }}
      />

      <FeedStack.Screen
        name="IssueDetail"
        component={IssueDetailScreen}
        options={{
          title: "Issue Details",
          headerStyle: {
            backgroundColor: "#1B5E20",
          },
          headerTintColor: "#FFFFFF",
        }}
      />
    </FeedStack.Navigator>
  );
};

export const MainTabs: React.FC = () => {
  const { profile } = useAuth();
  const isAuthority = profile?.role === 'authority' || profile?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#1B5E20",
        tabBarInactiveTintColor: "#757575",

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },

        headerStyle: {
          backgroundColor: "#1B5E20",
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
            <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
          ),
          title: 'Stats',
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
