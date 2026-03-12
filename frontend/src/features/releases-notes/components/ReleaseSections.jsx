import { Divider, Empty, Space } from "antd";
import ReleaseSection from "@features/releases-notes/components/ReleaseSection";

const ReleaseSections = ({ sections }) => {
  if (!Array.isArray(sections) || sections.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No hay secciones registradas en esta nota"
      />
    );
  }

  return (
    <Space
      direction="vertical"
      size={0}
      split={<Divider />}
      rootClassName="w-full">
      {sections?.map((section) => (
        <ReleaseSection
          key={section.id}
          section={section}
        />
      ))}
    </Space>
  );
};

export default ReleaseSections;
