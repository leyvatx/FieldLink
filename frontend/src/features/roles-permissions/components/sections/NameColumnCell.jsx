import { useMemo, useCallback, memo } from "react";
import { Button, Dropdown, Row, Col, Typography, Space} from "antd";
import { PiPencilSimple, PiTrashSimple, PiDotsThreeVertical } from "react-icons/pi";

const { Text } = Typography;

const NameColumnCell = memo(({ record, onEdit, onDelete, canSeeBoth }) => {
  const handleEdit = useCallback(() => onEdit(record.perm), [onEdit, record.perm]);
  const handleDelete = useCallback(() => onDelete(record.perm), [onDelete, record.perm]);

  const menuItems = useMemo(() => [
    { key: 'edit', icon: <PiPencilSimple />, label: 'Editar' },
    { key: 'delete', icon: <PiTrashSimple />, label: 'Eliminar', danger: true },
  ], []);

  const handleMenuClick = useCallback((info) => {
    if (info?.key === 'edit') handleEdit();
    if (info?.key === 'delete') handleDelete();
  }, [handleEdit, handleDelete]);

  if (record.isModule) {
    return <Text strong style={{ pointerEvents: 'auto' }}>{record.name}</Text>;
  }

  if (record.isSubmodule) {
    return <Text style={{ fontWeight: 600, marginLeft: 12, pointerEvents: 'auto' }}>{record.name}</Text>;
  }

  return (
    <Row align="middle" justify="space-between" style={{ marginLeft: 24, pointerEvents: 'auto' }}>
      <Col flex="auto">
        <Space direction="vertical" size={0}>
          {record.perm?.description && (
            <Text strong style={{ fontSize: 13, maxWidth: 420, display: 'block' }} ellipsis={{ tooltip: false }}>
              {record.perm.description}
            </Text>
          )}
          {canSeeBoth && (
            <>
              {record.perm?.name && (
                <Text type="secondary" style={{ fontSize: 12 }}>{record.perm.name}</Text>
              )}
              {record.name && record.perm?.name && record.perm.name !== record.name && (
                <Text type="secondary" style={{ fontSize: 11 }}>{record.name}</Text>
              )}
            </>
          )}
        </Space>
      </Col>
      <Col>
        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={["click"]} placement="bottomRight">
          <Button type="text" icon={<PiDotsThreeVertical />} size="small" />
        </Dropdown>
      </Col>
    </Row>
  );
});

NameColumnCell.displayName = 'NameColumnCell';

export default NameColumnCell;