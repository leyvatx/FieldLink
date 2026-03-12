import { memo } from "react";
import { Table } from "antd";
import TableLoadingSection from "./sections/TableLoadingSection";

const RolesPermissionsTable = memo(({ 
  columns, 
  dataSource = [], 
  isToggling = false, 
  isLoading = false,
  handleRowExpand, 
  expandedRowKeys = new Set() 
}) => {
  if (isLoading) {
    return <TableLoadingSection />;
  }

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      loading={!!isToggling}
      pagination={false}
      scroll={{ x: 'max-content', y: 'calc(100vh - 226px)' }}
      tableLayout="fixed"
      size="default"
      bordered
      onRow={(record) => ({
        onClick: () => handleRowExpand?.(record),
        className: "align-top",
      })}
      expandable={{
        expandedRowKeys: Array.from(expandedRowKeys),
        onExpand: (expanded, record) => handleRowExpand?.(record),
      }}
      rowKey="key"
    />
  );
});
RolesPermissionsTable.displayName = 'RolesPermissionsTable';

export default RolesPermissionsTable;
