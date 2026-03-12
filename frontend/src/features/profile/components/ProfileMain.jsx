import { forwardRef, useImperativeHandle, memo } from "react";
import Loader from "@components/Loader";
import { useTheme } from "@context/ThemeProvider";
import useProfileForm from "../hooks/useProfileForm";
import ProfileHeaderSection from "./sections/ProfileHeaderSection";
import BasicInfoSection from "./sections/BasicInfoSection";
import AdditionalDetailsSection from "./sections/AdditionalDetailsSection";
import PreferencesSection from "./sections/PreferencesSection";

const ProfileMain = forwardRef(({ isEditing }, ref) => {
  const { mode, toggleTheme } = useTheme();
  const { 
    profile, 
    isLoading, 
    formData, 
    fieldErrors,
    handleChange, 
    resetForm,
    cleanupTempUrls,
    refetch,
    refreshAuthUser,
    validateForm,
    clearFieldErrors,
    setBackendErrors
  } = useProfileForm();

  const handleSaveChanges = () => {
    return formData;
  };

  useImperativeHandle(ref, () => ({ handleSaveChanges, resetForm, cleanupTempUrls, refetch, refreshAuthUser, validateForm, clearFieldErrors, setBackendErrors }));
  if (isLoading) return <Loader />;
  if (!profile) return <div className="text-center text-gray-500">No se pudo cargar el perfil.</div>;

  return (
    <div
      className="rounded-lg shadow-sm p-6"
      style={{
        backgroundColor: 'var(--sidebar-bg-color, white)',
        color: 'var(--color, inherit)',
        boxShadow: 'var(--card-box-shadow)',
      }}
    >
      <ProfileHeaderSection 
        profile={profile}
      />
      <div className="flex flex-col lg:flex-row gap-6">
        <BasicInfoSection 
          formData={formData}
          fieldErrors={fieldErrors}
          handleChange={handleChange}
          isEditing={isEditing}
        />
        <AdditionalDetailsSection profile={profile} />
        <PreferencesSection 
          profile={profile}
          mode={mode}
          toggleTheme={toggleTheme}
        />
      </div>
    </div>
  );
});

export default ProfileMain;
