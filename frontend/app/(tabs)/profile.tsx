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

export default function Profile() {
  const [favorites, setFavorites] = useState([]);
  const router = useRouter();

  // Load favorites every time this screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        try {
          const stored = await AsyncStorage.getItem("favorites");
          const favs = stored ? JSON.parse(stored) : [];
          setFavorites(favs);
        } catch (err) {
          console.error("❌ Failed to load favorites:", err);
        }
      };

      loadFavorites();
    }, [])
  );

  return (
    <View style={styles.container}>
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
  container: {
    paddingTop: 80,
    paddingHorizontal: 20,
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  empty: {
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  name: {
    fontSize: 18,
    flexShrink: 1,
  },
});
