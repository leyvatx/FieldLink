import { Form, Input, Select } from "@/lib/antd-compat";
import {
  USER_VALIDATION_RULES,
  CHARACTER_LIMITS,
  FIELD_TOOLTIPS,
  FIELD_PLACEHOLDERS,
} from "@features/users/constants/userValidations";

const UserBasicFields = ({ roleOptions = [], hideRole = false }) => {
  return (
    <div className="grid gap-5">
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
      </div>

      <div className={`grid gap-4 ${hideRole ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
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

        {hideRole ? null : (
          <Form.Item label="Rol" name="role" rules={USER_VALIDATION_RULES.role}>
            <Select
              allowClear
              placeholder={FIELD_PLACEHOLDERS.role}
              options={roleOptions}
            />
          </Form.Item>
        )}
      </div>

      {hideRole ? (
        <Form.Item hidden name="role" initialValue="TECHNICIAN">
          <Input />
        </Form.Item>
      ) : null}
    </div>
  );
};

export default UserBasicFields;
