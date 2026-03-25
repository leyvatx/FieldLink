import { useMemo, useState } from "react";
import { Button, Card, Tag } from "@/lib/antd-compat";
import ModuleStatStrip from "@components/ModuleStatStrip";
import PageLayout from "@layouts/page-layout/PageLayout";
import { useDialog } from "@context/DialogProvider";
import { useAuth } from "@context/AuthProvider";
import { PiPlus } from "react-icons/pi";
import CreateUserForm from "@features/users/components/CreateUserForm";
import UsersTable from "@features/users/components/UsersTable";
import useUsers from "@features/users/hooks/useUsers";
import { getAllowedUserRoleOptions } from "@features/users/constants/userValidations";
import { TECHNICIAN_ROLE, isSupervisor } from "@utils/constants/roles";
import { matchesText } from "@/lib/filtering";

const Users = () => {
  const { openDrawer } = useDialog();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    role: null,
    isActive: null,
  });
  const roleOptions = getAllowedUserRoleOptions(user?.role);
  const supervisorView = isSupervisor(user);
  const { data: allUsers = [] } = useUsers();

  const visibleUsers = useMemo(() => {
    return allUsers.filter((record) => {
      if (filters.role && record.role !== filters.role) {
        return false;
      }
      if (filters.isActive != null && record.is_active !== filters.isActive) {
        return false;
      }
      if (!matchesText(record.name, filters.name)) {
        return false;
      }
      if (!matchesText(record.email, filters.email)) {
        return false;
      }
      return matchesText(record.phone, filters.phone);
    });
  }, [allUsers, filters]);

  const userMetrics = useMemo(
    () => ({
      total: visibleUsers.length,
      active: visibleUsers.filter((record) => record.is_active).length,
      technicians: visibleUsers.filter((record) => record.role === TECHNICIAN_ROLE).length,
      inactive: visibleUsers.filter((record) => !record.is_active).length,
    }),
    [visibleUsers]
  );

  const searchConfig = useMemo(
    () => ({
      title: supervisorView
        ? "Buscar y filtrar técnicos"
        : "Buscar y filtrar personal",
      values: filters,
      fields: [
        {
          key: "name",
          label: "Nombre",
          placeholder: "Nombre, correo o teléfono",
        },
        {
          key: "email",
          label: "Correo",
          placeholder: "Correo del usuario",
        },
        {
          key: "phone",
          label: "Teléfono",
          placeholder: "Teléfono del usuario",
        },
        ...(supervisorView
          ? []
          : [
              {
                key: "role",
                label: "Rol",
                type: "select",
                options: roleOptions,
              },
            ]),
        {
          key: "isActive",
          label: "Estado",
          type: "select",
          options: [
            { value: true, label: "Activo" },
            { value: false, label: "Inactivo" },
          ],
        },
      ],
      onChange: (patch) => setFilters((prev) => ({ ...prev, ...patch })),
      onReset: () =>
        setFilters({
          name: "",
          email: "",
          phone: "",
          role: null,
          isActive: null,
        }),
    }),
    [filters, supervisorView, roleOptions]
  );

  return (
    <PageLayout
      title={supervisorView ? "Técnicos de campo" : "Personal de la empresa"}
      searchConfig={searchConfig}
      topbarOptions={
        <Button
          type="primary"
          icon={<PiPlus size={18} />}
          onClick={() =>
            openDrawer({
              title: supervisorView ? "Crear técnico" : "Crear integrante",
              width: 760,
              content: <CreateUserForm />,
            })
          }
        >
          {supervisorView ? "Nuevo técnico" : "Nuevo integrante"}
        </Button>
      }
    >
      <div className="grid gap-4">
        <ModuleStatStrip
          badge={supervisorView ? "Técnicos" : "Personal"}
          description={
            supervisorView
              ? "Técnicos visibles, con su estado y acceso rápido a acciones."
              : "Equipo visible, con acciones directas y la tabla como foco principal."
          }
          stats={[
            {
              label: "Visibles",
              value: userMetrics.total,
              help: "usuarios filtrados",
            },
            {
              label: "Activos",
              value: userMetrics.active,
              help: "con acceso",
            },
            {
              label: "Técnicos",
              value: userMetrics.technicians,
              help: "en esta vista",
            },
            {
              label: "Inactivos",
              value: userMetrics.inactive,
              help: "sin acceso",
            },
          ]}
        />

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                {supervisorView ? "Técnicos" : "Equipo"}
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Cada fila ya trae acciones visibles para editar, ver o cambiar estado.
              </div>
            </div>
            <Tag color="purple">{visibleUsers.length} visibles</Tag>
          </div>
          <UsersTable filters={filters} />
        </Card>
      </div>
    </PageLayout>
  );
};

export default Users;
