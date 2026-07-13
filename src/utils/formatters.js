/**
 * Formatea distancia en km a texto legible.
 * @param {number|null|undefined} distanciaKm
 */
export function formatearDistancia(distanciaKm) {
  if (distanciaKm == null || !Number.isFinite(Number(distanciaKm))) {
    return "—";
  }
  const km = Number(distanciaKm);
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Formatea un timestamp ISO a hora local corta.
 * @param {string|null|undefined} iso
 */
export function formatearHora(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Nombre visible del chofer.
 * @param {{ nombre?: string, apellido?: string }|null|undefined} chofer
 */
export function formatearNombreChofer(chofer) {
  if (!chofer) return "Conductor no disponible";
  const nombre = [chofer.nombre, chofer.apellido].filter(Boolean).join(" ").trim();
  return nombre || "Conductor no disponible";
}

/**
 * Velocidad GPS (m/s) → texto km/h.
 * @param {number|null|undefined} velocidadMs
 */
export function formatearVelocidadKmh(velocidadMs) {
  if (velocidadMs == null || !Number.isFinite(Number(velocidadMs)) || Number(velocidadMs) < 0) {
    return "Sin dato";
  }
  const kmh = Number(velocidadMs) * 3.6;
  if (kmh < 0.5) return "0 km/h";
  return `${kmh.toFixed(0)} km/h`;
}

/**
 * ETA a partir de distancia (km) y velocidad (m/s).
 * No calcula distancia geográfica: usa el km del RPC.
 * Fallback 15 km/h si no hay velocidad usable.
 * @returns {{ texto: string, esEstimado: boolean, minutos: number|null }}
 */
export function calcularEtaDesdeDistancia(distanciaKm, velocidadMs) {
  if (distanciaKm == null || !Number.isFinite(Number(distanciaKm)) || Number(distanciaKm) < 0) {
    return { texto: "—", esEstimado: false, minutos: null };
  }
  const km = Number(distanciaKm);
  let kmh = null;
  let esEstimado = false;
  if (velocidadMs != null && Number.isFinite(Number(velocidadMs)) && Number(velocidadMs) > 0.3) {
    kmh = Number(velocidadMs) * 3.6;
  } else {
    kmh = 15;
    esEstimado = true;
  }
  const horas = km / kmh;
  const minutos = Math.max(1, Math.round(horas * 60));
  const texto =
    minutos < 60
      ? `~${minutos} min`
      : `~${Math.floor(minutos / 60)} h ${minutos % 60} min`;
  return { texto, esEstimado, minutos };
}

/**
 * Duración desde un ISO hasta ahora.
 * @param {string|null|undefined} isoInicio
 */
export function formatearDuracion(isoInicio) {
  if (!isoInicio) return "—";
  const inicio = new Date(isoInicio);
  if (Number.isNaN(inicio.getTime())) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - inicio.getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} h ${m} min`;
}

/**
 * Convierte shape GeoJSON a coordenadas para Polyline de react-native-maps
 * (array de { latitude, longitude }).
 */
export function shapeACoordenadasMapa(shape) {
  if (!shape) return [];
  try {
    const geo = typeof shape === "string" ? JSON.parse(shape) : shape;
    let coords = [];
    if (geo.type === "LineString" && Array.isArray(geo.coordinates)) {
      coords = geo.coordinates;
    } else if (geo.type === "Feature" && geo.geometry?.type === "LineString") {
      coords = geo.geometry.coordinates;
    } else if (geo.type === "FeatureCollection" && Array.isArray(geo.features)) {
      const line = geo.features.find((f) => f.geometry?.type === "LineString");
      coords = line?.geometry?.coordinates || [];
    }
    return coords
      .filter((c) => Array.isArray(c) && c.length >= 2)
      .map(([longitude, latitude]) => ({ latitude, longitude }));
  } catch {
    return [];
  }
}
