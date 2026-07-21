import { useCallback, useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";

const CANAL_LIVE = "posiciones-live-ciudadano";

/**
 * Carga recorridos en_curso + posiciones_live y mantiene un canal Realtime.
 * El estado de marcadores vive aquí, no en el componente de mapa.
 */
export function useRecorridosActivos() {
  const [marcadores, setMarcadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estaActualizado, setEstaActualizado] = useState(true);

  const cargarInicial = useCallback(async () => {
    setCargando(true);
    setError(null);

    const { data: recorridos, error: errorRecorridos } = await supabase
      .from("recorridos")
      .select(
        `
        id,
        estado,
        ruta_id,
        vehiculo_id,
        fecha_inicio,
        Rutas ( id, nombre_ruta, shape, id_ruta ),
        vehiculos ( id, placa, marca, modelo ),
        Chofer:chofer_id ( nombre, apellido )
      `,
      )
      .eq("estado", "en_curso");

    if (errorRecorridos) {
      setCargando(false);
      setError(`[useRecorridosActivos] ${errorRecorridos.message}`);
      throw new Error(`[useRecorridosActivos] ${errorRecorridos.message}`);
    }

    const { data: lives, error: errorLive } = await supabase
      .from("posiciones_live")
      .select(
        "recorrido_id, latitud, longitud, velocidad_ms, timestamp_captura, updated_at",
      );

    if (errorLive) {
      setCargando(false);
      setError(`[useRecorridosActivos] ${errorLive.message}`);
      throw new Error(`[useRecorridosActivos] ${errorLive.message}`);
    }

    const livePorRecorrido = new Map(
      (lives || []).map((p) => [p.recorrido_id, p]),
    );

    const unidos = (recorridos || []).map((rec) => {
      const live = livePorRecorrido.get(rec.id) || null;
      return {
        recorridoId: rec.id,
        estado: rec.estado,
        fechaInicio: rec.fecha_inicio,
        ruta: rec.Rutas || null,
        vehiculo: rec.vehiculos || null,
        chofer: rec.Chofer || null,
        latitud: live?.latitud ?? null,
        longitud: live?.longitud ?? null,
        velocidadMs: live?.velocidad_ms ?? null,
        timestampCaptura: live?.timestamp_captura ?? null,
        updatedAt: live?.updated_at ?? null,
      };
    });

    setMarcadores(unidos);
    setEstaActualizado(true);
    setCargando(false);
    return unidos;
  }, []);

  useEffect(() => {
    let activo = true;

    cargarInicial().catch((err) => {
      if (activo) {
        setError(err.message);
        setCargando(false);
      }
    });

    const canal = supabase
      .channel(CANAL_LIVE)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posiciones_live" },
        (payload) => {
          setEstaActualizado(true);
          if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.recorrido_id;
            setMarcadores((prev) =>
              prev.filter((m) => m.recorridoId !== deletedId),
            );
            return;
          }

          const row = payload.new;
          if (!row) return;

          setMarcadores((prev) => {
            const idx = prev.findIndex((m) => m.recorridoId === row.recorrido_id);
            if (idx === -1) {
              // Nuevo camión: recargar metadata
              cargarInicial().catch(() => setEstaActualizado(false));
              return prev;
            }
            const actual = prev[idx];
            const velocidadNueva =
              row.velocidad_ms != null && Number.isFinite(Number(row.velocidad_ms))
                ? Number(row.velocidad_ms)
                : null;
            // Conservar última velocidad conocida si el GPS manda null temporalmente.
            const velocidadMs =
              velocidadNueva != null ? velocidadNueva : actual.velocidadMs ?? null;

            const copy = [...prev];
            copy[idx] = {
              ...actual,
              latitud: row.latitud ?? actual.latitud ?? null,
              longitud: row.longitud ?? actual.longitud ?? null,
              velocidadMs,
              timestampCaptura: row.timestamp_captura ?? actual.timestampCaptura ?? null,
              updatedAt: row.updated_at ?? actual.updatedAt ?? null,
            };
            return copy;
          });
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setEstaActualizado(false);
        }
      });

    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, [cargarInicial]);

  const reintentar = useCallback(async () => {
    try {
      await cargarInicial();
    } catch (err) {
      setError(err.message);
    }
  }, [cargarInicial]);

  return {
    marcadores,
    cargando,
    error,
    estaActualizado,
    reintentar,
  };
}
