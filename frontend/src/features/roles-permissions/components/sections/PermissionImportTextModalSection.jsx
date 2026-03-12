import CopyableImportText from "@features/roles-permissions/components/CopyableImportText";

const PermissionImportTextModalSection = ({ permission }) => {
  const text = permission
    ? `${permission?.name ?? ""},${permission?.description ?? ""},${
        permission?.module?.name ?? ""
      },${permission?.submodule?.name ?? ""}`
    : null;

  return <CopyableImportText text={text} />;
};

export default PermissionImportTextModalSection;
