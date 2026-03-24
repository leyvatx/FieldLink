import { useState } from "react";
import { Button, Form, Input, Typography } from "@/lib/antd-compat";
import { PiEnvelope, PiKey, PiPhone, PiUserCircle } from "react-icons/pi";
import PasswordChangeModal from "../PasswordChangeModal";

const { Title, Paragraph } = Typography;

const fieldShellClass =
  "rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-3 shadow-[var(--ui-shadow-soft)]";

const BasicInfoSection = ({ formData, fieldErrors, handleChange, isEditing }) => {
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  return (
    <div className="overflow-hidden rounded-[32px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--ui-card)_94%,transparent),color-mix(in_srgb,var(--ui-highlight)_7%,var(--ui-card)))] p-6 shadow-[var(--ui-shadow-card)] md:p-7">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
          Identidad principal
        </div>
        <Title level={3} className="mt-3">
          Datos principales
        </Title>
        <Paragraph type="secondary" className="mt-2 max-w-2xl text-sm">
          Nombre, telefono y correo de uso interno.
        </Paragraph>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Form layout="vertical" className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className={fieldShellClass}>
              <Form.Item
                label="Nombre"
                help={fieldErrors.name}
                validateStatus={fieldErrors.name ? "error" : ""}
                className="!mb-0"
              >
                <Input
                  prefix={<PiUserCircle className="text-[var(--ui-muted-foreground)]" size={18} />}
                  value={formData.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  disabled={!isEditing}
                  className="w-full"
                />
              </Form.Item>
            </div>

            <div className={fieldShellClass}>
              <Form.Item
                label="Teléfono"
                help={fieldErrors.phone}
                validateStatus={fieldErrors.phone ? "error" : ""}
                className="!mb-0"
              >
                <Input
                  prefix={<PiPhone className="text-[var(--ui-muted-foreground)]" size={18} />}
                  value={formData.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                  disabled={!isEditing}
                  className="w-full"
                />
              </Form.Item>
            </div>
          </div>

          <div className={fieldShellClass}>
            <Form.Item
              label="Correo"
              help={fieldErrors.email}
              validateStatus={fieldErrors.email ? "error" : ""}
              className="!mb-0"
            >
              <Input
                prefix={<PiEnvelope className="text-[var(--ui-muted-foreground)]" size={18} />}
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                disabled={!isEditing}
                className="w-full"
              />
            </Form.Item>
          </div>
        </Form>

        <div className="rounded-[28px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_22%,var(--ui-border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-highlight)_10%,var(--ui-card)),color-mix(in_srgb,var(--ui-card)_96%,transparent))] p-5 shadow-[var(--ui-shadow-soft)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
            Seguridad
          </div>
          <div className="mt-3 text-xl font-semibold text-[var(--ui-foreground)]">
            Credenciales y acceso
          </div>
          <div className="mt-2 text-sm text-[var(--ui-muted-foreground)]">
            Protege tu cuenta con cambios periódicos de contraseña y mantén tu canal principal de contacto siempre actualizado.
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-4 py-3 text-sm text-[var(--ui-foreground)]">
              La contraseña nunca se expone en este panel y se gestiona en una vista aislada.
            </div>
            <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-4 py-3 text-sm text-[var(--ui-muted-foreground)]">
              Si trabajas desde campo, usa un correo y teléfono que puedas confirmar rápido.
            </div>
          </div>

          <Button
            type="primary"
            icon={<PiKey size={18} />}
            onClick={() => setPasswordModalVisible(true)}
            className="mt-5 w-full"
          >
            Cambiar contrasena
          </Button>
        </div>
      </div>

      <PasswordChangeModal
        isOpen={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
      />
    </div>
  );
};

export default BasicInfoSection;
