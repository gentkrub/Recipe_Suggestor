import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        //tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        //tabBarButton: HapticTab,
        //tabBarBackground: TabBarBackground,
        //tabBarStyle: Platform.select({
        //ios: {
        // Use a transparent background on iOS to show the blur effect
        //position: "absolute",
        //},
        //default: {},
        //}),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "menu" : "menu-outline"}
              color={color}
              size={30}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ingredients"
        options={{
          title: "Ingredients",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "fast-food" : "fast-food-outline"}
              color={color}
              size={27}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              color={color}
              size={27}
            />
          ),
        }}
      />
    </Tabs>
  );
}