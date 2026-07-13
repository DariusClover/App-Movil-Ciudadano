import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { shapeACoordenadasMapa } from "../utils/formatters";

const REGION_DEFAULT = {
  latitude: 3.8801,
  longitude: -77.0312,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const DELTA_CERCANO = { latitudeDelta: 0.06, longitudeDelta: 0.06 };

/**
 * Solo renderiza marcadores y polylines. El estado vive en el hook.
 * Prioridad de cámara: usuario → primer camión live → Buenaventura.
 * Expone centrarEnUsuario({ latitud, longitud }) vía ref.
 */
const MapaRecorridos = forwardRef(function MapaRecorridos(
  { marcadores, seleccionadoId, onSeleccionar, ubicacionCiudadano },
  ref,
) {
  const mapRef = useRef(null);
  const yaCentramosUsuario = useRef(false);

  const animarA = (latitud, longitud, duracionMs = 600) => {
    if (!mapRef.current || latitud == null || longitud == null) return;
    mapRef.current.animateToRegion(
      {
        latitude: latitud,
        longitude: longitud,
        ...DELTA_CERCANO,
      },
      duracionMs,
    );
  };

  useImperativeHandle(ref, () => ({
    centrarEnUsuario: ({ latitud, longitud }) => {
      animarA(latitud, longitud, 700);
    },
  }));

  const regionInicial = useMemo(() => {
    if (ubicacionCiudadano) {
      return {
        latitude: ubicacionCiudadano.latitud,
        longitude: ubicacionCiudadano.longitud,
        ...DELTA_CERCANO,
      };
    }
    const conCoords = marcadores.find(
      (m) => m.latitud != null && m.longitud != null,
    );
    if (conCoords) {
      return {
        latitude: conCoords.latitud,
        longitude: conCoords.longitud,
        ...DELTA_CERCANO,
      };
    }
    return REGION_DEFAULT;
  }, [marcadores, ubicacionCiudadano]);

  useEffect(() => {
    if (!ubicacionCiudadano || !mapRef.current) return;
    if (yaCentramosUsuario.current) return;
    yaCentramosUsuario.current = true;
    animarA(ubicacionCiudadano.latitud, ubicacionCiudadano.longitud, 600);
  }, [ubicacionCiudadano]);

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        userInterfaceStyle="light"
        initialRegion={regionInicial}
        showsUserLocation={!!ubicacionCiudadano}
        showsMyLocationButton={false}
        loadingEnabled
        loadingIndicatorColor="#00A86B"
        loadingBackgroundColor="#F7FAFC"
      >
        {marcadores.map((m) => {
          const shapeCoords = shapeACoordenadasMapa(m.ruta?.shape);
          return (
            <React.Fragment key={m.recorridoId}>
              {shapeCoords.length > 1 ? (
                <Polyline
                  coordinates={shapeCoords}
                  strokeColor="#00A86B"
                  strokeWidth={3}
                  lineDashPattern={
                    seleccionadoId === m.recorridoId ? undefined : [1]
                  }
                />
              ) : null}
              {m.latitud != null && m.longitud != null ? (
                <Marker
                  coordinate={{
                    latitude: m.latitud,
                    longitude: m.longitud,
                  }}
                  title={m.vehiculo?.placa || "Camión"}
                  description={m.ruta?.nombre_ruta || "Ruta activa"}
                  pinColor={
                    seleccionadoId === m.recorridoId ? "#00A86B" : "#1A365D"
                  }
                  onPress={() => onSeleccionar?.(m)}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </MapView>
    </View>
  );
});

export default MapaRecorridos;

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1 },
});
