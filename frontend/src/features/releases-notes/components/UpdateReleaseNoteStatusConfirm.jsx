import { Divider, Spin, Button } from "antd";
import { useDialog } from "@context/DialogProvider";
import useUpdateReleaseNoteStatus from "@features/releases-notes/hooks/useUpdateReleaseNoteStatus";
import ConfirmDescription from "@features/releases-notes/components/ConfirmDescription";

const UpdateReleaseNoteStatusConfirm = ({ releaseNote, status }) => {
  const {
    mutate: updateReleaseNoteStatus,
    isPending: updatingReleaseNoteStatus,
  } = useUpdateReleaseNoteStatus();
  const { closeModal } = useDialog();

  const statusTexts = {
    published: "publicar",
    archived: "archivar",
    draft: "marcar como borrador",
  };

  const text = statusTexts[status];

  if (!text) {
    return (
      <div className="flex flex-col gap-4">
        <p>Estatus no reconocido</p>
        <div className="flex justify-end gap-3">
          <Button
            color="default"
            variant="filled"
            onClick={closeModal}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdate = () => {
    updateReleaseNoteStatus(
      {
        id: releaseNote.id,
        status: status,
      },
      {
        onSuccess: closeModal,
      }
    );
  };

  return (
    <Spin spinning={updatingReleaseNoteStatus}>
      <div className="flex flex-col gap-4">
        <div>
          <p>
            ¿Estás seguro de que deseas {text} la siguiente nota de versión?
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
            onClick={() => handleUpdate()}>
            Aceptar
          </Button>
        </div>
      </div>
    </Spin>
  );
};

export default UpdateReleaseNoteStatusConfirm;
