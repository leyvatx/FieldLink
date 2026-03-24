import dayjs from "dayjs";
import { Input, Tag, Typography } from "@/lib/antd-compat";
import { PiCalendar, PiClock } from "react-icons/pi";
import { ROLE_LABELS } from "@utils/constants/roles";

const { Title, Paragraph } = Typography;

const AdditionalDetailsSection = ({ profile }) => {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[var(--ui-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-card)_96%,transparent),color-mix(in_srgb,var(--ui-highlight)_6%,var(--ui-card)))] p-6 shadow-[var(--ui-shadow-soft)]">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
          Contexto operativo
        </div>
        <Title level={3} className="mt-3">
          Huella de cuenta
        </Title>
        <Paragraph type="secondary" className="mt-2 text-sm">
          Una lectura rápida de tu rol, estado y eventos principales dentro del sistema.
        </Paragraph>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Tag color="purple">{ROLE_LABELS[profile.role] || profile.role || "N/A"}</Tag>
        <Tag color={profile.is_active ? "green" : "red"}>
          {profile.is_active ? "Activo" : "Inactivo"}
        </Tag>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]">
            Línea de tiempo
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium text-[var(--ui-foreground)]">
                Fecha de registro
              </div>
              <Input
                prefix={<PiCalendar className="text-[var(--ui-muted-foreground)]" size={18} />}
                value={
                  profile.created_at
                    ? dayjs(profile.created_at).format("DD/MM/YYYY HH:mm")
                    : "Sin fecha"
                }
                disabled
                className="w-full"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-[var(--ui-foreground)]">
                Última modificación
              </div>
              <Input
                prefix={<PiClock className="text-[var(--ui-muted-foreground)]" size={18} />}
                value={
                  profile.updated_at
                    ? dayjs(profile.updated_at).format("DD/MM/YYYY HH:mm")
                    : "Sin fecha"
                }
                disabled
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] px-4 py-4 text-sm text-[var(--ui-muted-foreground)]">
          Este panel te ayuda a entender cómo te ve la plataforma: identidad, actividad y trazabilidad en una sola lectura.
        </div>
      </div>
    </div>
  );
};

export default AdditionalDetailsSection;
