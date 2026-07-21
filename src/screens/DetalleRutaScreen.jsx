import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  calcularEtaDesdeDistancia,
  formatearDistancia,
  formatearDuracion,
  formatearHora,
  formatearNombreChofer,
  formatearVelocidadKmh,
  shapeACoordenadasMapa,
} from "../utils/formatters";

const REGION_BUENAVENTURA = {
  latitude: 3.8801,
  longitude: -77.0312,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function DetalleRutaScreen({ route }) {
  const marcador = route.params?.marcador;
  const distanciaKm = route.params?.distanciaKm ?? null;
  if (!marcador) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.muted}>No hay datos del recorrido.</Text>
      </SafeAreaView>
    );
  }

  const shapeCoords = shapeACoordenadasMapa(marcador.ruta?.shape);
  const tieneLive = marcador.latitud != null && marcador.longitud != null;
  const eta = calcularEtaDesdeDistancia(distanciaKm, marcador.velocidadMs);
  const region = tieneLive
    ? {
        latitude: marcador.latitud,
        longitude: marcador.longitud,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }
    : shapeCoords[0]
      ? {
          latitude: shapeCoords[0].latitude,
          longitude: shapeCoords[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : REGION_BUENAVENTURA;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{marcador.ruta?.nombre_ruta || "Ruta"}</Text>
        <Text style={styles.row}>
          Placa: {marcador.vehiculo?.placa || "—"}
        </Text>
        <Text style={styles.row}>
          Vehículo:{" "}
          {[marcador.vehiculo?.marca, marcador.vehiculo?.modelo]
            .filter(Boolean)
            .join(" ") || "—"}
        </Text>
        <Text style={styles.row}>
          Conductor: {formatearNombreChofer(marcador.chofer)}
        </Text>
        <Text style={styles.row}>
          Velocidad: {formatearVelocidadKmh(marcador.velocidadMs)}
        </Text>
        <Text style={styles.row}>
          Tiempo en ruta: {formatearDuracion(marcador.fechaInicio)}
        </Text>
        <Text style={styles.row}>
          Última señal:{" "}
          {formatearHora(marcador.updatedAt || marcador.timestampCaptura)}
        </Text>
        {distanciaKm != null ? (
          <>
            <Text style={styles.row}>
              Distancia: {formatearDistancia(distanciaKm)}
            </Text>
            <Text style={styles.row}>Llegada aprox.: {eta.texto}</Text>
          </>
        ) : null}

        <View style={styles.mapBox}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            mapType="standard"
            userInterfaceStyle="light"
            initialRegion={region}
            loadingEnabled
          >
            {shapeCoords.length > 1 ? (
              <Polyline
                coordinates={shapeCoords}
                strokeColor="#00A86B"
                strokeWidth={4}
              />
            ) : null}
            {tieneLive ? (
              <Marker
                coordinate={{
                  latitude: marcador.latitud,
                  longitude: marcador.longitud,
                }}
                title={marcador.vehiculo?.placa || "Camión"}
              />
            ) : null}
          </MapView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7FAFC" },
  content: { padding: 16, gap: 6 },
  title: { fontSize: 22, fontWeight: "700", color: "#1A202C", marginBottom: 8 },
  row: { fontSize: 15, color: "#2D3748" },
  muted: { padding: 16, color: "#718096" },
  mapBox: {
    marginTop: 16,
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  map: { flex: 1 },
});
