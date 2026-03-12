import { useState } from "react";
import { Table, Tag } from "antd";
import useReleaseNotesPagination from "@features/releases-notes/hooks/useReleaseNotesPagination";
import useReleaseNotesContextMenu from "@features/releases-notes/hooks/useReleaseNotesContextMenu";
import ReleaseNoteStatusTag from "@features/releases-notes/components/ReleaseNoteStatusTag";

const columns = [
  {
    title: "Proyecto",
    dataIndex: "project_name",
    key: "project_name",
  },
  {
    title: "Versión",
    dataIndex: "version_number",
    key: "version_number",
  },
  {
    title: "Fecha de liberación",
    dataIndex: "release_date",
    key: "release_date",
  },
  {
    title: "Estatus",
    dataIndex: "status",
    key: "status",
    render: (status) => <ReleaseNoteStatusTag status={status} />,
  },
  {
    title: "Creado por",
    dataIndex: "created_by",
    key: "created_by",
  },
];

const ReleaseNotesTable = ({ filters }) => {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
  });

  const openReleaseNotesContextMenu = useReleaseNotesContextMenu();

  const { data: releaseNotes, isLoading: loadingReleaseNotes } =
    useReleaseNotesPagination({
      params: { ...filters, ...pagination },
    });

  const onTableRow = (record) => ({
    onContextMenu: (e) => openReleaseNotesContextMenu(e, record),
  });

  const onTableChange = (pagination) => {
    setPagination({
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const tablePagination = {
    page: pagination?.page ?? 1,
    pageSize: pagination?.pageSize ?? 50,
    total: releaseNotes?.total ?? 0,
    showSizeChanger: false,
    showTotal: (total, range) =>
      `Mostrando registros ${range[0]} a ${range[1]} de ${total}`,
  };

  return (
    <Table
      rowKey="id"
      dataSource={releaseNotes?.data ?? []}
      columns={columns}
      size="small"
      onChange={onTableChange}
      pagination={tablePagination}
      loading={loadingReleaseNotes}
      onRow={onTableRow}
    />
  );
};

export default ReleaseNotesTable;
