import { Button, Tooltip, Space } from "antd";
import { PiPencilSimple, PiFloppyDisk, PiX } from "react-icons/pi";
import PageLayout from "@layouts/page-layout/PageLayout";
import ProfileMain from "@features/profile/components/ProfileMain";
import useProfileActions from "../hooks/useProfileActions";

const iconSize = 20;

const ProfileContent = () => {
  const { isEditing, isSaving, handleSave, handleCancel, handleEdit, profileMainRef } = useProfileActions();

  return (
    <PageLayout
      title="Perfil de Usuario"
      topbarOptions={
        <div style={{ display: "flex", alignItems: "center", minWidth: 120, gap: 8 }}>
          {isEditing ? (
            <>
              <Space size="small" style={{ flexGrow: 1 }}>
                <Tooltip title="Cancelar edición">
                  <Button
                    danger
                    icon={<PiX size={iconSize} />}
                    onClick={handleCancel}
                  />
                </Tooltip>

                <Tooltip title="Guardar cambios">
                  <Button
                    icon={<PiFloppyDisk size={iconSize} />}
                    onClick={handleSave}
                    loading={isSaving}
                  />
                </Tooltip>
              </Space>

              <div>
                <Tooltip title="Editar perfil">
                  <Button
                    icon={<PiPencilSimple size={iconSize} />}
                    onClick={() => handleEdit()}
                    disabled={isEditing}
                  />
                </Tooltip>
              </div>
            </>
          ) : (
            <div style={{ marginLeft: "auto" }}>
              <Tooltip title="Editar perfil">
                <Button
                  icon={<PiPencilSimple size={iconSize} />}
                  onClick={handleEdit}
                />
              </Tooltip>
            </div>
          )}
        </div>
      }
    >
      <ProfileMain
        ref={profileMainRef}
        isEditing={isEditing}
      />
    </PageLayout>
  );
};

const Profile = () => <ProfileContent />;

export default Profile;
