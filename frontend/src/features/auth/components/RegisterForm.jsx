import {
  PiAtBold,
  PiBuildingsBold,
  PiHashBold,
  PiLockKeyBold,
  PiUserBold,
} from "react-icons/pi";
import { Alert, Button, Form, Input } from "@/lib/antd-compat";
import { useMessage } from "@context/MessageProvider";
import useRegister from "@features/auth/hooks/useRegister";
import formatErrors from "@lib/formatErrors";
import PhoneInput from "@/common/components/phone/PhoneInput";

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

      <div className="grid gap-4 md:grid-cols-2">
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
            prefix={<PiBuildingsBold size={16} />}
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
            prefix={<PiHashBold size={16} />}
          />
        </Form.Item>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
          <Input
            autoComplete="name"
            placeholder="Nombre completo"
            prefix={<PiUserBold size={16} />}
          />
        </Form.Item>

        <Form.Item
          label="Teléfono"
          name="phone"
          rules={[
            {
              validator(_, value) {
                if (!value) {
                  return Promise.resolve();
                }
                const digits = value.replace(/[^0-9]/g, "");
                if (digits.length < 7) {
                  return Promise.reject(
                    new Error("Ingresa un teléfono válido.")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <PhoneInput placeholder="10 dígitos" />
        </Form.Item>
      </div>

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
        <Input
          autoComplete="email"
          placeholder="nombre@empresa.com"
          prefix={<PiAtBold size={16} />}
        />
      </Form.Item>

      <div className="grid gap-4 md:grid-cols-2">
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
          <Input.Password
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            prefix={<PiLockKeyBold size={16} />}
          />
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
          <Input.Password
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            prefix={<PiLockKeyBold size={16} />}
          />
        </Form.Item>
      </div>

      <Button
        className="mt-3"
        type="primary"
        htmlType="submit"
        loading={registerMutation.isPending}
        block
      >
        Crear cuenta
      </Button>

      <div className="auth-form-note">
        La cuenta principal queda lista al terminar el registro.
      </div>
    </Form>
  );
};

export default RegisterForm;
