import { Button, Form, Input, Alert } from "@/lib/antd-compat";
import { USER_VALIDATION_RULES } from "@features/users/constants/userValidations";

const PasswordSection = ({
  passwordSection,
  passwordError,
  changing,
  onAdminValidation,
  onChangePassword,
  onCancelPasswordChange,
}) => {
  if (!passwordSection) {
    return (
      <div className="grid gap-4 rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] p-4">
        <div className="text-sm font-medium text-[var(--ui-foreground)]">
          Seguridad
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Form.Item label="Contraseña" name="passwordPlaceholder" className="mb-0">
            <Input.Password disabled placeholder="********" />
          </Form.Item>
          <Button type="default" onClick={onAdminValidation}>
            Cambiar contraseña
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 rounded-[24px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_16%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_4%,var(--ui-card))] p-4">
      <div className="text-sm font-medium text-[var(--ui-foreground)]">
        Cambio de contraseña
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      {passwordError ? (
        <Alert message={passwordError} type="error" showIcon />
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancelPasswordChange}>Cancelar</Button>
        <Button type="primary" loading={changing} onClick={onChangePassword}>
          Guardar contraseña
        </Button>
      </div>
    </div>
  );
};

export default PasswordSection;
