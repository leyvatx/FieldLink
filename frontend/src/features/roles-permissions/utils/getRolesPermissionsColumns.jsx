import { capitalize } from "./rolesPermissions.utils";
import NameColumnHeader from "../components/sections/NameColumnHeaderContainer";
import RoleColumnHeader from "../components/sections/RoleColumnHeader";
import NameColumnCell from "../components/sections/NameColumnCell";
import PermissionCheckbox from "../components/PermissionCheckbox";
import { getPermissionIdsForRecord, areAllChecked, permissionIdsToUpdate } from "./permissionHelpers";

export const getRolesPermissionsColumns = ({ 
  search, 
  setSearch, 
  data, 
  onNewPermission, 
  onNewRole, 
  refreshRoles, 
  togglePermission, 
  toggleMultiplePermissions, 
  isToggling, 
  setHiddenRoles,
  hiddenRoles, 
  onEditPermission, 
  onDeletePermission, 
  canSeeBoth 
}) => {
  const safeData = data || { roles: [], permissions: [], matrix: {} };
  const getTableCellClass = (record) => {
    if (record.key === "toggle-all") return 'table-row-toggle-all';
    return record.isModule ? 'table-row-module' : 'table-row-regular';
  };

  const getTableCellStyle = (record) => ({
    zIndex: record.key === 'name' ? 10 : undefined,
    backgroundColor: record.isModule ? 'var(--table-module-hover, var(--row-hover-bg-color))' : undefined,
  });
  const createToggleAllHandler = (role) => (targetChecked) => {
    const permissionIds = targetChecked
      ? safeData.permissions.filter(perm => !safeData.matrix[role.id]?.includes(perm.id)).map(p => p.id)
      : safeData.permissions.filter(perm => safeData.matrix[role.id]?.includes(perm.id)).map(p => p.id);
    if (permissionIds.length > 0) {
      toggleMultiplePermissions(role.id, permissionIds, targetChecked);
    }
  };

  const createPermissionToggleHandler = (role, record) => (targetChecked) => {
    const permissionIds = getPermissionIdsForRecord(record);
    const toUpdate = permissionIdsToUpdate(safeData, role.id, permissionIds, targetChecked);
    if (toUpdate.length > 0) {
      if (toUpdate.length > 1) {
        toggleMultiplePermissions(role.id, toUpdate, targetChecked);
      } else {
        toUpdate.forEach(pid => togglePermission(role.id, pid));
      }
    }
  };

  return [
    {
      title: <NameColumnHeader search={search} setSearch={setSearch} onNewPermission={onNewPermission} onNewRole={onNewRole} />,
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <NameColumnCell 
          record={record}
          onEdit={onEditPermission}
          onDelete={onDeletePermission}
          canSeeBoth={canSeeBoth}
        />
      ),
      onCell: (record) => ({
        style: getTableCellStyle({ ...record, key: 'name' }),
        className: getTableCellClass(record)
      }),
      fixed: 'left',
      width: 400,
      tooltip: 'Buscar y gestionar permisos, módulos y submódulos',
    },
    ...safeData.roles
      .filter(role => !hiddenRoles.includes(role.id))
      .map((role) => ({
        title: (
          <RoleColumnHeader
            role={{ ...role, name: capitalize(role.name) }}
            refreshRoles={refreshRoles}
            setHiddenRoles={setHiddenRoles}
          />
        ),
        dataIndex: `role_${role.id}`,
        key: `role_${role.id}`,
        align: 'center',
        width: 150,
        tooltip: role.name,
        onCell: (record) => ({
          style: getTableCellStyle(record),
          className: getTableCellClass(record)
        }),
        render: (checked, record) => {
          if (record.key === "toggle-all") {
            const allChecked = areAllChecked(safeData, role.id, safeData.permissions.map(p => p.id));
            return (
              <PermissionCheckbox
                checked={allChecked}
                disabled={!!isToggling}
                onToggle={createToggleAllHandler(role)}
                roleName={role.name}
                permissionName="Todos los permisos"
              />
            );
          }

          const permissionIds = getPermissionIdsForRecord(record);
          if (permissionIds.length === 0) return null;
          const isChecked = areAllChecked(safeData, role.id, permissionIds);
          const containerStyle = record.isModule ? getTableCellStyle(record) : undefined;
          return (
            <PermissionCheckbox
              checked={isChecked}
              disabled={!!isToggling}
              containerStyle={containerStyle}
              onToggle={createPermissionToggleHandler(role, record)}
              roleName={role.name}
              permissionName={record.name}
            />
          );
        },
      }))
  ];
};
