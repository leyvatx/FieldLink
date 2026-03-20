import { Alert, Button, Form, Input } from "@/lib/antd-compat";
import { useMessage } from "@context/MessageProvider";
import useRegister from "@features/auth/hooks/useRegister";
import formatErrors from "@lib/formatErrors";

const RegisterForm = () => {
  const [form] = Form.useForm();
  const registerMutation = useRegister();
  const { success } = useMessage();

  const onFinish = (values) => {
    form.setFields([{ name: "non_field_errors", errors: [] }]);

    registerMutation.mutate(values, {
      onSuccess: () => {
        success("Cuenta creada correctamente.");
      },
      onError: (error) => {
        if (error?.response?.data) {
          form.setFields(formatErrors(error.response.data));
        }
      },
    });
  };

  return (
    <Form
      form={form}
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
        label="Empresa"
        name="company_name"
        rules={[
          {
            required: true,
            message: "Ingresa el nombre de tu empresa.",
          },
        ]}
      >
        <Input
          autoComplete="organization"
          placeholder="FieldLink Networks"
        />
      </Form.Item>

      <Form.Item
        label="Slug de la empresa"
        name="company_slug"
        extra="Opcional. Si lo dejas vacío, se genera automáticamente."
        rules={[
          {
            pattern: /^[a-z0-9-]*$/,
            message: "Usa solo minúsculas, números y guiones.",
          },
        ]}
      >
        <Input
          autoComplete="off"
          placeholder="fieldlink-networks"
        />
      </Form.Item>

      <Form.Item
        label="Tu nombre"
        name="name"
        rules={[
          {
            required: true,
            message: "Ingresa tu nombre.",
          },
        ]}
      >
        <Input autoComplete="name" />
      </Form.Item>

      <Form.Item
        label="Teléfono"
        name="phone"
      >
        <Input
          autoComplete="tel"
          placeholder="+1 555 123 4567"
        />
      </Form.Item>

      <Form.Item
        label="Correo electrónico"
        name="email"
        rules={[
          {
            required: true,
            message: "Ingresa tu correo electrónico.",
          },
          {
            type: "email",
            message: "Ingresa un correo válido.",
          },
        ]}
      >
        <Input autoComplete="email" />
      </Form.Item>

      <Form.Item
        label="Contraseña"
        name="password"
        rules={[
          {
            required: true,
            message: "Ingresa una contraseña.",
          },
          {
            min: 8,
            message: "La contraseña debe tener al menos 8 caracteres.",
          },
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        label="Confirmar contraseña"
        name="password_confirm"
        dependencies={["password"]}
        rules={[
          {
            required: true,
            message: "Confirma tu contraseña.",
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }

              return Promise.reject(
                new Error("Las contraseñas no coinciden.")
              );
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Button
        className="mt-3"
        type="primary"
        htmlType="submit"
        loading={registerMutation.isPending}
        block
      >
        Crear cuenta
      </Button>
    </Form>
  );
};

export default RegisterForm;
