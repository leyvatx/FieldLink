import { useMemo } from "react";
import { Table, Tag } from "@/lib/antd-compat";
import useUsers from "@features/users/hooks/useUsers";
import useUsersContextMenu from "@features/users/hooks/useUsersContextMenu";
import { ROLE_COLORS, ROLE_LABELS } from "@utils/constants/roles";
import { matchesText } from "@/lib/filtering";

const UsersTable = ({ filters }) => {
  const { data: users, isLoading } = useUsers({
    role: filters?.role || undefined,
    isActive: filters?.isActive,
  });
  const handleContextMenu = useUsersContextMenu();

  const filteredUsers = useMemo(() => {
    return (users || []).filter((record) => {
      if (!matchesText(record.name, filters?.name)) {
        return false;
      }
      if (!matchesText(record.email, filters?.email)) {
        return false;
      }
      return matchesText(record.phone, filters?.phone);
    });
  }, [filters?.email, filters?.name, filters?.phone, users]);

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
      title: "Teléfono",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => phone || "-",
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={ROLE_COLORS[role] || "default"}>
          {ROLE_LABELS[role] || role || "N/A"}
        </Tag>
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
      dataSource={filteredUsers}
      columns={columns}
      loading={isLoading}
      size="small"
      rowKey="id"
      onRow={(record) => ({
        onContextMenu: (event) => handleContextMenu(event, record),
      })}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} registros`,
      }}
    />
  );
};

export default UsersTable;
