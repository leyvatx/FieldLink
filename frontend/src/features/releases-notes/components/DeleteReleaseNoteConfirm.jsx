import { Button, Divider, Spin } from "antd";
import { useDialog } from "@context/DialogProvider";
import useDeleteReleaseNote from "@features/releases-notes/hooks/useDeleteReleaseNote";
import ConfirmDescription from "@features/releases-notes/components/ConfirmDescription";

const DeleteReleaseNoteConfirmation = ({ releaseNote }) => {
  const { closeModal } = useDialog();
  const { mutate: deleteReleaseNote, isPending: deletingReleaseNote } =
    useDeleteReleaseNote();

  const handleDelete = () => {
    deleteReleaseNote(releaseNote.id, {
      onSuccess: closeModal,
    });
  };

  return (
    <Spin spinning={deletingReleaseNote}>
      <div className="flex flex-col gap-4">
        <div>
          <p>
            ¿Estás seguro de que quieres eliminar la siguiente nota de versión?
          </p>
          <Divider />
          <ConfirmDescription releaseNote={releaseNote} />
        </div>
        <div className="flex justify-end gap-3">
          <Button
            color="default"
            variant="filled"
            onClick={closeModal}>
            Cancelar
          </Button>
          <Button
            type="primary"
            danger
            onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </div>
    </Spin>
  );
};

export default DeleteReleaseNoteConfirmation;
