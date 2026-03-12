import { Alert, Button } from "antd";
import { useDialog } from "@context/DialogProvider";
import CreateProjectForm from "@features/releases-notes/components/CreateProjectForm";

const CreateProjectAlert = () => {
  const { openModal } = useDialog();

  return (
    <Alert
      message="No se encontraron proyectos"
      showIcon
      description="Necesitas crear al menos un proyecto antes de registrar una nota"
      action={
        <Button
          type="primary"
          onClick={() =>
            openModal({
              title: "Nuevo proyecto",
              content: <CreateProjectForm />,
            })
          }>
          Crear proyecto
        </Button>
      }
    />
  );
};

export default CreateProjectAlert;
