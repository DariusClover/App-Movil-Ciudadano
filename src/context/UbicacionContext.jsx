import React, { createContext, useContext, useMemo } from "react";
import { useUbicacion } from "../hooks/useUbicacion";

const UbicacionContext = createContext({
  coordenadas: null,
  tieneUbicacion: false,
  cargando: false,
  error: null,
  permisoDenegado: false,
  obtenerUbicacion: async () => null,
  solicitarUbicacionAlInicio: async () => null,
});

export function UbicacionProvider({ children }) {
  const ubicacion = useUbicacion();
  const value = useMemo(() => ubicacion, [ubicacion]);
  return (
    <UbicacionContext.Provider value={value}>
      {children}
    </UbicacionContext.Provider>
  );
}

export function useUbicacionContext() {
  return useContext(UbicacionContext);
}
