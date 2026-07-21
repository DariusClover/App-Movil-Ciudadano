import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  calcularEtaDesdeDistancia,
  formatearDistancia,
} from "../utils/formatters";

export default function IndicadorCercania({
  rutaMasCercana,
  velocidadMsCamion = null,
  cargando,
  error,
  permisoDenegado,
  onSolicitarUbicacion,
}) {
  const eta = rutaMasCercana
    ? calcularEtaDesdeDistancia(rutaMasCercana.distancia_km, velocidadMsCamion)
    : null;

  const sufijoEta =
    eta && eta.estado === "ok"
      ? ` · ETA ${eta.texto}`
      : eta && eta.estado === "detenido"
        ? ` · ${eta.texto}`
        : eta && eta.estado === "sin_velocidad"
          ? ` · ${eta.texto}`
          : "";

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.btn}
        onPress={onSolicitarUbicacion}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Ruta más cercana</Text>
        )}
      </TouchableOpacity>

      {permisoDenegado ? (
        <Text style={styles.hint}>
          Sin permiso de ubicación: el mapa sigue disponible.
        </Text>
      ) : null}

      {error && !permisoDenegado ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      {rutaMasCercana ? (
        <View style={styles.badge}>
          <Text style={styles.badgeTitle}>
            {rutaMasCercana.nombre_ruta || "Ruta cercana"}
          </Text>
          <Text style={styles.badgeMeta}>
            {rutaMasCercana.placa_vehiculo || "Camión"} ·{" "}
            {formatearDistancia(rutaMasCercana.distancia_km)}
            {sufijoEta}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  btn: {
    backgroundColor: "#1A365D",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  hint: { fontSize: 12, color: "#718096" },
  error: { fontSize: 12, color: "#E53E3E" },
  badge: {
    backgroundColor: "#F0FFF4",
    borderColor: "#00A86B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  badgeTitle: { fontWeight: "700", color: "#1A202C" },
  badgeMeta: { marginTop: 2, color: "#2F855A" },
});
