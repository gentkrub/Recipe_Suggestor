import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MealDetailPage() {
  const { mealId } = useLocalSearchParams();
  const [meal, setMeal] = useState<any>(null);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchMeal = async () => {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
      );
      const data = await res.json();
      const mealData = data.meals[0];
      const ingredients: any[] = [];
      for (let i = 1; i <= 20; i++) {
        const name = mealData[`strIngredient${i}`];
        const amount = mealData[`strMeasure${i}`];
        if (name && name.trim()) {
          ingredients.push({
            name: name.trim().toLowerCase(),
            label: name.trim(),
            amount: amount?.trim() || "",
          });
        }
      }
      setMeal({ ...mealData, ingredients });
    };

    const loadIngredients = async () => {
      const stored = await AsyncStorage.getItem("latest_ingredients");
      const parsed = stored ? JSON.parse(stored) : [];
      const names = parsed.map((item: any) => item.name.toLowerCase());
      setUserIngredients(names);
    };

    fetchMeal();
    loadIngredients();
  }, [mealId]);

  if (!meal) return null;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      <Image source={{ uri: meal.strMealThumb }} style={styles.image} />
      <Text style={styles.title}>{meal.strMeal}</Text>

      <Text style={styles.heading}>Your Ingredient Match</Text>
      <Text style={styles.matching}>
        ✅ You have {meal.ingredients.filter((i) =>
          userIngredients.includes(i.name)
        ).length}
        /{meal.ingredients.length} ingredients
      </Text>

      <Text style={styles.heading}>Ingredients:</Text>
      {meal.ingredients.map((ing, index) => (
        <Text key={index} style={styles.ingredientLine}>
          {userIngredients.includes(ing.name) ? "✅" : "❌"} {ing.label} - {ing.amount}
        </Text>
      ))}

      <Text style={styles.heading}>Instructions:</Text>
      <Text style={styles.instructions}>{meal.strInstructions}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 60, backgroundColor: "white" },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  heading: { fontSize: 18, fontWeight: "bold", marginTop: 20 },
  matching: { marginBottom: 10 },
  ingredientLine: { fontSize: 16, marginBottom: 4 },
  instructions: { fontSize: 15, lineHeight: 22, marginBottom: 30 },
  backButton: {
    position: "absolute",
    top: 20,
    left: 10,
    zIndex: 1,
    padding: 10,
  },
});