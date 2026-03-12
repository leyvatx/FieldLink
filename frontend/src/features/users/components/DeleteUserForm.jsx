import { Button, Typography } from "antd";
import { useDialog } from "@context/DialogProvider";
import { useMessage } from "@context/MessageProvider";
import useUser from "@features/users/hooks/useUser";
import useDeleteUser from "@features/users/hooks/useDeleteUser";
import Loader from "@components/Loader";
import { useState } from "react";

const DeleteUserForm = ({ id, onClose }) => {
  const userQuery = useUser(id);
  const deleteUserMutation = useDeleteUser();
  const { closeModal } = useDialog();
  const { success, error } = useMessage();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    else closeModal();
  };

  const deleteUser = () => {
    setIsDeleting(true);
    deleteUserMutation.mutate(
      { id },
      {
        onSuccess: () => {
          setIsDeleting(false);
          success("Usuario eliminado exitosamente");
          setTimeout(() => {
            handleClose();
          }, 100);
        },
        onError: (err) => {
          setIsDeleting(false);
          console.error("Error al eliminar usuario:", err);
          error("Error al eliminar el usuario");
          deleteUserMutation.reset();
        },
      }
    );
  };

  if (userQuery.isLoading) {
    return <Loader />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p>
        Estas seguro de querer eliminar el usuario{" "}
        <span style={{ fontWeight: 600 }}>{userQuery.data.name}</span>?
      </p>
      <Typography.Paragraph type="secondary">
        Esta accion no se puede deshacer.
      </Typography.Paragraph>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button
          onClick={handleClose}
          disabled={isDeleting || deleteUserMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          danger
          type="default"
          onClick={deleteUser}
          loading={isDeleting || deleteUserMutation.isPending}
          disabled={isDeleting || deleteUserMutation.isPending}
        >
          Eliminar usuario
        </Button>
      </div>
    </div>
  );
};

export default DeleteUserForm;
