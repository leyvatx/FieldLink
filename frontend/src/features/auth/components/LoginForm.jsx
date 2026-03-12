import { Button, Form, Input } from "antd";
import useLogin from "@features/auth/hooks/useLogin";
import formatErrors from "@lib/formatErrors";

const LoginForm = () => {
  const [form] = Form.useForm();
  const loginMutation = useLogin();

  const onFinish = async (values) => {
    const { email, password } = values;
    loginMutation.mutate(
      { email, password },
      {
        onError: (error) => {
          if (error?.response?.data) {
            form.setFields(formatErrors(error.response.data));
          }
        },
      }
    );
  };

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={onFinish}
    >
      <Form.Item
        label="Correo electronico"
        name="email"
        rules={[
          {
            required: true,
            message: "Por favor ingrese su correo electronico.",
          },
          {
            type: "email",
            message: "Ingrese un correo valido.",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Contrasena"
        name="password"
        rules={[
          {
            required: true,
            message: "Por favor ingrese su contrasena.",
          },
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Button
        className="mt-3"
        type="primary"
        htmlType="submit"
        loading={loginMutation.isPending}
        block
      >
        Iniciar sesion
      </Button>
    </Form>
  );
};

export default LoginForm;
