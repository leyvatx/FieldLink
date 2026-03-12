import { Button, Typography } from "antd";
import { useDialog } from "@context/DialogProvider";
import { useMessage } from "@context/MessageProvider";
import { useQueryClient } from "@tanstack/react-query";
import { restoreUser } from "@api/userService";
import { useState } from "react";

const RestoreUserForm = ({ id, onClose }) => {
  const { closeModal } = useDialog();
  const { success, error } = useMessage();
  const queryClient = useQueryClient();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    else closeModal();
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreUser(id);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      success("Usuario restaurado exitosamente y está nuevamente activo");
      handleClose();
    } catch (err) {
      console.error("Error al restaurar usuario:", err);
      error("Error al restaurar el usuario archivado");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div>
      <Typography.Paragraph>
        ¿Estás seguro de que deseas restaurar este usuario archivado? 
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        El usuario volverá a estar activo en el sistema y podrá acceder normalmente.
      </Typography.Paragraph>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button type="primary" onClick={handleRestore} loading={isRestoring}>
          Restaurar Usuario
        </Button>
      </div>
    </div>
  );
};

export default RestoreUserForm;