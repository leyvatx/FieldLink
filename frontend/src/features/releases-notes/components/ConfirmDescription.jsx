import { Descriptions } from "antd";
import ReleaseNoteStatusTag from "@features/releases-notes/components/ReleaseNoteStatusTag";

const ConfirmDescription = ({ releaseNote }) => {
  const items = [
    {
      label: "Título",
      children: releaseNote?.title,
    },
    {
      label: "Versión",
      children: releaseNote?.version_number,
    },
    {
      label: "Lanzamiento",
      children: releaseNote?.release_date,
    },
    {
      label: "Estatus",
      children: <ReleaseNoteStatusTag status={releaseNote?.status} />,
    },
  ];

  return (
    <Descriptions
      items={items}
      styles={{ label: { width: 100 } }}
      size="small"
      column={1}
    />
  );
};

export default ConfirmDescription;
