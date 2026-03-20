import { Tag, Typography } from "@/lib/antd-compat";
import UserAvatar from "@components/UserAvatar";
import { ROLE_LABELS } from "@utils/constants/roles";

const { Title, Paragraph } = Typography;

const ProfileHeaderSection = ({ profile }) => {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[var(--ui-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ui-accent)_82%,transparent),color-mix(in_srgb,var(--ui-card)_90%,transparent))] p-6 shadow-[var(--ui-shadow-card)]">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="rounded-[28px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_88%,transparent)] p-2 shadow-[var(--ui-shadow-soft)]">
            <UserAvatar user={profile} size={88} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
              Perfil personal
            </div>
            <Title level={2} className="mt-2">
              {profile.name || "Usuario"}
            </Title>
            <Paragraph type="secondary" className="mt-2 max-w-2xl text-sm">
              Administra tu informacion, revisa tu rol operativo y ajusta la experiencia visual desde un solo lugar.
            </Paragraph>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag color="blue">{ROLE_LABELS[profile.role] || profile.role || "Sin rol"}</Tag>
              <Tag color={profile.is_active ? "green" : "red"}>
                {profile.is_active ? "Cuenta activa" : "Cuenta inactiva"}
              </Tag>
              {profile.email ? <Tag>{profile.email}</Tag> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[320px]">
          <div className="rounded-2xl border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-4 py-3">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]">
              Correo
            </div>
            <div className="mt-1 text-sm font-medium text-[var(--ui-foreground)]">
              {profile.email || "Sin correo"}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-4 py-3">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]">
              Telefono
            </div>
            <div className="mt-1 text-sm font-medium text-[var(--ui-foreground)]">
              {profile.phone || "Sin telefono"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderSection;
