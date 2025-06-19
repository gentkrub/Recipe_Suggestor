import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth-context";
import axios from "axios";

export default function MealDetailPage() {
  const { mealId } = useLocalSearchParams();
  const [meal, setMeal] = useState<any>(null);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const loadIngredients = async () => {
    try {
      const stored = await AsyncStorage.getItem("latest_ingredients");
      const parsed = stored ? JSON.parse(stored) : [];
      const names = parsed.map((item: any) => item.name.toLowerCase());
      setUserIngredients(names);
    } catch (err) {
      console.error("❌ Failed to load user ingredients:", err);
    }
  };

  const loadFavoriteStatus = async () => {
    if (!user || !mealId) return;
    try {
      const key = `favorites_${user.email}`;
      const stored = await AsyncStorage.getItem(key);
      const favs = stored ? JSON.parse(stored) : [];
      const exists = favs.some((m: any) => m.idMeal === mealId);
      setIsFavorite(exists);
    } catch (err) {
      console.error("❌ Load favorite error:", err);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !meal) return;
    try {
      const key = `favorites_${user.email}`;
      const stored = await AsyncStorage.getItem(key);
      const favs = stored ? JSON.parse(stored) : [];

      const exists = favs.find((m: any) => m.idMeal === meal.idMeal);
      let updated;

      if (exists) {
        updated = favs.filter((m: any) => m.idMeal !== meal.idMeal);
        setIsFavorite(false);
      } else {
        updated = [...favs, meal];
        setIsFavorite(true);
      }

      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.error("❌ Toggle favorite error:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadIngredients();
      loadFavoriteStatus();
    }, [mealId])
  );

  useEffect(() => {
    if (!mealId) return;
    const fetchMeal = async () => {
      try {
        const res = await axios.get(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
        );
        setMeal(res.data.meals[0]);
      } catch (err) {
        console.error("❌ Fetch meal error:", err);
      }
    };
    fetchMeal();
  }, [mealId]);

  const parseIngredients = () => {
    const ings: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim() !== "") {
        ings.push(`${ing} - ${measure}`);
      }
    }
    return ings;
  };

  const ingredientMatch = (ingredient: string) => {
    const nameOnly = ingredient.split(" - ")[0].toLowerCase();
    return userIngredients.some((userIng) => {
      const distance = require("fastest-levenshtein").distance(
        nameOnly,
        userIng.toLowerCase()
      );
      const similarity =
        1 - distance / Math.max(nameOnly.length, userIng.length);
      return similarity > 0.8;
    });
  };

  if (!meal) return null;

  const matchedCount = parseIngredients().filter(ingredientMatch).length;
  const totalCount = parseIngredients().length;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#007aff" />
          <Text style={{ color: "#007aff", marginLeft: 5 }}>Back</Text>
        </TouchableOpacity>

        <Image
          source={{ uri: meal.strMealThumb }}
          style={{ width: "100%", height: 200, borderRadius: 10 }}
        />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.title}>{meal.strMeal}</Text>
          <TouchableOpacity onPress={toggleFavorite}>
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={28}
              color={isFavorite ? "red" : "gray"}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.matchLabel}>Your Ingredient Match</Text>
        <Text style={styles.matchCount}>
          ✅ You have {matchedCount}/{totalCount} ingredients
        </Text>

        <Text style={styles.sectionTitle}>Ingredients:</Text>
        {parseIngredients().map((ing, idx) => (
          <View key={idx} style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 18 }}>{ingredientMatch(ing) ? "✅" : "❌"}</Text>
            <Text style={{ fontSize: 16, marginLeft: 8 }}>{ing}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Instructions:</Text>
        <Text style={styles.instructions}>{meal.strInstructions}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  matchLabel: {
    marginTop: 16,
    fontWeight: "bold",
    fontSize: 16,
  },
  matchCount: {
    color: "green",
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
  instructions: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
  },
});