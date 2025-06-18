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
import { distance } from "fastest-levenshtein";

export default function MenuScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allMeals, setAllMeals] = useState<any[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<any[]>([]);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const router = useRouter();

  useEffect(() => {
    const fetchAllMeals = async () => {
      try {
        const results: any[] = [];
        for (let c = 97; c <= 122; c++) {
          const letter = String.fromCharCode(c);
          const res = await axios.get(
            `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`
          );
          if (res.data.meals) {
            const meals = res.data.meals.map((meal: any) => {
              const ingredients: string[] = [];
              for (let i = 1; i <= 20; i++) {
                const ing = meal[`strIngredient${i}`];
                if (ing && ing.trim() !== "") {
                  ingredients.push(ing.toLowerCase());
                }
              }
              return { ...meal, ingredients };
            });
            results.push(...meals);
          }
        }
        setAllMeals(results);
      } catch (err) {
        console.error("❌ Error fetching meals:", err);
      }
    };

    const loadIngredients = async () => {
      const stored = await AsyncStorage.getItem("latest_ingredients");
      const parsed = stored ? JSON.parse(stored) : [];
      const names = parsed.map((item: any) => item.name.toLowerCase());
      setUserIngredients(names);
    };

    fetchAllMeals();
    loadIngredients();
  }, []);

  const fuzzyIncludes = (ing: string, list: string[]) => {
    return list.some(
      (i) => distance(i.toLowerCase(), ing.toLowerCase()) <= 2
    );
  };

  const getMissingCount = (meal: any) => {
    if (!meal.ingredients) return 0;
    return meal.ingredients.filter(
      (ing: string) => !fuzzyIncludes(ing, userIngredients)
    ).length;
  };

  useEffect(() => {
    const matchedMeals = allMeals
      .map((meal) => {
        const missingCount = getMissingCount(meal);
        return { ...meal, missingCount };
      })
      .filter((meal) => meal.missingCount < meal.ingredients.length)
      .sort((a, b) => a.missingCount - b.missingCount);

    setFilteredMeals(matchedMeals);
  }, [allMeals, userIngredients]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMeals((prev) => [...prev]);
    } else {
      const q = searchQuery.trim().toLowerCase();
      setFilteredMeals((prev) =>
        prev.filter((meal) => meal.strMeal.toLowerCase().startsWith(q))
      );
    }
  }, [searchQuery]);

  const filterByCategory = async (category: string) => {
    setActiveCategory(category);
    try {
      let results = [];

      if (category === "Healthy") {
        const vegan = await axios.get(
          "https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegan"
        );
        const vegetarian = await axios.get(
          "https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegetarian"
        );
        const ids = [
          ...(vegan.data.meals || []),
          ...(vegetarian.data.meals || []),
        ].map((m: any) => m.idMeal);

        results = allMeals.filter((m) => ids.includes(m.idMeal));
      } else if (category === "Western") {
        results = allMeals.filter((m) =>
          ["American", "British", "Canadian", "French", "Italian"].includes(
            m.strArea
          )
        );
      } else {
        results = allMeals;
      }

      const filtered = results
        .map((meal) => {
          const missingCount = getMissingCount(meal);
          return { ...meal, missingCount };
        })
        .filter((meal) => meal.missingCount < meal.ingredients.length)
        .sort((a, b) => a.missingCount - b.missingCount);

      setFilteredMeals(filtered);
    } catch (err) {
      console.error("❌ Category filter error:", err);
    }
  };

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
        {["All", "Western", "Healthy"].map((cat) => (
          <Button
            key={cat}
            mode={activeCategory === cat ? "contained" : "outlined"}
            onPress={() => filterByCategory(cat)}
            style={{ marginRight: 5 }}
          >
            {cat}
          </Button>
        ))}
      </View>

      <FlatList
        data={filteredMeals}
        keyExtractor={(item) => item.idMeal}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/${item.idMeal}`)}>
            <View style={styles.item}>
              <View style={styles.textWrapper}>
                <Text style={styles.text}>{item.strMeal}</Text>
                {item.missingCount > 0 ? (
                  <Text style={{ color: "gray" }}>
                    You Are Missing {item.missingCount} ingredients
                  </Text>
                ) : null}
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