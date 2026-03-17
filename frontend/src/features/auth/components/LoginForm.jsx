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
        label="Correo electrónico"
        name="email"
        rules={[
          {
            required: true,
            message: "Por favor ingrese su correo electrónico.",
          },
          {
            type: "email",
            message: "Ingrese un correo válido.",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Contraseña"
        name="password"
        rules={[
          {
            required: true,
            message: "Por favor ingrese su contraseña.",
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
        Iniciar sesión
      </Button>
    </Form>
  );
};

export default LoginForm;
