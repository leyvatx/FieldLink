import { Button, Divider } from "antd";
import BaseSelect from "@components/BaseSelect";
import { useDialog } from "@context/DialogProvider";
import useReleaseModulesOptions from "@features/releases-notes/hooks/useReleaseModulesOptions";
import CreateReleaseModuleForm from "@features/releases-notes/components/CreateReleaseModuleForm";

const ReleaseModuleSelect = ({ allowCreate = true, ...props }) => {
  const { data, isLoading } = useReleaseModulesOptions();
  const { openMultipleModal } = useDialog();

  return (
    <BaseSelect
      {...props}
      options={
        data?.map((module) => ({
          value: module.id,
          label: module.name,
        })) ?? []
      }
      loading={isLoading}
      popupRender={(menu) => (
        <>
          {menu}
          {allowCreate && (
            <>
              <Divider size="small" />
              <Button
                type="primary"
                block
                onClick={() =>
                  openMultipleModal("create-module", {
                    title: "Nuevo módulo",
                    content: <CreateReleaseModuleForm />,
                  })
                }>
                Nuevo módulo
              </Button>
            </>
          )}
        </>
      )}
    />
  );
};

export default ReleaseModuleSelect;
