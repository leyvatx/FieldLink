import { useState, useEffect, useCallback } from "react";

/**
 * Hook para manejar el estado básico de la tabla de roles y permisos
 * Responsable de: búsqueda, expansión de filas y roles ocultos
 */
export const useTableState = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState(new Set());
  const [hiddenRoles, setHiddenRoles] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRowExpand = useCallback((record) => {
    setExpandedRowKeys(prev => {
      const newSet = new Set(prev);
      newSet.has(record.key) ? newSet.delete(record.key) : newSet.add(record.key);
      return newSet;
    });
  }, []);

  const updateHiddenRoles = useCallback((roles) => {
    setHiddenRoles(roles);
  }, []);

  const updateSearch = useCallback((searchTerm) => {
    setSearch(searchTerm);
  }, []);

  return {
    search,
    debouncedSearch,
    expandedRowKeys,
    hiddenRoles,
    handleRowExpand,
    updateHiddenRoles,
    updateSearch,
    setHiddenRoles: updateHiddenRoles,
  };
};