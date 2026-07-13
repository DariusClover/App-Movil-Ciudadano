import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MapaPublicoScreen from "../screens/MapaPublicoScreen";
import DetalleRutaScreen from "../screens/DetalleRutaScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MapaPublico"
          component={MapaPublicoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DetalleRuta"
          component={DetalleRutaScreen}
          options={{ title: "Detalle de ruta" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
