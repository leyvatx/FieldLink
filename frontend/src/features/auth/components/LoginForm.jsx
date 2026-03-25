import { PiAtBold, PiLockKeyBold } from "react-icons/pi";
import { Alert, Button, Form, Input } from "@/lib/antd-compat";
import useLogin from "@features/auth/hooks/useLogin";
import formatErrors from "@lib/formatErrors";

const LoginForm = () => {
  const [form] = Form.useForm();
  const loginMutation = useLogin();

  const onFinish = (values) => {
    const { email, password } = values;
    form.setFields([{ name: "non_field_errors", errors: [] }]);

    loginMutation.mutate(
      { email, password },
      {
        onError: (requestError) => {
          const formErrors = requestError?.response?.data
            ? formatErrors(requestError.response.data)
            : [
                {
                  name: "non_field_errors",
                  errors: ["No se pudo iniciar sesión. Verifica tus datos."],
                },
              ];
          form.setFields(formErrors);
        },
      }
    );
  };

  return (
    <Form
      form={form}
      className="auth-form"
      layout="vertical"
      requiredMark={false}
      onFinish={onFinish}
    >
      <Form.Item noStyle shouldUpdate>
        {() => {
          const errors = form.getFieldError("non_field_errors");
          if (!errors.length) {
            return null;
          }

          return (
            <Alert
              className="mb-4"
              message={errors[0]}
              type="error"
              showIcon
            />
          );
        }}
      </Form.Item>

      <Form.Item
        label="Correo electronico"
        name="email"
        rules={[
          {
            required: true,
            message: "Por favor, ingresa tu correo electronico.",
          },
          {
            type: "email",
            message: "Ingresa un correo valido.",
          },
        ]}
      >
        <Input
          autoComplete="email"
          placeholder="nombre@empresa.com"
          prefix={<PiAtBold size={16} />}
        />
      </Form.Item>

      <Form.Item
        label="Contraseña"
        name="password"
        rules={[
          {
            required: true,
            message: "Por favor, ingresa tu contraseña.",
          },
        ]}
      >
        <Input.Password
          autoComplete="current-password"
          placeholder="Tu contraseña"
          prefix={<PiLockKeyBold size={16} />}
        />
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

      <div className="auth-form-note">
        Entra con tu cuenta activa para continuar.
      </div>
    </Form>
  );
};

export default LoginForm;
