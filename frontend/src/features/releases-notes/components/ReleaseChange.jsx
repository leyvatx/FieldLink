import { Image, Space, Tag } from "antd";
import ReleaseChangeTypeTag from "@features/releases-notes/components/ReleaseChangeTypeTag";

const ReleaseChangeDetails = ({ change }) => {
  return (
    <Space
      direction="vertical"
      rootClassName="w-full">
      <span className="font-bold">{change.title}</span>
      <div className="flex flex-wrap gap-2">
        <ReleaseChangeTypeTag type={change.type} />
        {change?.submodules?.map((submodule) => (
          <Tag key={submodule.id}>{submodule.name}</Tag>
        ))}
      </div>
      <p>{change.description}</p>
      <div className="grid grid-cols-1 gap-3">
        {change?.files?.map((file) => (
          <Image
            key={file.id}
            src={file.url}
            preview={{
              toolbarRender: () => null,
            }}
            className="rounded-xl shadow-lg"
          />
        ))}
      </div>
    </Space>
  );
};

export default ReleaseChangeDetails;
