import { memo } from "react";
import { Input, Button, Dropdown } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { PiPlusBold } from "react-icons/pi";

const NameColumnHeader = memo(({
  value,
  onChange,
  onPressEnter,
  onNewPermission,
  onNewRole,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Input
        placeholder="Buscar permiso, módulo o submódulo"
        prefix={<SearchOutlined />}
        value={value}
        onChange={onChange}
        onPressEnter={onPressEnter}
        allowClear
        size="default"
        style={{ minWidth: 180 }}
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
