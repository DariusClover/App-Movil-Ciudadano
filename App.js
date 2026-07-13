import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UbicacionProvider } from "./src/context/UbicacionContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <UbicacionProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </UbicacionProvider>
    </SafeAreaProvider>
  );
}
