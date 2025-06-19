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
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

export default function MenuScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allMeals, setAllMeals] = useState<any[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<any[]>([]);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const router = useRouter();

  const startRecording = async () => {
    try {
      console.log("🎙️ Requesting permissions...");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("🎙️ Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
    }
  };

  const stopRecording = async () => {
    console.log("🛑 Stopping recording...");
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("✅ Recorded file:", uri);
      if (uri) await uploadAndTranscribe(uri);
      setRecording(null);
    } catch (error) {
      console.error("❌ Failed to stop recording:", error);
    }
  };

  const uploadAndTranscribe = async (fileUri: string) => {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const formData = new FormData();

    formData.append("audio", {
      uri: fileInfo.uri,
      name: "recording.m4a",
      type: "audio/m4a",
    } as any);

    try {
      const response = await fetch(
        "https://9fd1-2001-44c8-46e2-14f8-d027-39f5-267e-dc39.ngrok-free.app/speech",
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log("📝 Transcription:", data.transcript);
      if (data.transcript) {
        const cleaned = data.transcript.trim().replace(/[.,!?]+$/, "");
        setSearchQuery(cleaned);
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
    }
  };

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

  useEffect(() => {
    if (!allMeals || allMeals.length === 0) return;

    const filtered = allMeals
      .map((meal) => {
        const missingCount = meal.ingredients.filter(
          (ing: string) => !userIngredients.includes(ing)
        ).length;
        return { ...meal, missingCount };
      })
      .filter((meal) => {
        const match = meal.missingCount < meal.ingredients.length;
        const nameMatch = meal.strMeal
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
        return match && (searchQuery.trim() === "" || nameMatch);
      })
      .sort((a, b) => a.missingCount - b.missingCount);

    setFilteredMeals(filtered);
  }, [searchQuery, allMeals, userIngredients]);

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
          const missingCount = meal.ingredients.filter(
            (ing: string) => !userIngredients.includes(ing)
          ).length;
          return { ...meal, missingCount };
        })
        .filter((meal) => meal.missingCount < meal.ingredients.length)
        .sort((a, b) => a.missingCount - b.missingCount);

      setFilteredMeals(filtered);
    } catch (err) {
      console.error("❌ Category filter error:", err);
    }
  };

  const getMissingCount = (meal: any) => {
    return meal.missingCount ?? 0;
  };

  return (
    <SafeAreaView>
      <View style={{ flexDirection: "row", alignItems: "center", margin: 10 }}>
        <Searchbar
          placeholder="Search for a menu..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1, borderRadius: 8 }}
        />
        <TouchableOpacity
          onPress={recording ? stopRecording : startRecording}
          style={{ marginLeft: 10 }}
        >
          <Ionicons
            name={recording ? "stop-circle" : "mic"}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

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
                {getMissingCount(item) > 0 && (
                  <Text style={{ color: "gray" }}>
                    You Are Missing {getMissingCount(item)} ingredients
                  </Text>
                )}
              </View>
              <Image
                source={{ uri: item.strMealThumb }}
                style={styles.image}
              />
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