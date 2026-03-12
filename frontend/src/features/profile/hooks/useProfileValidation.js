import { useState, useCallback } from "react";

const useProfileValidation = () => {
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = useCallback((formData) => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (!formData.email?.trim()) {
      errors.email = "El correo electronico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "El correo electronico no es valido";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const clearFieldError = useCallback(
    (field) => {
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [fieldErrors]
  );

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const setBackendErrors = useCallback((backendErrors) => {
    const errors = {};

    if (backendErrors?.email?.length) {
      errors.email = backendErrors.email[0];
    }
    if (backendErrors?.name?.length) {
      errors.name = backendErrors.name[0];
    }
    if (backendErrors?.phone?.length) {
      errors.phone = backendErrors.phone[0];
    }

    setFieldErrors(errors);
  }, []);

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return {
    fieldErrors,
    validateForm,
    clearFieldError,
    clearFieldErrors,
    setBackendErrors,
    hasErrors,
  };
};

export default useProfileValidation;
