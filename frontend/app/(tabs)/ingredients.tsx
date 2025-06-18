import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MealDBIngredient = {
  idIngredient: string;
  strIngredient: string;
  strDescription: string;
};

type Ingredient = {
  name: string;
  image: string;
};

export default function IngredientsScreen() {
  const [inputText, setInputText] = useState<string>("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<MealDBIngredient[]>([]);
  const [suggestions, setSuggestions] = useState<MealDBIngredient[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("https://www.themealdb.com/api/json/v1/1/list.php?i=list")
      .then((res) => res.json())
      .then((data) => {
        setAllIngredients(data.meals || []);
      })
      .catch((err) => console.error("Failed to fetch ingredients:", err));

    const fetchLatestIngredients = async () => {
      try {
        const res = await fetch(
          "https://5649-2001-44c8-4110-35af-aca3-a28e-4d1b-8d15.ngrok-free.app/api/ingredients/latest"
        );
        const data = await res.json();

        if (data.ingredients && data.ingredients.length > 0) {
          const restored = data.ingredients.map((item: any) => ({
            name: item.name,
            image: `https://www.themealdb.com/images/ingredients/${item.name}.png`,
          }));
          setIngredients(restored);
          console.log("🟢 Restored ingredients:", restored);
        }
      } catch (error) {
        console.error("❌ Failed to load latest ingredients:", error);
      }
    };

    fetchLatestIngredients();
  }, []);

  const handleInputChange = (text: string) => {
    const cleanedText = text.trim().toLowerCase();
    setInputText(text);

    if (cleanedText.length > 0) {
      const matches = allIngredients.filter((item) =>
        item.strIngredient.toLowerCase().startsWith(cleanedText)
      );
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const addIngredient = () => {
    const name = inputText.trim();
    if (!name) return;

    const found = allIngredients.find(
      (item) => item.strIngredient.toLowerCase() === name.toLowerCase()
    );

    if (!found) {
      alert(
        "❌ This ingredient is not recognized. Please select from the suggestion list."
      );
      return;
    }

    const exists = ingredients.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (!exists) {
      setIngredients((prev) => [
        ...prev,
        {
          name: found.strIngredient,
          image: `https://www.themealdb.com/images/ingredients/${found.strIngredient}.png`,
        },
      ]);
    }

    setInputText("");
    setSuggestions([]);
  };

  const submitIngredients = async () => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    try {
      console.log("🔼 Sending ingredients:", ingredients);

      await AsyncStorage.setItem(
        "latest_ingredients",
        JSON.stringify(ingredients)
      ); // ✅ Store to local storage

      const res = await fetch(
        "https://5649-2001-44c8-4110-35af-aca3-a28e-4d1b-8d15.ngrok-free.app/api/ingredient",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submitted_at: now,
            ingredients: ingredients,
          }),
        }
      );

      const data = await res.json();
      console.log("✅ Server response:", data);

      alert("Ingredients saved!");
      router.replace("/menu"); // ✅ Go to menu screen
    } catch (error) {
      console.error("❌ Failed to submit ingredients:", error);
      alert("Failed to save ingredients");
    }
  };

  const renderItem = ({ item }: { item: Ingredient }) => (
    <View style={styles.ingredientItem}>
      <View style={styles.ingredientRow}>
        <Image source={{ uri: item.image }} style={styles.ingredientImage} />
        <Text style={styles.ingredientText}>{item.name}</Text>
      </View>
      <TouchableOpacity
        onPress={() =>
          setIngredients((prev) =>
            prev.filter((ing) => ing.name !== item.name)
          )
        }
        style={styles.qtyBtn}
      >
        <Ionicons name="trash" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={{ flex: 1, paddingBottom: 80 }}>
          <View style={styles.inputRow}>
            <TouchableOpacity onPress={addIngredient}>
              <Ionicons name="search" size={20} color="#999" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Add ingredients"
              value={inputText}
              onChangeText={handleInputChange}
              onSubmitEditing={addIngredient}
            />
            <TouchableOpacity onPress={() => {}}>
              <Ionicons name="mic" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionWrapper}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.idIngredient}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      const name = item.strIngredient;
                      const exists = ingredients.find(
                        (i) => i.name.toLowerCase() === name.toLowerCase()
                      );
                      if (!exists) {
                        setIngredients((prev) => [
                          ...prev,
                          {
                            name,
                            image: `https://www.themealdb.com/images/ingredients/${name}.png`,
                          },
                        ]);
                      }
                      setInputText("");
                      setSuggestions([]);
                    }}
                    style={styles.suggestionItem}
                  >
                    <View style={styles.suggestionRow}>
                      <Image
                        source={{
                          uri: `https://www.themealdb.com/images/ingredients/${item.strIngredient}.png`,
                        }}
                        style={styles.suggestionImage}
                      />
                      <Text>{item.strIngredient}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          <Text style={styles.heading}>Ingredients</Text>

          <FlatList
            data={ingredients}
            keyExtractor={(item) => item.name}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No ingredients yet.</Text>
            }
            keyboardShouldPersistTaps="handled"
          />
        </View>

        <TouchableOpacity onPress={submitIngredients} style={styles.nextButton}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fed7aa",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
  },
  suggestionWrapper: {
    maxHeight: 150,
    marginBottom: 10,
  },
  suggestionItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  suggestionImage: {
    width: 30,
    height: 30,
    borderRadius: 5,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  ingredientItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ingredientImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  ingredientText: {
    fontSize: 16,
    fontWeight: "500",
  },
  qtyBtn: {
    paddingHorizontal: 10,
  },
  nextButton: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    backgroundColor: "#38bdf8",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 30,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fed7aa",
  },
});