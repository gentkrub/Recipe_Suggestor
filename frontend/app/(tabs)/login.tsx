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

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(form as any).toString(),
      });
      if (!response.ok) {
        // Get error message from server (if available)
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || "Invalid email or password");
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
      <Text style={styles.title}>Log In</Text>
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
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <Button title="Log In" onPress={handleSubmit} />
      <TouchableOpacity onPress={() => router.replace("/signup")}>
        <Text style={styles.switchText}>Don’t have an account? Sign Up</Text>
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
