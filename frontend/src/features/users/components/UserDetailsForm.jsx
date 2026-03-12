import { Descriptions, Tag } from "antd";
import Loader from "@components/Loader";
import dayjs from "dayjs";
import useUser from "@features/users/hooks/useUser";

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
      label: "Correo electronico",
      children: user?.email,
    },
    {
      label: "Telefono",
      children: user?.phone || "-",
    },
    {
      label: "Rol",
      children: <Tag>{user?.role || "N/A"}</Tag>,
    },
    {
      label: "Fecha de creacion",
      children: user?.created_at
        ? dayjs(user.created_at).isValid()
          ? dayjs(user.created_at).format("DD/MM/YYYY")
          : "Fecha invalida"
        : "Sin fecha",
    },
    {
      label: "Fecha de actualizacion",
      children: user?.updated_at
        ? dayjs(user.updated_at).isValid()
          ? dayjs(user.updated_at).format("DD/MM/YYYY")
          : "Fecha invalida"
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
