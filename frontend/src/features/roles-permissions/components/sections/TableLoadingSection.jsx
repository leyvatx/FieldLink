import { memo } from "react";
import { Skeleton, Card, Table } from "antd";

/**
 * Componente de carga para la sección de la tabla de roles y permiso
 */
const TableLoadingSection = memo(() => {
  const skeletonColumns = [
    {
      title: <Skeleton.Input active style={{ width: 200, height: 24 }} />,
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: () => <Skeleton.Input active style={{ width: '80%', height: 24 }} />
    },
    ...Array.from({ length: 4 }, (_, i) => ({
      title: <Skeleton.Input active style={{ width: 120, height: 24 }} />,
      dataIndex: `role_${i}`,
      key: `role_${i}`,
      width: 150,
      align: 'center',
      render: () => <Skeleton.Button active style={{ width: 20, height: 20 }} />
    }))
  ];

  const skeletonData = Array.from({ length: 12 }, (_, i) => ({
    key: `skeleton_${i}`,
    name: `Skeleton ${i}`,
  }));

  return (
    <Card style={{ margin: '16px 0' }}>
      <Table
        columns={skeletonColumns}
        dataSource={skeletonData}
        pagination={false}
        scroll={{ x: 'max-content' }}
        tableLayout="fixed"
        loading={false}
        size="middle"
        showHeader={true}
        rowKey="key"
        style={{ 
          pointerEvents: 'none', 
          opacity: 0.7 
        }}
      />
    </Card>
  );
});

TableLoadingSection.displayName = 'TableLoadingSection';

export default TableLoadingSection;