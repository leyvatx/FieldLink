import { useMemo } from "react";
import { Button, Dropdown, Table, Tag } from "@/lib/antd-compat";
import { PiDotsThreeVertical } from "react-icons/pi";
import useUsers from "@features/users/hooks/useUsers";
import useUsersContextMenu from "@features/users/hooks/useUsersContextMenu";
import { ROLE_COLORS, ROLE_LABELS } from "@utils/constants/roles";
import { matchesText } from "@/lib/filtering";

const UsersTable = ({ filters }) => {
  const { data: users, isLoading } = useUsers({
    role: filters?.role || undefined,
    isActive: filters?.isActive,
  });
  const { handleContextMenu, getMenuItems } = useUsersContextMenu();

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
      title: "Usuario",
      key: "identity",
      width: 320,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="font-semibold text-[var(--ui-foreground)]">{record.name}</div>
          <div className="text-sm ui-text-muted">{record.email}</div>
        </div>
      ),
    },
    {
      title: "Contacto",
      key: "contact",
      width: 200,
      render: (_, record) => (
        <span className="text-sm text-[var(--ui-foreground)]">{record.phone || "-"}</span>
      ),
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      width: 160,
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
      width: 140,
      render: (isActive) =>
        isActive ? <Tag color="success">Activo</Tag> : <Tag color="error">Inactivo</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 72,
      align: "right",
      render: (_, record) => (
        <Dropdown menu={{ items: getMenuItems(record) }} placement="bottomRight">
          <Button
            type="text"
            size="small"
            icon={<PiDotsThreeVertical size={16} />}
            aria-label={`Acciones de ${record.name}`}
          />
        </Dropdown>
      ),
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
      scroll={{ x: 820 }}
    />
  );
};

export default UsersTable;
