import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../auth-context";

export default function Signup() {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    dob: new Date(),
    gender: "",
    height: "",
    email: "",
    password: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showHeightModal, setShowHeightModal] = useState(false);

  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();

  const genders = ["Male", "Female", "Rather Not Say"];
  const heights = Array.from({ length: 201 }, (_, i) => (i + 50).toString());

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const calculateAge = (dob: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    return m < 0 || (m === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;
  };

  const handleSubmit = async () => {
    setError("");

    if (
      !form.firstname ||
      !form.lastname ||
      !form.gender ||
      !form.height ||
      !form.email ||
      !form.password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    const ageNum = calculateAge(form.dob);
    if (ageNum < 1 || ageNum > 120) {
      setError("Please enter a valid date of birth.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          ...form,
          age: ageNum.toString(),
        }).toString(),
      });

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
      <View style={styles.formCard}>
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          placeholder="Firstname"
          placeholderTextColor="#999"
          value={form.firstname}
          onChangeText={(text) => handleChange("firstname", text)}
          style={styles.input}
        />
        <TextInput
          placeholder="Lastname"
          placeholderTextColor="#999"
          value={form.lastname}
          onChangeText={(text) => handleChange("lastname", text)}
          style={styles.input}
        />

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.popUpButton}>
          <Text style={styles.popUpButtonText}>Select Date of Birth</Text>
        </TouchableOpacity>
        <Text style={styles.selectedText}>{form.dob.toDateString()}</Text>

        {showDatePicker && (
          <DateTimePicker
            value={form.dob}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) handleChange("dob", selectedDate);
            }}
            maximumDate={new Date()}
          />
        )}

        <TouchableOpacity onPress={() => setShowGenderModal(true)} style={styles.popUpButton}>
          <Text style={styles.popUpButtonText}>
            {form.gender ? form.gender : "Select Gender"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowHeightModal(true)} style={styles.popUpButton}>
          <Text style={styles.popUpButtonText}>
            {form.height ? `${form.height} cm` : "Select Height"}
          </Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={form.email}
          onChangeText={(text) => handleChange("email", text)}
          keyboardType="email-address"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          value={form.password}
          onChangeText={(text) => handleChange("password", text)}
          secureTextEntry
          style={styles.input}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.signupButton} onPress={handleSubmit}>
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.switchText}>Already have an account? Log In</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showGenderModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {genders.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  handleChange("gender", option);
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.modalText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowGenderModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showHeightModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Height</Text>
            <FlatList
              data={heights}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    handleChange("height", item);
                    setShowHeightModal(false);
                  }}
                >
                  <Text style={styles.modalText}>{item} cm</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowHeightModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  formCard: {
    width: "100%",
    backgroundColor: "#fff7ec",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#ff8c00",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
    color: "#333",
  },
  popUpButton: {
    backgroundColor: "#ff8c00",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  popUpButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  selectedText: {
    textAlign: "center",
    marginBottom: 12,
    color: "#333",
  },
  signupButton: {
    backgroundColor: "#ff8c00",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signupText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 12,
  },
  switchText: {
    marginTop: 16,
    color: "#0ea5e9",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    marginHorizontal: 30,
    borderRadius: 8,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  modalText: {
    fontSize: 16,
    color: "#333",
  },
  modalCancel: {
    marginTop: 16,
    color: "#ff0000",
    textAlign: "center",
    fontWeight: "bold",
  },
});