import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  calcularEtaDesdeDistancia,
  formatearDistancia,
  formatearDuracion,
  formatearHora,
  formatearNombreChofer,
  formatearVelocidadKmh,
} from "../utils/formatters";

export default function TarjetaRuta({
  marcador,
  distanciaKm = null,
  onVerDetalle,
  onCerrar,
}) {
  if (!marcador) return null;

  const placa = marcador.vehiculo?.placa || "Sin placa";
  const ruta = marcador.ruta?.nombre_ruta || "Ruta sin nombre";
  const chofer = formatearNombreChofer(marcador.chofer);
  const eta = calcularEtaDesdeDistancia(distanciaKm, marcador.velocidadMs);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.placa}>{placa}</Text>
        {onCerrar ? (
          <TouchableOpacity onPress={onCerrar} hitSlop={12}>
            <Text style={styles.cerrar}>Cerrar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.ruta}>{ruta}</Text>
      <Text style={styles.meta}>Conductor: {chofer}</Text>
      <Text style={styles.meta}>
        Velocidad: {formatearVelocidadKmh(marcador.velocidadMs)}
      </Text>
      <Text style={styles.meta}>
        En ruta: {formatearDuracion(marcador.fechaInicio)}
      </Text>
      <Text style={styles.meta}>
        Actualizado:{" "}
        {formatearHora(marcador.updatedAt || marcador.timestampCaptura)}
      </Text>
      {distanciaKm != null ? (
        <>
          <Text style={styles.meta}>
            Distancia: {formatearDistancia(distanciaKm)}
          </Text>
          <Text style={styles.meta}>Llegada aprox.: {eta.texto}</Text>
        </>
      ) : (
        <Text style={styles.hint}>
          Usa “Ruta más cercana” o tu ubicación para ver distancia y ETA.
        </Text>
      )}
      {onVerDetalle ? (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => onVerDetalle(marcador)}
        >
          <Text style={styles.btnText}>Ver detalle</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  placa: { fontSize: 18, fontWeight: "700", color: "#1A202C" },
  cerrar: { color: "#718096", fontSize: 13 },
  ruta: { fontSize: 15, color: "#2D3748", marginTop: 2 },
  meta: { fontSize: 13, color: "#718096" },
  hint: { fontSize: 12, color: "#A0AEC0", marginTop: 4 },
  btn: {
    marginTop: 10,
    backgroundColor: "#00A86B",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
