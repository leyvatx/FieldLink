import { useState } from "react";
import { useMessage } from "@context/MessageProvider";

/**
 * Hook personalizado para manejar errores en el módulo de perfil
 * Proporciona una interfaz consistente para mostrar errores
 */
const useProfileError = () => {
  const { error: showError } = useMessage();
  const [errorMessage, setErrorMessage] = useState("");

  const handleError = (error, customMessage = null) => {
    console.error("Profile error:", error);

    let message = customMessage;

    if (!message) {
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      } else {
        message = "Ha ocurrido un error inesperado";
      }
    }

    setErrorMessage(message);
    showError(message);

    return message;
  };

  const clearError = () => {
    setErrorMessage("");
  };

  return {
    errorMessage,
    handleError,
    clearError,
  };
};

export default useProfileError;