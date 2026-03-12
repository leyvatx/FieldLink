import { Button, Form, Input } from "antd";
import { useDialog } from "@context/DialogProvider";
import ReleaseModuleSelect from "@features/releases-notes/components/ReleaseModuleSelect";
import useCreateReleaseSubmodule from "@features/releases-notes/hooks/useCreateReleaseSubmodule";
import formatErrors from "@lib/formatErrors";

const CreateReleaseSubmoduleForm = () => {
  const [form] = Form.useForm();
  const { closeMultipleModal } = useDialog();
  const {
    mutate: createReleaseSubmodule,
    isPending: creatingReleaseSubmodule,
  } = useCreateReleaseSubmodule();

  const onFinish = (values) => {
    createReleaseSubmodule(values, {
      onSuccess: () => {
        closeMultipleModal("create-submodule");
      },
      onError: (err) => {
        if (err?.response?.data?.errors) {
          const formattedErrors = formatErrors(err.response.data.errors);
          form.setFields(formattedErrors);
        }
      },
    });
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      layout="vertical">
      <Form.Item
        label="Nombre"
        name="name"
        rules={[{ required: true, message: "Este campo es requerido" }]}>
        <Input />
      </Form.Item>
      <Form.Item
        label="Módulo"
        name="release_module_id"
        rules={[{ required: true, message: "Este campo es requerido" }]}>
        <ReleaseModuleSelect />
      </Form.Item>
      <div className="flex justify-end">
        <Button
          type="primary"
          htmlType="submit"
          loading={creatingReleaseSubmodule}>
          Guardar
        </Button>
      </div>
    </Form>
  );
};

export default CreateReleaseSubmoduleForm;
