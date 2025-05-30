import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";

import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export default function Profile() {
  const [favorites, setFavorites] = useState([]);
  const router = useRouter();

  // Use `useFocusEffect` to refresh favorites when screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        const stored = await AsyncStorage.getItem("favorites");
        setFavorites(stored ? JSON.parse(stored) : []);
      };
      loadFavorites();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome</Text>
      <Text style={styles.favorites}>Your Favorites</Text>

      {favorites.length === 0 ? (
        <Text>No favorites yet.</Text>
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
                <Text style={styles.meal}>{item.strMeal}</Text>
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
    marginTop: 80,
    flex: 1,
    paddingHorizontal: 20,
  },
  welcome: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 30,
  },
  favorites: {
    fontSize: 24,
    marginVertical: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  meal: {
    fontSize: 18,
    flexShrink: 1,
  },
});
