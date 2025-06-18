import { Stack } from "expo-router";
import { AuthProvider } from "../auth-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerTitle: "",             // <- empty title
            headerShadowVisible: false, // <- no shadow
            headerBackTitleVisible: false, // <- hides "Back" label on iOS
          }}
        />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});