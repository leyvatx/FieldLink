import { Button, Form, Input, Spin } from "antd";
import { useDialog } from "@context/DialogProvider";
import useCreateProject from "@features/releases-notes/hooks/useCreateProject";
import formatErrors from "@lib/formatErrors";
const { TextArea } = Input;

const CreateProjectForm = () => {
  const [form] = Form.useForm();
  const { closeModal } = useDialog();
  const { mutate: createProject, isPending: creatingProject } =
    useCreateProject();

  const onFinish = (values) => {
    createProject(values, {
      onSuccess: closeModal,
      onError: (err) => {
        if (err?.response?.data?.errors) {
          const formattedErrors = formatErrors(err.response.data.errors);
          form.setFields(formattedErrors);
        }
      },
    });
  };

  return (
    <Spin spinning={creatingProject}>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          label="Nombre"
          name="name"
          rules={[{ required: true, message: "Este campo es obligatorio" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Código"
          name="code"
          rules={[{ required: true, message: "Este campo es obligatorio" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Descripción" name="description">
          <TextArea />
        </Form.Item>
        <div className="flex justify-end gap-3">
          <Button color="default" variant="filled" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit">
            Crear
          </Button>
        </div>
      </Form>
    </Spin>
  );
};

export default CreateProjectForm;
