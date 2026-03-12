import { Button, Divider } from "antd";
import BaseSelect from "@components/BaseSelect";
import { useDialog } from "@context/DialogProvider";
import useReleaseSubmodulesOptions from "@features/releases-notes/hooks/useReleaseSubmodulesOptions";
import CreateReleaseSubmoduleForm from "@features/releases-notes/components/CreateReleaseSubmoduleForm";

const ReleaseSubmoduleSelect = ({
  query = null,
  allowCreate = true,
  ...props
}) => {
  const { openMultipleModal } = useDialog();
  const submodulesQuery = useReleaseSubmodulesOptions({ enabled: !query });

  const data = query?.data ?? submodulesQuery?.data ?? [];
  const loading = query?.isLoading ?? submodulesQuery?.isLoading ?? false;

  return (
    <BaseSelect
      {...props}
      options={
        data?.map((submodule) => ({
          value: submodule.id,
          label: `${submodule.name} (${submodule.module_name})`,
        })) ?? []
      }
      loading={loading ?? false}
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
                  openMultipleModal("create-submodule", {
                    title: "Nuevo submódulo",
                    content: <CreateReleaseSubmoduleForm />,
                  })
                }>
                Nuevo submódulo
              </Button>
            </>
          )}
        </>
      )}
    />
  );
};

export default ReleaseSubmoduleSelect;
