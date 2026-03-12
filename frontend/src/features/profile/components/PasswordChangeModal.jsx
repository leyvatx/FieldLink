import { Form, Input, Button, Modal } from "antd";
import { useEffect, useCallback } from "react";
import { useMessage } from "@context/MessageProvider";
import useChangePassword from "../hooks/useChangePassword";

const PasswordChangeModal = ({ isOpen, onClose }) => {
  const [form] = Form.useForm();
  const { success } = useMessage();
  const { executeChangePassword, changing } = useChangePassword();

  const handleCancel = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  const handleFinish = useCallback(
    async (values) => {
      const result = await executeChangePassword(
        values.currentPassword,
        values.newPassword,
        values.confirmPassword
      );

      if (result.success) {
        success("Contrasena actualizada exitosamente");
        form.resetFields();
        onClose();
        return;
      }

      const err = result || {};
      if (err.errors) {
        const fields = [];
        if (err.errors.old_password) {
          fields.push({
            name: "currentPassword",
            errors: [err.errors.old_password[0]],
          });
        }
        if (err.errors.new_password) {
          fields.push({
            name: "newPassword",
            errors: [err.errors.new_password[0]],
          });
        }
        if (err.errors.new_password_confirm) {
          fields.push({
            name: "confirmPassword",
            errors: [err.errors.new_password_confirm[0]],
          });
        }
        if (fields.length) {
          form.setFields(fields);
          return;
        }
      }
    },
    [executeChangePassword, success, form, onClose]
  );

  const handleFinishFailed = useCallback(
    ({ values }) => {
      if (
        values?.newPassword &&
        values?.confirmPassword &&
        values.newPassword !== values.confirmPassword
      ) {
        form.setFields([
          {
            name: "newPassword",
            errors: [" "],
          },
          {
            name: "confirmPassword",
            errors: ["Las contrasenas no coinciden"],
          },
        ]);
      }
    },
    [form]
  );

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, form]);

  return (
    <Modal
      title="Cambiar Contrasena"
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={520}
      destroyOnHidden
    >
      {isOpen && (
        <PasswordChangeForm
          form={form}
          onFinish={handleFinish}
          onFinishFailed={handleFinishFailed}
          onCancel={handleCancel}
          changing={changing}
        />
      )}
    </Modal>
  );
};

const PasswordChangeForm = ({
  form,
  onFinish,
  onFinishFailed,
  onCancel,
  changing,
}) => {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="Contrasena actual"
        name="currentPassword"
        rules={[
          { required: true, message: "Por favor ingrese su contrasena actual" },
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        label="Nueva contrasena"
        name="newPassword"
        rules={[
          { required: true, message: "Por favor ingrese la nueva contrasena" },
          { min: 8, message: "La contrasena debe tener al menos 8 caracteres" },
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        label="Confirmar contrasena"
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={[
          {
            required: true,
            message: "Por favor confirme la nueva contrasena",
          },
          { min: 8, message: "La contrasena debe tener al menos 8 caracteres" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("newPassword") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Las contrasenas no coinciden"));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={changing}
        >
          Guardar contrasena
        </Button>
      </div>
    </Form>
  );
};

export default PasswordChangeModal;
