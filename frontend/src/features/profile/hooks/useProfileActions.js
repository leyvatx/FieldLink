import { useRef, useState } from "react";
import useUpdateProfile from "../hooks/useUpdateProfile";
import useProfileSave from "../hooks/useProfileSave";

const useProfileActions = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { isSaving, startSaving, finishSaving, failSaving, resetSaveState } =
    useProfileSave();
  const updateProfileMutation = useUpdateProfile();
  const profileMainRef = useRef();

  const handleSave = async () => {
    if (!profileMainRef.current) return;

    startSaving();

    try {
      if (!profileMainRef.current.validateForm()) {
        failSaving(null, "Por favor corrige los errores en el formulario");
        return;
      }

      const formData = profileMainRef.current.handleSaveChanges();
      const profileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
      };

      await updateProfileMutation.mutateAsync(profileData);
      setIsEditing(false);
      finishSaving();

      profileMainRef.current.clearFieldErrors?.();
      profileMainRef.current.refetch?.();
      profileMainRef.current.refreshAuthUser?.();
      profileMainRef.current.cleanupTempUrls?.();
    } catch (error) {
      profileMainRef.current?.setBackendErrors?.(error?.response?.data || {});
      failSaving(error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetSaveState();

    profileMainRef.current?.resetForm?.();
    profileMainRef.current?.clearFieldErrors?.();
    profileMainRef.current?.cleanupTempUrls?.();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return {
    isEditing,
    isSaving,
    handleSave,
    handleCancel,
    handleEdit,
    profileMainRef,
  };
};

export default useProfileActions;
