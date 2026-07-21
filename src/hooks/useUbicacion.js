import { useCallback, useRef, useState } from "react";
import * as Location from "expo-location";

/**
 * Obtiene la ubicación del ciudadano solo bajo demanda (FAB / ruta cercana).
 * Nunca hace tracking continuo ni persiste coords en servidor.
 * No solicita permiso al montar la app.
 */
export function useUbicacion() {
  const [coordenadas, setCoordenadas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const solicitudEnCurso = useRef(false);

  const obtenerUbicacion = useCallback(async ({ forzar = false } = {}) => {
    if (!forzar && coordenadas) {
      return coordenadas;
    }
    if (solicitudEnCurso.current) {
      return coordenadas;
    }

    solicitudEnCurso.current = true;
    setCargando(true);
    setError(null);
    setPermisoDenegado(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermisoDenegado(true);
        setError("Permiso de ubicación denegado.");
        setCargando(false);
        solicitudEnCurso.current = false;
        return null;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const punto = {
        latitud: coords.latitude,
        longitud: coords.longitude,
      };
      setCoordenadas(punto);
      setCargando(false);
      solicitudEnCurso.current = false;
      return punto;
    } catch (err) {
      setError(err.message || "No se pudo obtener la ubicación.");
      setCargando(false);
      solicitudEnCurso.current = false;
      return null;
    }
  }, [coordenadas]);

  return {
    coordenadas,
    tieneUbicacion: !!coordenadas,
    cargando,
    error,
    permisoDenegado,
    obtenerUbicacion,
  };
}
