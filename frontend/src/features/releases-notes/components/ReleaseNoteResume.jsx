import { Descriptions } from "antd";
import ReleaseNoteStatusTag from "@features/releases-notes/components/ReleaseNoteStatusTag";

const ReleaseNoteResume = ({ releaseNote, showAdminInfo = false }) => {
  if (showAdminInfo) {
    const items = [
      {
        label: "Título",
        children: releaseNote?.title,
      },
      {
        label: "Resumen",
        children: releaseNote?.summary,
      },
      {
        label: "Proyecto",
        children: releaseNote?.project?.name,
      },
      {
        label: "Número de versión",
        children: releaseNote?.version_number,
      },
      {
        label: "Fecha de lanzamiento",
        children: releaseNote?.release_date,
      },
      {
        label: "Estado",
        children: <ReleaseNoteStatusTag status={releaseNote?.status} />,
      },
    ];

    return (
      <Descriptions
        column={1}
        styles={{ label: { width: 160 } }}
        items={items}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-bold">
        Novedades de la versión {releaseNote?.version_number}
      </h2>
      <span className="text-base font-semibold text-neutral-500 dark:text-neutral-400">
        Fecha de lanzamiento: {releaseNote?.release_date}
      </span>
    </div>
  );
};

export default ReleaseNoteResume;
