import { Form, Segmented, Select, Typography } from "@/lib/antd-compat";
import { PiPaintBrush, PiTranslate } from "react-icons/pi";

const { Title, Paragraph } = Typography;

const paletteSwatches = [
  "bg-[#E879F9]",
  "bg-[#8B5CF6]",
  "bg-[#5B21B6]",
];

const PreferencesSection = ({ profile, mode, toggleTheme }) => {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card)),color-mix(in_srgb,var(--ui-card)_96%,transparent))] p-6 shadow-[var(--ui-shadow-soft)]">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
          Preferencias
        </div>
        <Title level={3} className="mt-3">
          Tema e idioma
        </Title>
        <Paragraph type="secondary" className="mt-2 text-sm">
          Configura apariencia e idioma.
        </Paragraph>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]">
            Tema activo
          </div>
          <div className="mt-2 text-base font-semibold text-[var(--ui-foreground)]">
            {mode === "dark" ? "Oscuro" : "Claro"}
          </div>
        </div>
        <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]">
            Idioma
          </div>
          <div className="mt-2 text-base font-semibold text-[var(--ui-foreground)]">
            {profile.language || "Espanol"}
          </div>
        </div>
        <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]">
            Paleta
          </div>
          <div className="mt-3 flex gap-2">
            {paletteSwatches.map((swatch) => (
              <span key={swatch} className={`h-6 w-6 rounded-full border border-white/20 ${swatch}`} />
            ))}
          </div>
        </div>
      </div>

      <Form layout="vertical" className="grid gap-4">
        <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-4">
          <Form.Item
            label={
              <span className="inline-flex items-center gap-2">
                <PiTranslate className="text-[var(--ui-muted-foreground)]" size={18} />
                Idioma
              </span>
            }
            className="!mb-0"
          >
            <Select
              value={profile.language || "Espanol"}
              disabled
              className="w-full"
              options={[
                { value: "Espanol", label: "Espanol" },
                { value: "Ingles", label: "Ingles" },
              ]}
            />
          </Form.Item>
        </div>

        <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_16%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] p-4">
          <Form.Item
            label={
              <span className="inline-flex items-center gap-2">
                <PiPaintBrush className="text-[var(--ui-muted-foreground)]" size={18} />
                Tema
              </span>
            }
            className="!mb-0"
          >
            <Segmented
              block
              className="w-full"
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
        </div>
      </Form>
    </div>
  );
};

export default PreferencesSection;
