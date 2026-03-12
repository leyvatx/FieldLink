import { Spin } from "antd";
import usePermissionsImportText from "@features/roles-permissions/hooks/usePermissionsImportText";
import CopyableImportText from "@features/roles-permissions/components/CopyableImportText";

const PermissionsImportText = () => {
  const { data, isFetching } = usePermissionsImportText();

  return (
    <Spin spinning={isFetching}>
      <CopyableImportText text={data} />
    </Spin>
  );
};

export default PermissionsImportText;
