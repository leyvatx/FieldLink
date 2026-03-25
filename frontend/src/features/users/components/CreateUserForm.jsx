import { useEffect } from "react";
import { Button, Form, Input, Select } from "@/lib/antd-compat";
import { useMessage } from "@context/MessageProvider";
import { useAuth } from "@context/AuthProvider";
import useCreateUser from "@features/users/hooks/useCreateUser";
import { useDialog } from "@context/DialogProvider";
import formatErrors from "@lib/formatErrors";
import {
  USER_VALIDATION_RULES,
  CHARACTER_LIMITS,
  FIELD_TOOLTIPS,
  FIELD_PLACEHOLDERS,
  getAllowedUserRoleOptions,
} from "@features/users/constants/userValidations";
import { TECHNICIAN_ROLE, isSupervisor } from "@utils/constants/roles";

const CreateUserForm = ({ onClose }) => {
  const { closeModal, closeDrawer } = useDialog();
  const { user } = useAuth();
  const supervisorView = isSupervisor(user);

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
  const roleOptions = getAllowedUserRoleOptions(user?.role);

  useEffect(() => {
    if (supervisorView) {
      form.setFieldValue("role", TECHNICIAN_ROLE);
    }
  }, [form, supervisorView]);

  const onFinish = (values) => {
    const payload = supervisorView ? { ...values, role: TECHNICIAN_ROLE } : values;

    createUserMutation.mutate(
      { payload },
      {
        onSuccess: () => {
          success(
            supervisorView
              ? "Técnico creado exitosamente."
              : "Usuario creado exitosamente."
          );
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
    <Form form={form} layout="vertical" onFinish={onFinish} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
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
          label="Teléfono"
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
      </div>

      <div className={`grid gap-4 ${supervisorView ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
        <Form.Item
          label="Correo"
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

        {supervisorView ? null : (
          <Form.Item label="Rol" name="role" rules={USER_VALIDATION_RULES.role}>
            <Select
              allowClear
              placeholder={FIELD_PLACEHOLDERS.role}
              options={roleOptions}
            />
          </Form.Item>
        )}
      </div>

      {supervisorView ? (
        <Form.Item hidden name="role" initialValue={TECHNICIAN_ROLE}>
          <Input />
        </Form.Item>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item
          label="Contraseña"
          name="password"
          rules={USER_VALIDATION_RULES.password}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          label="Confirmar contraseña"
          name="password_confirmation"
          dependencies={["password"]}
          rules={[
            ...USER_VALIDATION_RULES.passwordConfirmation,
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error("Las contraseñas no coinciden."));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </div>

      <div className="sticky bottom-0 z-10 -mx-1 mt-2 flex flex-col-reverse gap-2 border-t border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-1 pt-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button onClick={handleClose} disabled={createUserMutation.isPending}>
          Cancelar
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={createUserMutation.isPending}
        >
          {createUserMutation.isPending
            ? "Creando..."
            : supervisorView
              ? "Crear técnico"
              : "Crear usuario"}
        </Button>
      </div>
    </Form>
  );
};

export default CreateUserForm;
