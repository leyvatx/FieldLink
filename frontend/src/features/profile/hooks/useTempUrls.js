import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook personalizado para manejar URLs temporales de archivos
 * Se encarga de crear y limpiar URLs de object URL automáticamente
 */
const useTempUrls = () => {
  const [tempUrls, setTempUrls] = useState([]);
  const urlsToCleanupRef = useRef(new Set());
  const addTempUrl = useCallback((url) => {
    if (url && typeof url === "string" && url.startsWith("blob:")) {
      setTempUrls(prev => [...prev, url]);
      urlsToCleanupRef.current.add(url);
      return url;
    }
    return url;
  }, []);

  const cleanupTempUrls = useCallback(() => {
    urlsToCleanupRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn("Error revoking object URL:", error);
      }
    });
    urlsToCleanupRef.current.clear();
    setTempUrls([]);
  }, []);

  useEffect(() => {
    return () => {
      cleanupTempUrls();
    };
  }, [cleanupTempUrls]);

  return {
    tempUrls,
    addTempUrl,
    cleanupTempUrls,
  };
};

export default useTempUrls;