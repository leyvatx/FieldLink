import { Descriptions, Tag } from "@/lib/antd-compat";
import Loader from "@components/Loader";
import dayjs from "dayjs";
import useUser from "@features/users/hooks/useUser";
import { ROLE_LABELS } from "@utils/constants/roles";

const UserDetailsForm = ({ id }) => {
  const { data: user, isLoading: loadingUser } = useUser(id);

  const items = [
    {
      label: "Estado",
      children: user?.is_active ? (
        <Tag color="success">Activo</Tag>
      ) : (
        <Tag color="error">Inactivo</Tag>
      ),
    },
    {
      label: "Nombre",
      children: user?.name,
    },
    {
      label: "Correo electrónico",
      children: user?.email,
    },
    {
      label: "Teléfono",
      children: user?.phone || "-",
    },
    {
      label: "Rol",
      children: <Tag>{ROLE_LABELS[user?.role] || user?.role || "N/A"}</Tag>,
    },
    {
      label: "Fecha de creación",
      children: user?.created_at
        ? dayjs(user.created_at).isValid()
          ? dayjs(user.created_at).format("DD/MM/YYYY")
          : "Fecha inválida"
        : "Sin fecha",
    },
    {
      label: "Fecha de actualización",
      children: user?.updated_at
        ? dayjs(user.updated_at).isValid()
          ? dayjs(user.updated_at).format("DD/MM/YYYY")
          : "Fecha inválida"
        : "Sin fecha",
    },
  ];

  if (loadingUser) {
    return <Loader />;
  }

  return (
    <Descriptions
      layout="vertical"
      column={1}
      items={items}
    />
  );
};

export default UserDetailsForm;
