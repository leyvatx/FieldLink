import { Form, Input, Select } from "antd";
import {
  USER_VALIDATION_RULES,
  CHARACTER_LIMITS,
  FIELD_TOOLTIPS,
  FIELD_PLACEHOLDERS,
  USER_ROLE_OPTIONS,
} from "@features/users/constants/userValidations";

const UserBasicFields = () => {
  return (
    <>
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
    </>
  );
};

export default UserBasicFields;
