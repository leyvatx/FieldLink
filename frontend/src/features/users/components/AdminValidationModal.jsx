import { useState } from "react";
import { Modal, Form, Input } from "antd";
import { validateAdminPassword } from "@api/userService";

const AdminValidationModal = ({ open, onClose, onSuccess }) => {
  const [validating, setValidating] = useState(false);
  const [form] = Form.useForm();

  const handleAdminValidation = async () => {
    try {
      setValidating(true);
      const values = await form.validateFields(["adminPassword"]);
      
      try {
        const result = await validateAdminPassword(values.adminPassword);
        
        if (result.success && result.data.validated) {
          form.resetFields();
          onSuccess();
          onClose();
        } else if (!result.success && result.error === 'validation') {
          if (result.field === 'adminPassword') {
            form.setFields([
              {
                name: "adminPassword",
                errors: [result.message],
                status: "error"
              },
            ]);
          } 
          else if (result.errors) {
            const formErrors = Object.entries(result.errors).map(([field, messages]) => ({
              name: field,
              errors: messages,
              status: "error"
            }));
            form.setFields(formErrors);
          } 
          else {
            form.setFields([
              {
                name: "adminPassword",
                errors: [result.message || "Error de validación"],
                status: "error"
              },
            ]);
          }
        }
      } catch (apiErr) {
        if (![400, 422].includes(apiErr.response?.status)) {
          form.setFields([
            {
              name: "adminPassword",
              errors: ["Error al validar la contraseña"],
              status: "error"
            },
          ]);
        }
      }
    } catch (err) {
      form.setFields([
        {
          name: "adminPassword",
          errors: ["Error al validar la contraseña de administrador"],
          status: "error"
        },
      ]);
    } finally {
      setValidating(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setValidating(false);
    onClose();
  };

  return (
    <Modal
      title="Validación de administrador"
      open={open}
      onCancel={handleCancel}
      okText="Validar"
      cancelText="Cancelar"
      confirmLoading={validating}
      closable={!validating}
      maskClosable={!validating}
      onOk={handleAdminValidation}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleAdminValidation}>
        <Form.Item
          label="Ingrese su contraseña de administrador para continuar"
          name="adminPassword"
          rules={[
            {
              required: true,
              message: "Por favor ingrese su contraseña de administrador",
            },
          ]}>
          <Input.Password onPressEnter={() => form.submit()} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdminValidationModal;