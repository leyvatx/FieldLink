import dayjs from "dayjs";
import { Input, Tag, Typography } from "@/lib/antd-compat";
import { PiCalendar, PiClock } from "react-icons/pi";
import { ROLE_LABELS } from "@utils/constants/roles";

const { Title, Paragraph } = Typography;

const AdditionalDetailsSection = ({ profile }) => {
  return (
    <div className="rounded-[28px] border border-[var(--ui-border)] bg-[var(--ui-card)] p-6 shadow-[var(--ui-shadow-soft)]">
      <div className="mb-6">
        <Title level={3}>Contexto de cuenta</Title>
        <Paragraph type="secondary" className="mt-2 text-sm">
          Informacion operativa y marcas de tiempo para saber desde cuando forma parte del sistema.
        </Paragraph>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Tag color="blue">{ROLE_LABELS[profile.role] || profile.role || "N/A"}</Tag>
        <Tag color={profile.is_active ? "green" : "red"}>
          {profile.is_active ? "Activo" : "Inactivo"}
        </Tag>
      </div>

      <div className="grid gap-4">
        <div>
          <div className="mb-2 text-sm font-medium text-[var(--ui-foreground)]">Fecha de registro</div>
          <Input
            prefix={<PiCalendar className="text-[var(--ui-muted-foreground)]" size={18} />}
            value={
              profile.created_at
                ? dayjs(profile.created_at).format("DD/MM/YYYY HH:mm")
                : "Sin fecha"
            }
            disabled
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-[var(--ui-foreground)]">Ultima modificacion</div>
          <Input
            prefix={<PiClock className="text-[var(--ui-muted-foreground)]" size={18} />}
            value={
              profile.updated_at
                ? dayjs(profile.updated_at).format("DD/MM/YYYY HH:mm")
                : "Sin fecha"
            }
            disabled
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalDetailsSection;
