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

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allMeals, setAllMeals] = useState<any[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const router = useRouter();

  useEffect(() => {
    const fetchAllMeals = async () => {
      try {
        const results: any[] = [];
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
        setFilteredMeals(results);
      } catch (error) {
        console.error("❌ Error fetching meals:", error);
      }
    };

    fetchAllMeals();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMeals(allMeals);
    } else {
      const query = searchQuery.trim().toLowerCase();
      setFilteredMeals(
        allMeals.filter((meal) => meal.strMeal.toLowerCase().startsWith(query))
      );
    }
  }, [searchQuery, allMeals]);

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

      setFilteredMeals(results);
    } catch (err) {
      console.error("❌ Category filter error:", err);
    }
  };

  return (
    <SafeAreaView>
      <Searchbar
        placeholder="Search for a meal..."
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
