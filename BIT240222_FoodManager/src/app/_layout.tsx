import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { FoodProvider } from "../context/FoodContext";

export default function RootLayout() {
  return (
    <FoodProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </FoodProvider>
  );
}
