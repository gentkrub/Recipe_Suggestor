import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function MealDetail() {
  const { mealId } = useLocalSearchParams();
  const [meal, setMeal] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchMealDetail = async () => {
      try {
        const res = await axios.get(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
        );
        const mealData = res.data.meals?.[0];
        setMeal(mealData);

        const stored = await AsyncStorage.getItem("favorites");
        const favorites = stored ? JSON.parse(stored) : [];
        const exists = favorites.some(
          (item) => item.idMeal === mealData?.idMeal
        );
        setIsFavorite(exists);
      } catch (err) {
        console.error("❌ Failed to fetch meal details:", err);
      }
    };

    if (mealId) fetchMealDetail();
  }, [mealId]);

  const toggleFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem("favorites");
      let favorites = stored ? JSON.parse(stored) : [];

      if (isFavorite) {
        favorites = favorites.filter((item) => item.idMeal !== meal.idMeal);
        Alert.alert("Removed", `${meal.strMeal} removed from favorites.`);
      } else {
        favorites.push(meal);
        Alert.alert("Added", `${meal.strMeal} added to favorites.`);
      }

      await AsyncStorage.setItem("favorites", JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("❌ Error updating favorites:", err);
      Alert.alert("Error", "Failed to update favorites.");
    }
  };

  if (!meal) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{meal.strMeal}</Text>
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={28}
            color="#ff6347"
          />
        </TouchableOpacity>
      </View>

      <Image source={{ uri: meal.strMealThumb }} style={styles.image} />

      <Text style={styles.sectionTitle}>Instructions</Text>
      <Text style={styles.instructions}>{meal.strInstructions}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  instructions: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "justify",
  },
});
