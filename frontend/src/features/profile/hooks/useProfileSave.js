import { useState, useCallback } from "react";
import { useMessage } from "@context/MessageProvider";

/**
 * Hook personalizado para manejar el estado de guardado del perfil
 */
const useProfileSave = () => {
  const { success, error: showError } = useMessage();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const startSaving = useCallback(() => {
    setIsSaving(true);
    setSaveError(null);
  }, []);

  const finishSaving = useCallback((successMessage = "Perfil actualizado exitosamente") => {
    setIsSaving(false);
    setSaveError(null);
    success(successMessage);
  }, [success]);

  const failSaving = useCallback((error, defaultMessage = "Error al guardar el perfil") => {
    setIsSaving(false);
    setSaveError(error);
    if (error?.message || defaultMessage) {
      showError(error?.message || defaultMessage);
    }
  }, [showError]);

  const resetSaveState = useCallback(() => {
    setIsSaving(false);
    setSaveError(null);
  }, []);

  return {
    isSaving,
    saveError,
    startSaving,
    finishSaving,
    failSaving,
    resetSaveState,
  };
};

export default useProfileSave;