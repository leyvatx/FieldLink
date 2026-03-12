import { Button, Form, Input, Alert, Divider } from "antd";
import { USER_VALIDATION_RULES } from "@features/users/constants/userValidations";

const PasswordSection = ({ 
  passwordSection, 
  passwordError, 
  changing, 
  onAdminValidation, 
  onChangePassword, 
  onCancelPasswordChange 
}) => {
  if (!passwordSection) {
    return (
      <>
        <Form.Item label="Contraseña" name="passwordPlaceholder">
          <Input.Password disabled placeholder="********" />
        </Form.Item>
        <Form.Item
          style={{ textAlign: "center", marginTop: "-12px", marginBottom: "16px" }}
        >
          <Button
            danger
            onClick={onAdminValidation}
            style={{ border: "1px solid #ff4d4f", width: "180px" }}
          >
            Cambiar contraseña
          </Button>
        </Form.Item>
      </>
    );
  }

  return (
    <>
      <Divider orientation="left">Cambio de contraseña</Divider>
      <Form.Item
        label="Nueva contraseña"
        name="newPassword"
        rules={USER_VALIDATION_RULES.newPassword}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="Confirmar contraseña"
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={[
          ...USER_VALIDATION_RULES.passwordConfirmation,
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("newPassword") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Las contraseñas no coinciden"));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>
      {passwordError && (
        <Alert 
          message={passwordError} 
          type="error" 
          showIcon 
          style={{ marginBottom: 16 }} 
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Button onClick={onCancelPasswordChange}>
          Cancelar
        </Button>
        <Button type="primary" loading={changing} onClick={onChangePassword}>
          Guardar contraseña
        </Button>
      </div>
      <Divider />
    </>
  );
};

export default PasswordSection;