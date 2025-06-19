import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAuth } from "../../auth-context";

export default function Profile() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const { user, setUser } = useAuth();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        if (!user) return;
        try {
          const key = `favorites_${user.email}`;
          const stored = await AsyncStorage.getItem(key);
          const favs = stored ? JSON.parse(stored) : [];
          setFavorites(favs);
        } catch (err) {
          console.error("❌ Failed to load favorites:", err);
        }
      };
      loadFavorites();
    }, [user])
  );

  const logout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.userItem}>
            <Text style={styles.userLabel}>Name: </Text>
            {user.firstname} {user.lastname}
          </Text>
          <Text style={styles.userItem}>
            <Text style={styles.userLabel}>Age: </Text>
            {user.age}
          </Text>
          <Text style={styles.userItem}>
            <Text style={styles.userLabel}>Gender: </Text>
            {user.gender}
          </Text>
          <Text style={styles.userItem}>
            <Text style={styles.userLabel}>Height: </Text>
            {user.height}
          </Text>
          <Text style={styles.userItem}>
            <Text style={styles.userLabel}>Email: </Text>
            {user.email}
          </Text>
        </View>
      ) : (
        <Text style={{ color: "red", marginBottom: 20 }}>
          Not logged in.
        </Text>
      )}
      <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Your Favorite Meals</Text>
      {favorites.length === 0 ? (
        <Text style={styles.empty}>No favorites yet.</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.idMeal}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/${item.idMeal}`)}>
              <View style={styles.card}>
                <Image
                  source={{ uri: item.strMealThumb }}
                  style={styles.image}
                />
                <Text style={styles.name}>{item.strMeal}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 80, paddingHorizontal: 20, flex: 1 },
  userInfo: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
  },
  userItem: {
    fontSize: 16,
    marginBottom: 2,
  },
  userLabel: {
    fontWeight: "bold",
    color: "#0ea5e9",
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  empty: { fontSize: 16, color: "#888", marginTop: 20 },
  logoutBtn: {
    backgroundColor: "#38bdf8",
    padding: 12,
    borderRadius: 6,
    marginBottom: 28,
    alignSelf: "flex-start",
  },
  logoutText: { color: "white", fontWeight: "bold" },
  card: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 15 },
  name: { fontSize: 18, flexShrink: 1 },
});