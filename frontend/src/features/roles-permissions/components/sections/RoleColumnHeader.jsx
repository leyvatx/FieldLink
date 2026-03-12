import { memo } from "react";
import { Button, Dropdown } from "antd";
import { PiDotsThreeVertical, PiPencilSimple, PiEyeSlash, PiTrash } from "react-icons/pi";
import useRoleActions from "../../hooks/useRoleActions.jsx";

const RoleColumnHeader = memo(({
  role,
  refreshRoles,
  setHiddenRoles,
}) => {
  const { handleMenuClick } = useRoleActions(role, null, refreshRoles, setHiddenRoles);
  
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {role.name}
        <Dropdown
          menu={{
            items: [
              { key: 'edit', icon: <PiPencilSimple />, label: 'Cambiar nombre' },
              { key: 'hide', icon: <PiEyeSlash />, label: 'Ocultar' },
              { key: 'delete', icon: <PiTrash />, label: 'Eliminar', danger: true },
            ],
            onClick: handleMenuClick,
          }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button type="text" icon={<PiDotsThreeVertical />} size="small" />
        </Dropdown>
      </div>
    </>
  );
});

RoleColumnHeader.displayName = 'RoleColumnHeader';

export default RoleColumnHeader;
