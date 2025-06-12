import axios from "axios";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { Searchbar, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<MealWithMissing[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [userIngredients, setUserIngredients] = useState<string[]>([]);

  const router = useRouter();

  interface Meal {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
    strArea?: string;
    [key: string]: any;
  }

  interface MealWithMissing extends Meal {
    missingCount: number;
  }

  useEffect(() => {
    const fetchAllMeals = async () => {
      try {
        const results: Meal[] = [];
        for (let c = 97; c <= 122; c++) {
          const letter = String.fromCharCode(c);
          const response = await axios.get(
            `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`
          );
          if (response.data.meals) {
            results.push(...response.data.meals);
          }
        }
        setAllMeals(results);
      } catch (error) {
        console.error("Error fetching meals:", error);
      }
    };

    const fetchUserIngredients = async () => {
      const stored = await AsyncStorage.getItem("latest_ingredients");
      const parsed = stored ? JSON.parse(stored) : [];
      const names = parsed.map((item: { name: string }) =>
        item.name.toLowerCase()
      );
      setUserIngredients(names);
    };

    fetchAllMeals();
    fetchUserIngredients();
  }, []);

  useEffect(() => {
    const applyFilterAndMatching = async () => {
      let meals: Meal[] = [];

      if (activeCategory === "Healthy") {
        const vegan = await axios.get(
          "https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegan"
        );
        const vegetarian = await axios.get(
          "https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegetarian"
        );
        if (vegan.data.meals) meals.push(...vegan.data.meals);
        if (vegetarian.data.meals) meals.push(...vegetarian.data.meals);
      } else if (activeCategory === "Western") {
        meals = allMeals.filter(
          (meal) =>
            meal.strArea &&
            ["American", "British", "Canadian", "French", "Italian"].includes(
              meal.strArea
            )
        );
      } else {
        meals = allMeals;
      }

      const mealsWithMissing = meals.map((meal) => {
        const ingredients: string[] = [];
        for (let i = 1; i <= 20; i++) {
          const ing = meal[`strIngredient${i}`];
          if (ing && ing.trim() !== "") {
            ingredients.push(ing.toLowerCase());
          }
        }
        const missingCount = ingredients.filter(
          (ing) => !userIngredients.includes(ing)
        ).length;

        return { ...meal, missingCount };
      });

      const sortedMeals = mealsWithMissing.sort(
        (a, b) => a.missingCount - b.missingCount
      );

      setFilteredMeals(sortedMeals);
    };

    applyFilterAndMatching();
  }, [allMeals, activeCategory, userIngredients]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMeals((prev) => [...prev]);
    } else {
      const query = searchQuery.trim().toLowerCase();
      const matches = filteredMeals.filter((meal) =>
        meal.strMeal.toLowerCase().startsWith(query)
      );
      setFilteredMeals(matches);
    }
  }, [searchQuery]);

  return (
    <SafeAreaView>
      <Searchbar
        placeholder="Search for a menu..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{ margin: 10, borderRadius: 8 }}
      />

      <View
        style={{ flexDirection: "row", justifyContent: "center", margin: 10 }}
      >
        <Button
          mode={activeCategory === "All" ? "contained" : "outlined"}
          onPress={() => setActiveCategory("All")}
          style={{ marginRight: 5 }}
        >
          All
        </Button>
        <Button
          mode={activeCategory === "Western" ? "contained" : "outlined"}
          onPress={() => setActiveCategory("Western")}
          style={{ marginRight: 5 }}
        >
          Western
        </Button>
        <Button
          mode={activeCategory === "Healthy" ? "contained" : "outlined"}
          onPress={() => setActiveCategory("Healthy")}
        >
          Healthy
        </Button>
      </View>

      <FlatList
        data={filteredMeals}
        keyExtractor={(item) => item.idMeal}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/${item.idMeal}`)}>
            <View style={styles.item}>
              <View style={styles.textWrapper}>
                <Text style={styles.text}>{item.strMeal}</Text>
                <Text style={{ color: "gray" }}>
                  You Are Missing {item.missingCount} ingredients
                </Text>
              </View>
              <Image source={{ uri: item.strMealThumb }} style={styles.image} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  textWrapper: {
    flex: 1,
    paddingRight: 10,
  },
  text: {
    fontSize: 18,
    flexWrap: "wrap",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
});
