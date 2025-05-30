import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function MealDetail() {
  const { mealId } = useLocalSearchParams();
  const [meal, setMeal] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchMeal();
    checkFavorite();
  }, [mealId]);

  const fetchMeal = async () => {
    try {
      const res = await axios.get(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
      );
      setMeal(res.data.meals[0]);
    } catch (err) {
      console.error("Failed to fetch meal detail:", err);
    }
  };

  const checkFavorite = async () => {
    const stored = await AsyncStorage.getItem("favorites");
    const favorites = stored ? JSON.parse(stored) : [];
    setIsFavorite(favorites.some((m: any) => m.idMeal === mealId));
  };

  const toggleFavorite = async () => {
    const stored = await AsyncStorage.getItem("favorites");
    let favorites = stored ? JSON.parse(stored) : [];

    if (isFavorite) {
      favorites = favorites.filter((m: any) => m.idMeal !== mealId);
      Alert.alert("Removed from Favorites");
    } else {
      favorites.push({
        idMeal: meal.idMeal,
        strMeal: meal.strMeal,
        strMealThumb: meal.strMealThumb,
      });
      Alert.alert("Added to Favorites");
    }

    await AsyncStorage.setItem("favorites", JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  if (!meal) return <Text style={styles.loading}>Loading...</Text>;

  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredients.push(`${ing} - ${measure}`);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: meal.strMealThumb }} style={styles.image} />
      <View style={styles.headerRow}>
        <Text style={styles.title}>{meal.strMeal}</Text>
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={28}
            color="tomato"
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Ingredients</Text>
      {ingredients.map((item, idx) => (
        <Text key={idx} style={styles.ingredient}>
          • {item}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    flexShrink: 1,
    paddingRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 6,
  },
  loading: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
  },
});
