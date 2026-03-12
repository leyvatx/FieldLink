import { Table, Tag } from "antd";
import useUsers from "@features/users/hooks/useUsers";
import useUsersContextMenu from "@features/users/hooks/useUsersContextMenu";

const ROLE_COLORS = {
  OWNER: "purple",
  DISPATCHER: "blue",
  TECHNICIAN: "green",
};

const UsersTable = () => {
  const { data: users, isLoading } = useUsers();
  const handleContextMenu = useUsersContextMenu();

  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Telefono",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => phone || "-",
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={ROLE_COLORS[role] || "default"}>{role || "N/A"}</Tag>
      ),
    },
    {
      title: "Estado",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive) =>
        isActive ? <Tag color="success">Activo</Tag> : <Tag color="error">Inactivo</Tag>,
    },
  ];

  return (
    <Table
      dataSource={users}
      columns={columns}
      loading={isLoading}
      size="small"
      rowKey="id"
      onRow={(record) => ({
        onContextMenu: (e) => handleContextMenu(e, record),
      })}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} usuarios`,
      }}
    />
  );
};

export default UsersTable;
