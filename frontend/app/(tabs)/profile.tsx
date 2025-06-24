import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAuth } from "../../auth-context";

export default function Profile() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [showInfo, setShowInfo] = useState(false);

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
      {user && <Text style={styles.welcome}>Welcome, {user.firstname}!</Text>}

      <TouchableOpacity onPress={() => setShowInfo(!showInfo)} style={styles.profileButton}>
        <Text style={styles.profileButtonText}>{showInfo ? "Hide Profile Info" : "Show Profile Info"}</Text>
      </TouchableOpacity>

      {showInfo && user && (
  <View style={styles.profileCard}>
    <Text style={styles.profileItem}><Text style={styles.label}>Name: </Text>{user.firstname} {user.lastname}</Text>
    <Text style={styles.profileItem}><Text style={styles.label}>Age: </Text>{user.age}</Text>
    <Text style={styles.profileItem}><Text style={styles.label}>Gender: </Text>{user.gender}</Text>
    <Text style={styles.profileItem}><Text style={styles.label}>Height: </Text>{user.height} cm</Text>
    <Text style={styles.profileItem}><Text style={styles.label}>Weight: </Text>{user.weight} kg</Text> {/* ✅ New Line */}
    <Text style={styles.profileItem}><Text style={styles.label}>Email: </Text>{user.email}</Text>
  </View>
)}

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={() => Linking.openURL("https://forms.gle/hqQCzwz1PDMK7Qah8")} style={[styles.actionButton, { backgroundColor: '#0ea5e9' }]}>
          <Text style={styles.buttonText}>Give Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={logout} style={[styles.actionButton, { backgroundColor: '#e11d48' }]}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Your Favorite Meals</Text>
      {favorites.length === 0 ? (
        <Text style={styles.empty}>No favorites yet.</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.idMeal}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/${item.idMeal}`)}>
              <View style={styles.card}>
                <Image source={{ uri: item.strMealThumb }} style={styles.image} />
                <Text style={styles.mealName}>{item.strMeal}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    paddingHorizontal: 20,
    flex: 1,
    backgroundColor: "#fff",
  },
  welcome: {
    fontSize: 20,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  profileButton: {
    backgroundColor: "#ff8c00",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileCard: {
    backgroundColor: "#fff7ec",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileItem: {
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
  label: {
    fontWeight: "bold",
    color: "#ff8c00",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  empty: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff7ec",
    padding: 12,
    marginBottom: 10,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
  },
  mealName: {
    fontSize: 18,
    color: "#333",
    flexShrink: 1,
  },
});