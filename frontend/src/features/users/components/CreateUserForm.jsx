import { Button, Form, Input, Select, Space } from "antd";
import { useMessage } from "@context/MessageProvider";
import useCreateUser from "@features/users/hooks/useCreateUser";
import { useDialog } from "@context/DialogProvider";
import formatErrors from "@lib/formatErrors";
import {
  USER_VALIDATION_RULES,
  CHARACTER_LIMITS,
  FIELD_TOOLTIPS,
  FIELD_PLACEHOLDERS,
  USER_ROLE_OPTIONS,
} from "@features/users/constants/userValidations";

const CreateUserForm = ({ onClose }) => {
  const { closeModal, closeDrawer } = useDialog();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeModal();
      closeDrawer();
    }
  };

  const createUserMutation = useCreateUser();
  const { success } = useMessage();
  const [form] = Form.useForm();

  const onFinish = (values) => {
    createUserMutation.mutate(
      { payload: values },
      {
        onSuccess: () => {
          success("Usuario creado exitosamente");
          handleClose();
        },
        onError: (err) => {
          if (err.response?.data) {
            form.setFields(formatErrors(err.response.data));
          }
        },
      }
    );
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        label="Nombre"
        name="name"
        tooltip={FIELD_TOOLTIPS.name}
        rules={USER_VALIDATION_RULES.name}
      >
        <Input
          placeholder={FIELD_PLACEHOLDERS.name}
          showCount
          maxLength={CHARACTER_LIMITS.name}
        />
      </Form.Item>

      <Form.Item
        label="Telefono"
        name="phone"
        tooltip={FIELD_TOOLTIPS.phone}
        rules={USER_VALIDATION_RULES.phone}
      >
        <Input
          placeholder={FIELD_PLACEHOLDERS.phone}
          showCount
          maxLength={CHARACTER_LIMITS.phone}
        />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        tooltip={FIELD_TOOLTIPS.email}
        rules={USER_VALIDATION_RULES.email}
      >
        <Input
          placeholder={FIELD_PLACEHOLDERS.email}
          showCount
          maxLength={CHARACTER_LIMITS.email}
        />
      </Form.Item>

      <Form.Item
        label="Rol"
        name="role"
        rules={USER_VALIDATION_RULES.role}
      >
        <Select
          allowClear
          placeholder={FIELD_PLACEHOLDERS.role}
          options={USER_ROLE_OPTIONS}
        />
      </Form.Item>

      <Form.Item
        label="Contrasena"
        name="password"
        rules={USER_VALIDATION_RULES.password}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        label="Confirmar contrasena"
        name="password_confirmation"
        dependencies={["password"]}
        rules={[
          ...USER_VALIDATION_RULES.passwordConfirmation,
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Las contrasenas no coinciden"));
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
        <Space>
          <Button
            onClick={handleClose}
            disabled={createUserMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? "Creando..." : "Crear usuario"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default CreateUserForm;
