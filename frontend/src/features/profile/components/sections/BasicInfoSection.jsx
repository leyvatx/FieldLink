import { useState } from "react";
import { Button, Form, Input, Typography } from "@/lib/antd-compat";
import { PiEnvelope, PiKey, PiPhone, PiUserCircle } from "react-icons/pi";
import PasswordChangeModal from "../PasswordChangeModal";

const { Title, Paragraph } = Typography;

const BasicInfoSection = ({ formData, fieldErrors, handleChange, isEditing }) => {
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  return (
    <div className="rounded-[28px] border border-[var(--ui-border)] bg-[var(--ui-card)] p-6 shadow-[var(--ui-shadow-soft)]">
      <div className="mb-6">
        <Title level={3}>Informacion basica</Title>
        <Paragraph type="secondary" className="mt-2 text-sm">
          Estos datos se usan en tu identidad dentro de la operacion y en las notificaciones del sistema.
        </Paragraph>
      </div>

      <Form layout="vertical">
        <Form.Item
          label="Nombre"
          help={fieldErrors.name}
          validateStatus={fieldErrors.name ? "error" : ""}
        >
          <Input
            prefix={<PiUserCircle className="text-[var(--ui-muted-foreground)]" size={18} />}
            value={formData.name}
            onChange={(event) => handleChange("name", event.target.value)}
            disabled={!isEditing}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Telefono"
          help={fieldErrors.phone}
          validateStatus={fieldErrors.phone ? "error" : ""}
        >
          <Input
            prefix={<PiPhone className="text-[var(--ui-muted-foreground)]" size={18} />}
            value={formData.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            disabled={!isEditing}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Correo"
          help={fieldErrors.email}
          validateStatus={fieldErrors.email ? "error" : ""}
        >
          <Input
            prefix={<PiEnvelope className="text-[var(--ui-muted-foreground)]" size={18} />}
            value={formData.email}
            onChange={(event) => handleChange("email", event.target.value)}
            disabled={!isEditing}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <div className="mt-2 flex flex-wrap gap-3">
          <Button
            type="primary"
            icon={<PiKey size={18} />}
            onClick={() => setPasswordModalVisible(true)}
          >
            Cambiar contrasena
          </Button>
        </div>
      </Form>

      <PasswordChangeModal
        isOpen={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
      />
    </div>
  );
};

export default BasicInfoSection;
