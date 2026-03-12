import { useState } from "react";
import { Modal, Form, Input, Alert } from "antd";
import { useMessage } from "@context/MessageProvider";
import { validateAdminPassword, changeUserPassword } from "@api/userService";

const ChangePasswordModal = ({ open, onClose, userId, currentPassword = '' }) => {
  const { error, success } = useMessage();
  const [isAdminValidated, setIsAdminValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [changing, setChanging] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [form] = Form.useForm();

  const handleAdminValidation = async () => {
    try {
      setValidating(true);
      setPasswordError("");
      const values = await form.validateFields(["adminPassword"]);
      
      try {
        const result = await validateAdminPassword(values.adminPassword);
        
        if (result.success && result.data.validated) {
          setIsAdminValidated(true);
          form.resetFields(["adminPassword"]);
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
        if (apiErr.response?.status !== 422) {
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

  const handleChangePassword = async () => {
    try {
      setChanging(true);
      setPasswordError("");
      const values = await form.validateFields(["newPassword", "confirmPassword"]);
      
      if (values.newPassword !== values.confirmPassword) {
        form.setFields([
          {
            name: "confirmPassword",
            errors: ["Las contraseñas no coinciden"],
          },
        ]);
        return;
      }
      
      if (currentPassword && values.newPassword === currentPassword) {
        setPasswordError("La nueva contraseña no puede ser igual a la contraseña actual.");
        return;
      }
      try {
        const result = await changeUserPassword(userId, values.newPassword);
        
        if (result.success) {
          success("Contraseña actualizada exitosamente");
          form.resetFields();
          setIsAdminValidated(false);
          setPasswordError("");
          onClose();
        } else if (result.error === 'validation') {
          setPasswordError(result.message);
          if (result.field) {
            form.setFields([
              {
                name: result.field === 'password' ? 'newPassword' : result.field,
                errors: [result.message],
              },
            ]);
          }
        }
      } catch (apiErr) {
        if (apiErr.response?.status !== 422) {
          setPasswordError("Error al cambiar la contraseña. Inténtelo de nuevo más tarde.");
        }
      }
    } catch (formErr) {
      console.error("Error de validación del formulario:", formErr);
    } finally {
      setChanging(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsAdminValidated(false);
    setPasswordError("");
    onClose();
  };

  return (
    <Modal
      title="Cambiar contraseña"
      open={open}
      onCancel={handleCancel}
      okText={isAdminValidated ? "Guardar" : "Validar"}
      cancelText="Cancelar"
      confirmLoading={validating || changing}
      onOk={isAdminValidated ? handleChangePassword : handleAdminValidation}>
      <Form
        form={form}
        layout="vertical">
        {!isAdminValidated ? (
          <Form.Item
            label="Ingrese su contraseña de administrador para continuar"
            name="adminPassword"
            rules={[
              {
                required: true,
                message: "Por favor ingrese su contraseña de administrador",
              },
            ]}>
            <Input.Password />
          </Form.Item>
        ) : (
          <>
            <Form.Item
              label="Nueva contraseña"
              name="newPassword"
              rules={[
                {
                  required: true,
                  message: "Por favor ingrese la nueva contraseña",
                },
                {
                  min: 5,
                  message: "La contraseña debe tener al menos 5 caracteres",
                },
              ]}>
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="Confirmar contraseña"
              name="confirmPassword"
              rules={[
                {
                  required: true,
                  message: "Por favor confirme la nueva contraseña",
                },
                {
                  min: 5,
                  message: "La contraseña debe tener al menos 5 caracteres",
                },
              ]}>
              <Input.Password />
            </Form.Item>
            {passwordError && <Alert message={passwordError} type="error" showIcon />}
          </>
        )}
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;