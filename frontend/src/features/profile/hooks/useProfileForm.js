import { useState, useEffect, useCallback } from "react";
import useProfile from "./useProfile";
import { useRefreshAuthUser } from "@features/auth/hooks/useAuthUser";
import useTempUrls from "./useTempUrls";
import useProfileValidation from "./useProfileValidation";

const useProfileForm = () => {
  const { data: profile, isLoading, refetch } = useProfile();
  const refreshAuthUser = useRefreshAuthUser();
  const { cleanupTempUrls } = useTempUrls();
  const {
    fieldErrors,
    validateForm: validateFields,
    clearFieldError,
    clearFieldErrors: clearAllFieldErrors,
    setBackendErrors,
  } = useProfileValidation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const initializeFormData = useCallback((profileData) => {
    return {
      name: profileData.name || "",
      email: profileData.email || "",
      phone: profileData.phone || "",
    };
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData(initializeFormData(profile));
    }
  }, [profile, initializeFormData]);

  const handleChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      clearFieldError(field);
    },
    [clearFieldError]
  );

  const handleAvatarChange = () => {};
  const handleRemoveAvatar = () => {};

  const resetForm = useCallback(() => {
    cleanupTempUrls();
    clearAllFieldErrors();
    if (profile) {
      setFormData(initializeFormData(profile));
    }
  }, [cleanupTempUrls, clearAllFieldErrors, profile, initializeFormData]);

  const validateForm = useCallback(() => {
    return validateFields(formData);
  }, [validateFields, formData]);

  return {
    profile,
    isLoading,
    formData,
    fieldErrors,
    handleChange,
    handleAvatarChange,
    handleRemoveAvatar,
    resetForm,
    cleanupTempUrls,
    refetch,
    refreshAuthUser,
    validateForm,
    clearFieldErrors: clearAllFieldErrors,
    setBackendErrors,
  };
};

export default useProfileForm;
