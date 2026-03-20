import { Form, Segmented, Select, Typography } from "@/lib/antd-compat";
import { PiPaintBrush, PiTranslate } from "react-icons/pi";

const { Title, Paragraph } = Typography;

const PreferencesSection = ({ profile, mode, toggleTheme }) => {
  return (
    <div className="rounded-[28px] border border-[var(--ui-border)] bg-[var(--ui-card)] p-6 shadow-[var(--ui-shadow-soft)]">
      <div className="mb-6">
        <Title level={3}>Preferencias</Title>
        <Paragraph type="secondary" className="mt-2 text-sm">
          Ajustes personales para que la interfaz se sienta consistente en claro y oscuro.
        </Paragraph>
      </div>

      <Form layout="vertical">
        <Form.Item
          label={
            <span className="inline-flex items-center gap-2">
              <PiTranslate className="text-[var(--ui-muted-foreground)]" size={18} />
              Idioma
            </span>
          }
        >
          <Select
            value={profile.language || "Espanol"}
            disabled
            style={{ width: "100%" }}
            options={[
              { value: "Espanol", label: "Espanol" },
              { value: "Ingles", label: "Ingles" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="inline-flex items-center gap-2">
              <PiPaintBrush className="text-[var(--ui-muted-foreground)]" size={18} />
              Tema
            </span>
          }
        >
          <Segmented
            block
            style={{ width: "100%" }}
            value={mode === "dark" ? "Oscuro" : "Claro"}
            onChange={(value) => {
              if (
                (value === "Oscuro" && mode === "light") ||
                (value === "Claro" && mode === "dark")
              ) {
                toggleTheme();
              }
            }}
            options={[
              { label: "Claro", value: "Claro" },
              { label: "Oscuro", value: "Oscuro" },
            ]}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default PreferencesSection;
