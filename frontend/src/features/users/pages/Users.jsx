import { useMemo, useState } from "react";
import { Button } from "@/lib/antd-compat";
import ModuleOverview from "@components/ModuleOverview";
import PageLayout from "@layouts/page-layout/PageLayout";
import { useDialog } from "@context/DialogProvider";
import { useAuth } from "@context/AuthProvider";
import { PiPlus } from "react-icons/pi";
import CreateUserForm from "@features/users/components/CreateUserForm";
import UsersTable from "@features/users/components/UsersTable";
import useUsers from "@features/users/hooks/useUsers";
import { getAllowedUserRoleOptions } from "@features/users/constants/userValidations";
import { TECHNICIAN_ROLE } from "@utils/constants/roles";
import { isSupervisor } from "@utils/constants/roles";

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
  const userMetrics = useMemo(
    () => ({
      total: allUsers.length,
      active: allUsers.filter((record) => record.is_active).length,
      technicians: allUsers.filter((record) => record.role === TECHNICIAN_ROLE).length,
      inactive: allUsers.filter((record) => !record.is_active).length,
    }),
    [allUsers]
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
          label: "Telefono",
          placeholder: "Telefono del usuario",
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
          icon={<PiPlus size={20} />}
          color="default"
          variant="filled"
          onClick={() =>
            openDrawer({
              title: supervisorView ? "Crear técnico" : "Crear integrante",
              content: <CreateUserForm />,
            })
          }
        />
      }
    >
      <div className="grid gap-6">
        <ModuleOverview
          badge={supervisorView ? "Tecnicos" : "Personal"}
          title={supervisorView ? "Tecnicos de campo" : "Personal de la empresa"}
          subtitle={supervisorView ? "Tecnicos, estado y disponibilidad." : "Equipo, roles y estado."}
          tags={supervisorView ? ["Tecnicos", "Estado", "Cobertura"] : ["Equipo", "Roles", "Estado"]}
          stats={[
            {
              label: "Usuarios",
              value: userMetrics.total,
              help: "registrados",
            },
            {
              label: "Activos",
              value: userMetrics.active,
              help: "con acceso",
            },
            {
              label: "Tecnicos",
              value: userMetrics.technicians,
              help: "en plantilla",
            },
            {
              label: "Inactivos",
              value: userMetrics.inactive,
              help: "sin acceso",
            },
          ]}
        />
        <UsersTable filters={filters} />
      </div>
    </PageLayout>
  );
};

export default Users;
