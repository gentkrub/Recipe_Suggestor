import { AuthProvider, useAuth } from "../../auth-context";
import { Tabs, Stack, useRouter, Slot } from "expo-router";
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    // Don't render tabs until authenticated; Slot will render login/signup
    return <Slot />;
  }
  return <>{children}</>;
}

export default function Layout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Tabs screenOptions={{ headerShown: false }}>
          <Tabs.Screen
            name="index"
            options={{
              title: "Explore",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "search" : "search-outline"}
                  color={color}
                  size={28}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="menu"
            options={{
              title: "Menu",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "restaurant" : "restaurant-outline"}
                  color={color}
                  size={28}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="ingredients"
            options={{
              title: "Ingredients",
              tabBarIcon: ({ color, focused }) => (
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
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "person-circle" : "person-circle-outline"}
                  color={color}
                  size={27}
                />
              ),
            }}
          />
        </Tabs>
      </AuthGate>
    </AuthProvider>
  );
}
