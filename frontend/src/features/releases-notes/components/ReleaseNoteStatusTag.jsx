import { Tag } from "antd";

const ReleaseNoteStatusTag = ({ status }) => {
  const statusTags = {
    draft: {
      color: "gold",
      text: "Borrador",
    },
    published: {
      color: "green",
      text: "Publicada",
    },
    archived: {
      color: "red",
      text: "Archivada",
    },
  };

  const tag = statusTags[status];

  return (
    <Tag color={tag?.color ?? "default"}>{tag?.text ?? "Desconocido"}</Tag>
  );
};

export default ReleaseNoteStatusTag;
