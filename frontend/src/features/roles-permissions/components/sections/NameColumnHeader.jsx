import { memo } from "react";
import { Input, Button, Dropdown } from "@/lib/antd-compat";
import { PiMagnifyingGlassBold, PiPlusBold } from "react-icons/pi";

const NameColumnHeader = memo(({
  value,
  onChange,
  onPressEnter,
  onNewPermission,
  onNewRole,
}) => {
  return (
    <div className="flex min-w-[16rem] items-center gap-2">
      <Input
        placeholder="Buscar permiso, módulo o submódulo"
        prefix={<PiMagnifyingGlassBold />}
        value={value}
        onChange={onChange}
        onPressEnter={onPressEnter}
        allowClear
        size="default"
        className="min-w-0 flex-1"
      />
      <Dropdown
        menu={{
          items: [
            { key: 'permission', label: 'Nuevo Permiso' },
            { key: 'role', label: 'Nuevo Rol' },
          ],
          onClick: (info) => {
            if (info?.key === 'permission') onNewPermission();
            if (info?.key === 'role') onNewRole();
          }
        }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <Button type="primary" icon={<PiPlusBold />} title="Nuevo" />
      </Dropdown>
    </div>
  );
});

export default NameColumnHeader;
