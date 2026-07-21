import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecorridosActivos } from "../hooks/useRecorridosActivos";
import { useRutaCercana } from "../hooks/useRutaCercana";
import { useUbicacionContext } from "../context/UbicacionContext";
import MapaRecorridos from "../components/MapaRecorridos";
import TarjetaRuta from "../components/TarjetaRuta";
import IndicadorCercania from "../components/IndicadorCercania";

function PantallaCarga() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#00A86B" />
      <Text style={styles.muted}>Cargando recorridos activos…</Text>
    </View>
  );
}

function PantallaError({ mensaje, onReintentar }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.errorTitle}>Sin conexión o error de datos</Text>
      <Text style={styles.muted}>{mensaje}</Text>
      <TouchableOpacity style={styles.retry} onPress={onReintentar}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MapaPublicoScreen({ navigation }) {
  const mapaRef = useRef(null);
  const { marcadores, cargando, error, estaActualizado, reintentar } =
    useRecorridosActivos();
  const {
    coordenadas,
    obtenerUbicacion,
    cargando: cargandoUbicacion,
    permisoDenegado,
    error: errorUbicacion,
  } = useUbicacionContext();
  const {
    rutasCercanas,
    rutaMasCercana,
    cargando: cargandoCercana,
    error: errorCercana,
    buscarRutaCercana,
  } = useRutaCercana();

  /** Solo el id: las métricas se leen siempre del marcador live en `marcadores`. */
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [centrandoEnMi, setCentrandoEnMi] = useState(false);

  const seleccionadoLive = useMemo(() => {
    if (!seleccionadoId) return null;
    return marcadores.find((m) => m.recorridoId === seleccionadoId) ?? null;
  }, [marcadores, seleccionadoId]);

  /** Distancia PostGIS del camión seleccionado (RPC), no solo del “más cercano”. */
  const distanciaSeleccionada = useMemo(() => {
    if (!seleccionadoId || !rutasCercanas?.length) return null;
    const match = rutasCercanas.find((r) => r.recorrido_id === seleccionadoId);
    if (match?.distancia_km == null) return null;
    const km = Number(match.distancia_km);
    return Number.isFinite(km) ? km : null;
  }, [seleccionadoId, rutasCercanas]);

  const velocidadCercana = useMemo(() => {
    if (!rutaMasCercana?.recorrido_id) return null;
    const match = marcadores.find(
      (m) => m.recorridoId === rutaMasCercana.recorrido_id,
    );
    return match?.velocidadMs ?? null;
  }, [rutaMasCercana, marcadores]);

  const onSeleccionarMarcador = async (marcador) => {
    if (!marcador?.recorridoId) return;
    setSeleccionadoId(marcador.recorridoId);

    // Si ya hay coords (FAB o ruta cercana previa), refrescar distancias RPC
    // para poder mostrar ETA del camión seleccionado.
    const punto = coordenadas;
    if (!punto) return;
    try {
      await buscarRutaCercana(punto.latitud, punto.longitud);
    } catch {
      // error ya expuesto por el hook
    }
  };

  const onSolicitarRutaCercana = async () => {
    const punto = coordenadas || (await obtenerUbicacion({ forzar: true }));
    if (!punto) return;
    try {
      const lista = await buscarRutaCercana(punto.latitud, punto.longitud);
      if (lista?.[0]?.recorrido_id) {
        setSeleccionadoId(lista[0].recorrido_id);
      }
    } catch {
      // error ya expuesto por el hook
    }
  };

  /** Relé GPS puntual y recentra el mapa (sin tracking continuo). */
  const onRetomarMiUbicacion = async () => {
    setCentrandoEnMi(true);
    try {
      const punto = await obtenerUbicacion({ forzar: true });
      if (punto) {
        mapaRef.current?.centrarEnUsuario(punto);
      }
    } finally {
      setCentrandoEnMi(false);
    }
  };

  if (cargando && marcadores.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <PantallaCarga />
      </SafeAreaView>
    );
  }

  if (error && marcadores.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <PantallaError mensaje={error} onReintentar={reintentar} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recolección en vivo</Text>
        <Text style={styles.subtitle}>
          {marcadores.length} camión(es) activo(s)
          {!estaActualizado ? " · sin actualizar" : ""}
        </Text>
      </View>

      <View style={styles.mapArea}>
        <MapaRecorridos
          ref={mapaRef}
          marcadores={marcadores}
          seleccionadoId={seleccionadoId}
          onSeleccionar={onSeleccionarMarcador}
          ubicacionCiudadano={coordenadas}
        />
        <TouchableOpacity
          style={styles.fabUbicacion}
          onPress={onRetomarMiUbicacion}
          disabled={centrandoEnMi || cargandoUbicacion}
          accessibilityLabel="Centrar en mi ubicación"
        >
          {centrandoEnMi || cargandoUbicacion ? (
            <ActivityIndicator color="#1A365D" />
          ) : (
            <Text style={styles.fabTexto}>◎</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <IndicadorCercania
          rutaMasCercana={rutaMasCercana}
          velocidadMsCamion={velocidadCercana}
          cargando={cargandoUbicacion || cargandoCercana}
          error={errorCercana || errorUbicacion}
          permisoDenegado={permisoDenegado}
          onSolicitarUbicacion={onSolicitarRutaCercana}
        />

        {marcadores.length === 0 ? (
          <Text style={styles.empty}>No hay recorridos activos ahora.</Text>
        ) : null}

        <TarjetaRuta
          marcador={seleccionadoLive}
          distanciaKm={distanciaSeleccionada}
          onCerrar={() => setSeleccionadoId(null)}
          onVerDetalle={(m) =>
            navigation.navigate("DetalleRuta", {
              marcador: m,
              distanciaKm: distanciaSeleccionada,
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7FAFC" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  header: { paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 22, fontWeight: "700", color: "#1A202C" },
  subtitle: { marginTop: 2, color: "#718096" },
  mapArea: { flex: 1 },
  fabUbicacion: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabTexto: { fontSize: 22, color: "#1A365D", fontWeight: "700" },
  footer: {
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#F7FAFC",
  },
  empty: { textAlign: "center", color: "#718096" },
  muted: { color: "#718096", textAlign: "center" },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#1A202C" },
  retry: {
    marginTop: 8,
    backgroundColor: "#00A86B",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
