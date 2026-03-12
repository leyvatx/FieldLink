import { Button, Form, Input } from "antd";
import { useDialog } from "@context/DialogProvider";
import useCreateReleaseModule from "@features/releases-notes/hooks/useCreateReleaseModule";
import formatErrors from "@lib/formatErrors";

const CreateReleaseModuleForm = () => {
  const [form] = Form.useForm();
  const { closeMultipleModal } = useDialog();
  const { mutate: createReleaseModule, isPending: creatingReleaseModule } =
    useCreateReleaseModule();

  const onFinish = (values) => {
    createReleaseModule(values, {
      onSuccess: () => {
        closeMultipleModal("create-module");
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
      <div className="flex justify-end">
        <Button
          type="primary"
          htmlType="submit"
          loading={creatingReleaseModule}>
          Guardar
        </Button>
      </div>
    </Form>
  );
};

export default CreateReleaseModuleForm;
