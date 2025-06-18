import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "../../auth-context";

export default function Signup() {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    age: "",
    gender: "",
    height: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();

  const handleChange = (name: string, value: string) => {
    // Only allow numbers for age and height
    if (name === "age" || name === "height") {
      value = value.replace(/[^0-9]/g, "");
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    setError("");

    // Simple front-end validation
    if (
      !form.firstname ||
      !form.lastname ||
      !form.age ||
      !form.gender ||
      !form.height ||
      !form.email ||
      !form.password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    const heightNum = Number(form.height);
    if (isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      setError("Height must be a number between 50 and 250 cm.");
      return;
    }

    const ageNum = Number(form.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError("Please enter a valid age (1-120).");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(form as any).toString(),
      });

      // Show backend error reason if available
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || "Signup failed. Please try again.");
        return;
      }

      const user = await response.json();
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      router.replace("/");
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        placeholder="Firstname"
        value={form.firstname}
        onChangeText={(text) => handleChange("firstname", text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Lastname"
        value={form.lastname}
        onChangeText={(text) => handleChange("lastname", text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Age"
        value={form.age}
        onChangeText={(text) => handleChange("age", text)}
        keyboardType="numeric"
        style={styles.input}
        maxLength={3}
      />
      <TextInput
        placeholder="Gender"
        value={form.gender}
        onChangeText={(text) => handleChange("gender", text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Height (cm)"
        value={form.height}
        onChangeText={(text) => handleChange("height", text)}
        keyboardType="numeric"
        style={styles.input}
        maxLength={3}
      />
      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={(text) => handleChange("email", text)}
        keyboardType="email-address"
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={form.password}
        onChangeText={(text) => handleChange("password", text)}
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text> : null}
      <Button title="Sign Up" onPress={handleSubmit} />
      <TouchableOpacity onPress={() => router.replace("/login")}>
        <Text style={styles.switchText}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 32 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
  },
  switchText: { marginTop: 16, color: "#38bdf8", textAlign: "center" },
});
