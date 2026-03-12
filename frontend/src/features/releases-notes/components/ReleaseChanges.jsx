import { Empty } from "antd";
import ReleaseChange from "@features/releases-notes/components/ReleaseChange";

const ReleaseChanges = ({ changes }) => {
  if (!Array.isArray(changes) || changes.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No hay cambios registrados en esta sección"
      />
    );
  }

  return (
    <ul className="list-disc list-outside ml-7 flex flex-col gap-5">
      {changes?.map((change) => (
        <li key={change.id}>
          <ReleaseChange change={change} />
        </li>
      ))}
    </ul>
  );
};

export default ReleaseChanges;
