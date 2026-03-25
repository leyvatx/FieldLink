import dayjs from "dayjs";
import { Tag, Typography } from "@/lib/antd-compat";
import AppLogo from "@components/AppLogo";
import UserAvatar from "@components/UserAvatar";
import { ROLE_LABELS } from "@utils/constants/roles";

const { Title, Paragraph } = Typography;

const ProfileHeaderSection = ({ profile }) => {
  const completion = Math.round(
    ([profile.name, profile.email, profile.phone].filter(Boolean).length / 3) * 100
  );
  const memberSince = profile.created_at
    ? dayjs(profile.created_at).format("MMM YYYY")
    : "Pendiente";
  const lastSeen = profile.updated_at
    ? dayjs(profile.updated_at).format("DD/MM/YYYY HH:mm")
    : "Sin registro";

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_24%,var(--ui-border))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ui-card)_74%,transparent),color-mix(in_srgb,var(--ui-highlight)_10%,var(--ui-card)))] p-6 shadow-[var(--ui-shadow-card)] md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--ui-highlight)_18%,transparent),transparent_36%)]" />
      <div className="pointer-events-none absolute -left-10 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[color:color-mix(in_srgb,var(--ui-highlight)_14%,transparent)] blur-3xl" />

      <div className="relative grid gap-8 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start">
        <div className="grid gap-7">
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[color:color-mix(in_srgb,var(--ui-highlight)_24%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-card)_82%,transparent)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ui-muted-foreground)] shadow-[var(--ui-shadow-soft)]">
            <AppLogo compact showWordmark={false} iconSize={26} />
            Perfil
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--ui-highlight)_22%,transparent),transparent_62%)] blur-2xl" />
              <div className="relative rounded-[34px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_24%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-card)_88%,transparent)] p-3 shadow-[var(--ui-shadow-card)]">
                <UserAvatar user={profile} size={112} />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted-foreground)]">
                Cuenta
              </div>
              <Title level={2} className="mt-3 text-[clamp(2rem,4vw,3.25rem)] leading-[0.95]">
                {profile.name || "Usuario"}
              </Title>
              <Paragraph type="secondary" className="mt-4 max-w-2xl text-sm md:text-base">
                Datos de cuenta, contacto y seguridad.
              </Paragraph>

              <div className="mt-5 flex flex-wrap gap-2">
                <Tag color="purple">{ROLE_LABELS[profile.role] || profile.role || "Sin rol"}</Tag>
                <Tag color={profile.is_active ? "green" : "red"}>
                  {profile.is_active ? "Cuenta activa" : "Cuenta inactiva"}
                </Tag>
                {profile.email ? <Tag>{profile.email}</Tag> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                Perfil completo
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--ui-foreground)]">
                {completion}%
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--ui-secondary)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#E879F9_0%,#8B5CF6_55%,#5B21B6_100%)]"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_90%,transparent)] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                Miembro desde
              </div>
              <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                {memberSince}
              </div>
              <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                Integrado a la operación
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_90%,transparent)] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                Última edición
              </div>
              <div className="mt-2 text-base font-semibold text-[var(--ui-foreground)]">
                {lastSeen}
              </div>
              <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                Movimiento más reciente
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[28px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_22%,var(--ui-border))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--ui-highlight)_11%,var(--ui-card)),color-mix(in_srgb,var(--ui-card)_94%,transparent))] p-5 shadow-[var(--ui-shadow-soft)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
              Contacto primario
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]">
                  Correo
                </div>
                <div className="mt-1 text-sm font-medium text-[var(--ui-foreground)]">
                  {profile.email || "Sin correo"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]">
                  Teléfono
                </div>
                <div className="mt-1 text-sm font-medium text-[var(--ui-foreground)]">
                  {profile.phone || "Sin teléfono"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-5 shadow-[var(--ui-shadow-soft)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
              Presencia
            </div>
            <div className="mt-3 text-lg font-semibold text-[var(--ui-foreground)]">
              {profile.is_active ? "Lista para operar" : "Pendiente de reactivación"}
            </div>
            <div className="mt-2 text-sm text-[var(--ui-muted-foreground)]">
              Mantén tu información precisa para que órdenes, notificaciones y accesos fluyan sin fricción.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderSection;
