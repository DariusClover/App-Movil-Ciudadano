import React, { useEffect, useRef } from "react";
import { Marker, AnimatedRegion } from "react-native-maps";

const DURACION_INTERPOLACION_MS = 800;
const UMBRAL_MOVIMIENTO = 1e-7;

/**
 * Marcador de camión con interpolación lineal de 800ms entre updates Realtime.
 * Clave estable por recorridoId (no recrear AnimatedRegion en cada tick).
 */
export default function MarcadorCamionAnimado({
  recorridoId,
  latitud,
  longitud,
  titulo,
  descripcion,
  pinColor,
  onPress,
}) {
  const coordinate = useRef(
    new AnimatedRegion({
      latitude: latitud,
      longitude: longitud,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;
  const ultimoRecorridoId = useRef(recorridoId);
  const ultimaLat = useRef(latitud);
  const ultimaLng = useRef(longitud);
  const esPrimeraPosicion = useRef(true);

  useEffect(() => {
    if (latitud == null || longitud == null) return;

    const fijarSinAnimar = () => {
      coordinate.setValue({
        latitude: latitud,
        longitude: longitud,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });
      ultimaLat.current = latitud;
      ultimaLng.current = longitud;
      esPrimeraPosicion.current = false;
    };

    if (ultimoRecorridoId.current !== recorridoId) {
      ultimoRecorridoId.current = recorridoId;
      esPrimeraPosicion.current = true;
      fijarSinAnimar();
      return;
    }

    if (esPrimeraPosicion.current) {
      fijarSinAnimar();
      return;
    }

    const deltaLat = Math.abs(ultimaLat.current - latitud);
    const deltaLng = Math.abs(ultimaLng.current - longitud);
    if (deltaLat < UMBRAL_MOVIMIENTO && deltaLng < UMBRAL_MOVIMIENTO) {
      return;
    }

    ultimaLat.current = latitud;
    ultimaLng.current = longitud;

    coordinate
      .timing({
        latitude: latitud,
        longitude: longitud,
        duration: DURACION_INTERPOLACION_MS,
        useNativeDriver: false,
      })
      .start();
  }, [recorridoId, latitud, longitud, coordinate]);

  return (
    <Marker.Animated
      coordinate={coordinate}
      title={titulo}
      description={descripcion}
      pinColor={pinColor}
      onPress={onPress}
      tracksViewChanges={false}
    />
  );
}
