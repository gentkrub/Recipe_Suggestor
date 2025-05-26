import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="searchtab"
        options={{
          title: "",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              color={color}
              size={30}
              style={{ marginBottom: -10 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "menu" : "menu-outline"}
              color={color}
              size={35}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ingredients"
        options={{
          title: "",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "fast-food" : "fast-food-outline"}
              color={color}
              size={29}
            />
          ),
        }}
      />
    </Tabs>
  );
}
