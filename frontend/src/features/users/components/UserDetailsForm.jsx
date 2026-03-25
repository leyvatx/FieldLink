import { Tag } from "@/lib/antd-compat";
import Loader from "@components/Loader";
import dayjs from "dayjs";
import useUser from "@features/users/hooks/useUser";
import { ROLE_LABELS } from "@utils/constants/roles";

const DetailItem = ({ label, children }) => (
  <div className="grid gap-1 rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] p-4">
    <div className="text-xs uppercase tracking-[0.12em] text-[var(--ui-muted-foreground)]">
      {label}
    </div>
    <div className="text-sm text-[var(--ui-foreground)]">{children}</div>
  </div>
);

const UserDetailsForm = ({ id }) => {
  const { data: user, isLoading: loadingUser } = useUser(id);

  if (loadingUser) {
    return <Loader />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DetailItem label="Estado">
        {user?.is_active ? <Tag color="success">Activo</Tag> : <Tag color="error">Inactivo</Tag>}
      </DetailItem>
      <DetailItem label="Rol">
        <Tag>{ROLE_LABELS[user?.role] || user?.role || "N/A"}</Tag>
      </DetailItem>
      <DetailItem label="Nombre">{user?.name || "-"}</DetailItem>
      <DetailItem label="Correo">{user?.email || "-"}</DetailItem>
      <DetailItem label="Telefono">{user?.phone || "-"}</DetailItem>
      <DetailItem label="Fecha de creacion">
        {user?.created_at
          ? dayjs(user.created_at).isValid()
            ? dayjs(user.created_at).format("DD/MM/YYYY")
            : "Fecha invalida"
          : "Sin fecha"}
      </DetailItem>
      <DetailItem label="Ultima actualizacion">
        {user?.updated_at
          ? dayjs(user.updated_at).isValid()
            ? dayjs(user.updated_at).format("DD/MM/YYYY")
            : "Fecha invalida"
          : "Sin fecha"}
      </DetailItem>
    </div>
  );
};

export default UserDetailsForm;
