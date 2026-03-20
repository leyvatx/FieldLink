import { lazy, useCallback } from "react";
import {
  PiEyeFill,
  PiPencilSimpleFill,
  PiTrashSimpleFill,
} from "react-icons/pi";
import { useDialog } from "@context/DialogProvider";
import useSuspense from "@hooks/useSuspense";

const UserDetailsForm = lazy(() =>
  import("@features/users/components/UserDetailsForm")
);
const EditUserForm = lazy(() =>
  import("@features/users/components/EditUserForm")
);
const DeleteUserForm = lazy(() =>
  import("@features/users/components/DeleteUserForm")
);

const useUsersContextMenu = () => {
  const { openContextMenu, openModal } = useDialog();
  const suspense = useSuspense();

  const handleContextMenu = useCallback(
    (e, record) => {
      e.preventDefault();

      const items = [
        {
          label: "Ver detalles",
          icon: <PiEyeFill size={16} />,
          onClick: () => {
            openModal({
              title: "Detalles del usuario",
              content: suspense(<UserDetailsForm id={record.id} />),
              width: 640,
            });
          },
        },
        {
          label: "Editar",
          icon: <PiPencilSimpleFill size={16} />,
          onClick: () =>
            openModal({
              title: "Editar usuario",
              content: suspense(<EditUserForm id={record.id} />),
              width: 720,
            }),
        },
        {
          label: "Eliminar",
          icon: <PiTrashSimpleFill size={16} />,
          onClick: () =>
            openModal({
              title: "Eliminar usuario",
              content: suspense(<DeleteUserForm id={record.id} />),
              closable: true,
              maskClosable: false,
            }),
          danger: true,
        },
      ];

      openContextMenu({
        event: e,
        items,
      });
    },
    [openContextMenu, openModal, suspense]
  );

  return handleContextMenu;
};

export default useUsersContextMenu;
