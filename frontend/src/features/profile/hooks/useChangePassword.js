import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { changePassword, validateProfilePassword } from "@api/profileService";
import useProfileError from "./useProfileError";

const useChangePassword = () => {
  const { handleError, clearError } = useProfileError();
  const [changing, setChanging] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword, confirmPassword }) => {
      return changePassword(currentPassword, newPassword, confirmPassword);
    },
    onMutate: () => {
      setChanging(true);
      clearError();
    },
    onSuccess: (result) => {
      setChanging(false);
      if (!result.success) {
        handleError(result.error || "Error al cambiar la contrasena");
      }
    },
    onError: (error) => {
      setChanging(false);
      handleError(error, "Error al cambiar la contrasena");
    },
  });

  const validatePasswords = (currentPassword, newPassword, confirmPassword) => {
    if (!currentPassword?.trim()) {
      return "La contrasena actual es requerida";
    }
    if (!newPassword?.trim()) {
      return "La nueva contrasena es requerida";
    }
    if (!confirmPassword?.trim()) {
      return "La confirmacion de contrasena es requerida";
    }
    if (newPassword !== confirmPassword) {
      return "Las contrasenas no coinciden";
    }
    if (currentPassword === newPassword) {
      return "La nueva contrasena no puede ser igual a la actual";
    }
    if (newPassword.length < 8) {
      return "La contrasena debe tener al menos 8 caracteres";
    }
    return null;
  };

  const executeChangePassword = async (
    currentPassword,
    newPassword,
    confirmPassword
  ) => {
    const validationError = validatePasswords(
      currentPassword,
      newPassword,
      confirmPassword
    );
    if (validationError) {
      handleError(validationError);
      return { success: false, error: validationError };
    }

    try {
      const validationResult = await validateProfilePassword(currentPassword);
      if (!validationResult?.success) {
        handleError(
          validationResult.message || validationResult.error || "Contrasena incorrecta"
        );
        return validationResult;
      }
    } catch (err) {
      handleError(err?.message || "Error validando la contrasena actual");
      return { success: false, error: err?.message || "validation_error" };
    }

    try {
      const result = await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    executeChangePassword,
    changing: changing || changePasswordMutation.isPending,
    error: changePasswordMutation.error,
    isSuccess: changePasswordMutation.isSuccess,
    reset: changePasswordMutation.reset,
  };
};

export default useChangePassword;
