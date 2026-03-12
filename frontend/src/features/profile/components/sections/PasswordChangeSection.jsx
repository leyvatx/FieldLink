import { useState } from "react";
import { Button, Form, Input, Alert, Divider } from "antd";
import { useMessage } from "@context/MessageProvider";
import { changePassword } from "@api/profileService";

const PasswordChangeSection = () => {
  const [form] = Form.useForm();
  const { success, error: showError } = useMessage();
  const [changing, setChanging] = useState(false);
  const [passwordSection, setPasswordSection] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFinish = async (values) => {
    setChanging(true);
    setErrorMessage("");
    if (values.newPassword !== values.confirmPassword) {
      form.setFields([
        {
          name: "confirmPassword",
          errors: ["Las contraseñas no coinciden"],
        },
      ]);
      setChanging(false);
      return;
    }
    if (values.currentPassword === values.newPassword) {
      form.setFields([
        {
          name: "newPassword",
          errors: ["\u00A0"],
        },
        {
          name: "confirmPassword",
          errors: ["La nueva contraseña no puede ser igual a la contraseña actual"],
        },
      ]);
      setChanging(false);
      return;
    }
    const result = await changePassword(
      values.currentPassword,
      values.newPassword,
      values.confirmPassword
    );
    if (result.success) {
      success("Contraseña actualizada exitosamente");
      setPasswordSection(false);
      form.resetFields();
    } else if (result.error === "validation") {
      const currentPasswordErrors = result.errors?.current_password;
      const newPasswordErrors = result.errors?.password;
      if (currentPasswordErrors && currentPasswordErrors.length > 0) {
        form.setFields([
          {
            name: "currentPassword",
            errors: currentPasswordErrors,
          },
        ]);
      }
      if (newPasswordErrors && newPasswordErrors.length > 0) {
        form.setFields([
          {
            name: "newPassword",
            errors: newPasswordErrors,
          },
        ]);
      }
      setErrorMessage("");
    } else {
      setErrorMessage("Error al cambiar la contraseña. Inténtelo de nuevo más tarde.");
    }
    setChanging(false);
  };

  const handleFinishFailed = ({ values }) => {
    if (values?.newPassword && values?.confirmPassword && values.newPassword !== values.confirmPassword) {
      form.setFields([
        {
          name: "newPassword",
          errors: ["\u00A0"],
        },
        {
          name: "confirmPassword",
          errors: ["Las contraseñas no coinciden"],
        },
      ]);
    }
  };

  return (
    <div className="w-full lg:w-1/3 p-4">
      <h3 className="text-lg font-semibold mb-4">Seguridad</h3>
      {!passwordSection ? (
        <div>
          <p className="mb-4">Cambia tu contraseña para mantener tu cuenta segura.</p>
          <Button 
            type="primary" 
            onClick={() => setPasswordSection(true)}
            className="w-full"
          >
            Cambiar contraseña
          </Button>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onFinishFailed={handleFinishFailed}
        >
          <Divider orientation="left">Cambio de contraseña</Divider>
          <Form.Item
            label="Contraseña actual"
            name="currentPassword"
            rules={[
              { required: true, message: "Por favor ingrese su contraseña actual" },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Nueva contraseña"
            name="newPassword"
            rules={[
              { required: true, message: "Por favor ingrese la nueva contraseña" },
              { min: 5, message: "La contraseña debe tener al menos 5 caracteres" },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Confirmar contraseña"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Por favor confirme la nueva contraseña" },
              { min: 5, message: "La contraseña debe tener al menos 5 caracteres" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          {errorMessage && (
            <Alert message={errorMessage} type="error" showIcon style={{ marginBottom: 16 }} />
          )}
          <div className="flex justify-between gap-2">
            <Button
              onClick={() => {
                setPasswordSection(false);
                form.resetFields();
                setErrorMessage("");
              }}
            >
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={changing}>
              Guardar contraseña
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default PasswordChangeSection;