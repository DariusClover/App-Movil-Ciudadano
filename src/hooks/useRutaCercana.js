import { useCallback, useState } from "react";
import { supabase } from "../api/supabaseClient";

/**
 * Llama a la RPC PostGIS ruta_mas_cercana. No calcula distancias en JS.
 */
export function useRutaCercana() {
  const [rutasCercanas, setRutasCercanas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const buscarRutaCercana = useCallback(async (lat, lon) => {
    if (lat == null || lon == null) {
      setError("Sin coordenadas para calcular la ruta cercana.");
      return [];
    }

    setCargando(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("ruta_mas_cercana", {
      lat_ciudadano: lat,
      lon_ciudadano: lon,
    });

    if (rpcError) {
      const mensaje = `[useRutaCercana] ${rpcError.message}`;
      setError(mensaje);
      setCargando(false);
      throw new Error(mensaje);
    }

    const lista = data || [];
    setRutasCercanas(lista);
    setCargando(false);
    return lista;
  }, []);

  return {
    rutasCercanas,
    rutaMasCercana: rutasCercanas[0] || null,
    cargando,
    error,
    buscarRutaCercana,
  };
}
