// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../auth-context";
import { useEffect } from "react";
import { useRouter, Slot } from "expo-router";
import { View, ActivityIndicator } from "react-native";

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

  if (!user) return <Slot />; // login/signup route

  return <>{children}</>;
}

export default function TabLayout() {
  return (
    <AuthGate>
      <Tabs
        screenOptions={{
          headerShown: false, // ✅ THIS LINE HIDES THE "(tabs)" HEADER
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "search" : "search-outline"}
                size={28}
                color={color}
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
                size={28}
                color={color}
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
                size={27}
                color={color}
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
                name={
                  focused ? "person-circle" : "person-circle-outline"
                }
                size={27}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </AuthGate>
  );
}