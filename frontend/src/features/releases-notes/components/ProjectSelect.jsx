import { lazy } from "react";
import { Button, Divider } from "antd";
import useProjectsOptions from "@features/releases-notes/hooks/useProjectsOptions";
import { useDialog } from "@context/DialogProvider";
import useSuspense from "@hooks/useSuspense";
import BaseSelect from "@components/BaseSelect";

const CreateProjectForm = lazy(() =>
  import("@features/releases-notes/components/CreateProjectForm")
);

const ProjectSelect = ({ query = null, allowCreate = true, ...props }) => {
  const projectsQuery = useProjectsOptions({ enabled: !query });
  const { openModal } = useDialog();
  const suspense = useSuspense();

  const data = query?.data ?? projectsQuery.data ?? [];
  const loading = query?.isLoading ?? projectsQuery.isLoading ?? false;

  return (
    <BaseSelect
      {...props}
      options={data.map((project) => ({
        label: `${project.name} (${project.code})`,
        value: project.id,
      }))}
      loading={loading}
      popupRender={(menu) => (
        <>
          {menu}
          {allowCreate && (
            <>
              <Divider size="small" />{" "}
              <Button
                type="primary"
                block
                onClick={() =>
                  openModal({
                    title: "Nuevo proyecto",
                    content: suspense(<CreateProjectForm />),
                  })
                }>
                Nuevo proyecto
              </Button>
            </>
          )}
        </>
      )}
    />
  );
};

export default ProjectSelect;
