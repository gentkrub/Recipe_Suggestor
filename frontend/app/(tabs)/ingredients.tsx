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
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../auth-context";

export default function IngredientsScreen() {
  const [inputText, setInputText] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [recording, setRecording] = useState(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetch("https://www.themealdb.com/api/json/v1/1/list.php?i=list")
      .then((res) => res.json())
      .then((data) => {
        setAllIngredients(data.meals || []);
      })
      .catch((err) => console.error("Failed to fetch ingredients:", err));

    const fetchUserIngredients = async () => {
      try {
        const res = await fetch(
          `https://9fd1-2001-44c8-46e2-14f8-d027-39f5-267e-dc39.ngrok-free.app/api/ingredients/latest?user_id=${user?.id}`
        );
        const data = await res.json();

        if (data.ingredients && data.ingredients.length > 0) {
          const restored = data.ingredients.map((item) => ({
            name: item.name,
            image: `https://www.themealdb.com/images/ingredients/${item.name}.png`,
          }));
          setIngredients(restored);
        }
      } catch (error) {
        console.error("❌ Failed to load latest ingredients:", error);
      }
    };

    if (user?.id) fetchUserIngredients();
  }, [user]);

  const handleInputChange = (text) => {
    const cleanedText = text.trim().replace(/[.,!?]+$/, "").toLowerCase();
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
    const cleaned = inputText.trim().replace(/[.,!?]+$/, "");
    if (!cleaned) return;

    const found = allIngredients.find(
      (item) => item.strIngredient.toLowerCase() === cleaned.toLowerCase()
    );

    if (!found) {
      alert("❌ This ingredient is not recognized. Please select from the suggestion list.");
      return;
    }

    const exists = ingredients.find(
      (item) => item.name.toLowerCase() === cleaned.toLowerCase()
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

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) await uploadAndTranscribe(uri);
      setRecording(null);
    } catch (error) {
      console.error("❌ Failed to stop recording:", error);
    }
  };

  const uploadAndTranscribe = async (fileUri) => {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const formData = new FormData();

    formData.append("audio", {
      uri: fileInfo.uri,
      name: "recording.m4a",
      type: "audio/m4a",
    });

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
      if (data.transcript)
        handleInputChange(data.transcript.trim().replace(/[.,!?]+$/, ""));
    } catch (err) {
      console.error("❌ Upload error:", err);
    }
  };

  const submitIngredients = async () => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    try {
      await AsyncStorage.setItem("latest_ingredients", JSON.stringify(ingredients));

      const res = await fetch(
        "https://9fd1-2001-44c8-46e2-14f8-d027-39f5-267e-dc39.ngrok-free.app/api/ingredient",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submitted_at: now,
            user_id: user?.id,
            ingredients: ingredients,
          }),
        }
      );

      const data = await res.json();
      alert("Ingredients saved!");
      router.replace("/menu");
    } catch (error) {
      console.error("❌ Failed to submit ingredients:", error);
      alert("Failed to save ingredients");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.ingredientItem}>
      <View style={styles.ingredientRow}>
        <Image source={{ uri: item.image }} style={styles.ingredientImage} />
        <Text style={styles.ingredientText}>{item.name}</Text>
      </View>
      <TouchableOpacity
        onPress={() =>
          setIngredients((prev) => prev.filter((ing) => ing.name !== item.name))
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
            <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
              <Ionicons
                name={recording ? "stop-circle" : "mic"}
                size={20}
                color="#999"
              />
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
            ListEmptyComponent={<Text style={styles.emptyText}>No ingredients yet.</Text>}
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
  container: { flex: 1, backgroundColor: "#fed7aa", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  inputRow: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, alignItems: "center", marginBottom: 10 },
  input: { flex: 1, marginHorizontal: 10 },
  suggestionWrapper: { maxHeight: 150, marginBottom: 10 },
  suggestionItem: { backgroundColor: "#fff", padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  suggestionImage: { width: 30, height: 30, borderRadius: 5 },
  heading: { fontSize: 20, fontWeight: "bold", marginVertical: 10 },
  ingredientItem: { backgroundColor: "#fff", borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ingredientImage: { width: 40, height: 40, borderRadius: 8 },
  ingredientText: { fontSize: 16, fontWeight: "500" },
  qtyBtn: { paddingHorizontal: 10 },
  nextButton: { position: "absolute", bottom: 10, left: 20, right: 20, backgroundColor: "#38bdf8", padding: 15, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  nextText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 30 },
  safeArea: { flex: 1, backgroundColor: "#fed7aa" },
});
