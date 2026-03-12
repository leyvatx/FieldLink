import { Space } from "antd";
import ReleaseChanges from "@features/releases-notes/components/ReleaseChanges";

const ReleaseSection = ({ section }) => {
  return (
    <Space
      direction="vertical"
      size="middle"
      rootClassName="w-full">
      <h2 className="font-bold text-lg">{section.title}</h2>
      <ReleaseChanges changes={section?.changes} />
    </Space>
  );
};

export default ReleaseSection;
