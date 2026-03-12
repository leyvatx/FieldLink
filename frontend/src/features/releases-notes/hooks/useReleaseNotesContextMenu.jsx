import { lazy, useCallback } from "react";
import { useDialog } from "@context/DialogProvider";
import {
  PiArchiveFill,
  PiCheckCircleFill,
  PiEraserFill,
  PiEyeFill,
  PiPencilSimpleFill,
  PiRowsPlusBottomFill,
  PiTrashFill,
} from "react-icons/pi";
import { Link } from "react-router-dom";
import useSuspense from "@hooks/useSuspense";

// Lazy imports
const CreateReleaseSectionForm = lazy(() =>
  import("@features/releases-notes/components/CreateReleaseSectionForm")
);
const UpdateReleaseNoteStatusConfirm = lazy(() =>
  import("@features/releases-notes/components/UpdateReleaseNoteStatusConfirm")
);
const DeleteReleaseNoteConfirm = lazy(() =>
  import("@features/releases-notes/components/DeleteReleaseNoteConfirm")
);

const useReleaseNotesContextMenu = () => {
  const { openContextMenu, openDrawer, openModal } = useDialog();
  const suspense = useSuspense();

  const openReleaseNotesContextMenu = useCallback(
    (e, record) =>
      openContextMenu({
        event: e,
        items: [
          {
            label: "Agregar sección de cambios",
            icon: <PiRowsPlusBottomFill size={16} />,
            onClick: () => {
              openDrawer({
                title: "Agregar sección de cambios",
                content: suspense(<CreateReleaseSectionForm id={record.id} />),
                width: 800,
              });
            },
          },
          {
            label: (
              <Link to={`/release-notes/${record.id}/view`}>Ver detalles</Link>
            ),
            icon: <PiEyeFill size={16} />,
          },
          {
            label: <Link to={`/release-notes/${record.id}/edit`}>Editar</Link>,
            icon: <PiPencilSimpleFill size={16} />,
          },
          ...(record.status !== "published"
            ? [
                {
                  label: "Publicar",
                  icon: <PiCheckCircleFill size={16} />,
                  onClick: () =>
                    openModal({
                      title: "Publicar nota",
                      content: suspense(
                        <UpdateReleaseNoteStatusConfirm
                          releaseNote={record}
                          status="published"
                        />
                      ),
                    }),
                },
              ]
            : []),
          ...(record.status !== "draft"
            ? [
                {
                  label: "Marcar como borrador",
                  icon: <PiEraserFill size={16} />,
                  onClick: () =>
                    openModal({
                      title: "Marcar como borrador",
                      content: suspense(
                        <UpdateReleaseNoteStatusConfirm
                          releaseNote={record}
                          status="draft"
                        />
                      ),
                    }),
                },
              ]
            : []),
          ...(record.status !== "archived"
            ? [
                {
                  label: "Archivar",
                  icon: <PiArchiveFill size={16} />,
                  onClick: () =>
                    openModal({
                      title: "Archivar nota",
                      content: suspense(
                        <UpdateReleaseNoteStatusConfirm
                          releaseNote={record}
                          status="archived"
                        />
                      ),
                    }),
                },
              ]
            : []),
          {
            label: "Eliminar",
            icon: <PiTrashFill size={16} />,
            onClick: () =>
              openModal({
                title: "Publicar nota",
                content: suspense(
                  <DeleteReleaseNoteConfirm
                    releaseNote={record}
                    status="published"
                  />
                ),
              }),
            danger: true,
          },
        ],
      }),
    [openContextMenu, openDrawer, openModal, suspense]
  );

  return openReleaseNotesContextMenu;
};

export default useReleaseNotesContextMenu;
