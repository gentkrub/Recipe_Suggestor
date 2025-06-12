import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MealDetail() {
  const { mealId } = useLocalSearchParams();
  const [meal, setMeal] = useState<any>(null);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [matchInfo, setMatchInfo] = useState<{
    have: string[];
    missing: string[];
  }>({
    have: [],
    missing: [],
  });

  useEffect(() => {
    const fetchMeal = async () => {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
      );
      const data = await res.json();
      setMeal(data.meals[0]);
    };

    const fetchUserIngredients = async () => {
      const stored = await AsyncStorage.getItem("latest_ingredients");
      const parsed = stored ? JSON.parse(stored) : [];
      const names = parsed.map((item: { name: string }) =>
        item.name.toLowerCase()
      );
      setUserIngredients(names);
    };

    fetchMeal();
    fetchUserIngredients();
  }, [mealId]);

  useEffect(() => {
    if (!meal || userIngredients.length === 0) return;

    const actualIngredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      if (ing && ing.trim() !== "") {
        actualIngredients.push(ing.toLowerCase());
      }
    }

    const have = actualIngredients.filter((ing) =>
      userIngredients.includes(ing)
    );
    const missing = actualIngredients.filter(
      (ing) => !userIngredients.includes(ing)
    );

    setMatchInfo({ have, missing });
  }, [meal, userIngredients]);

  if (!meal) return <Text>Loading...</Text>;

  const renderIngredients = () => {
    const items = [];
    for (let i = 1; i <= 20; i++) {
      const name = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (name && name.trim() !== "") {
        const isMatched = userIngredients.includes(name.toLowerCase());
        items.push(
          <Text
            key={i}
            style={{
              color: isMatched ? "green" : "red",
              fontSize: 16,
              marginBottom: 2,
            }}
          >
            {isMatched ? "✅" : "❌"} {name} - {measure}
          </Text>
        );
      }
    }
    return items;
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: meal.strMealThumb }} style={styles.image} />
      <Text style={styles.title}>{meal.strMeal}</Text>

      <Text style={styles.subheading}>Your Ingredient Match</Text>
      <Text>
        ✅ You have {matchInfo.have.length}/
        {matchInfo.have.length + matchInfo.missing.length} ingredients
      </Text>

      <Text style={styles.subheading}>Ingredients:</Text>
      <View>{renderIngredients()}</View>

      <Text style={styles.subheading}>Instructions:</Text>
      <Text style={styles.instructions}>{meal.strInstructions}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subheading: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "600",
  },
  instructions: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
  },
});
