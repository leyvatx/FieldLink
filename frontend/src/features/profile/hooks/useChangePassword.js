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
        handleError(result.error || "Error al cambiar la contraseña");
      }
    },
    onError: (error) => {
      setChanging(false);
      handleError(error, "Error al cambiar la contraseña");
    },
  });

  const validatePasswords = (currentPassword, newPassword, confirmPassword) => {
    if (!currentPassword?.trim()) {
      return "La contraseña actual es requerida";
    }
    if (!newPassword?.trim()) {
      return "La nueva contraseña es requerida";
    }
    if (!confirmPassword?.trim()) {
      return "La confirmación de contraseña es requerida";
    }
    if (newPassword !== confirmPassword) {
      return "Las contraseñas no coinciden";
    }
    if (currentPassword === newPassword) {
      return "La nueva contraseña no puede ser igual a la actual";
    }
    if (newPassword.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
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
          validationResult.message || validationResult.error || "Contraseña incorrecta"
        );
        return validationResult;
      }
    } catch (err) {
      handleError(err?.message || "Error validando la contraseña actual");
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
