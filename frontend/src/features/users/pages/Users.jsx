import { useMemo, useState } from "react";
import { Button } from "@/lib/antd-compat";
import PageLayout from "@layouts/page-layout/PageLayout";
import { useDialog } from "@context/DialogProvider";
import { useAuth } from "@context/AuthProvider";
import { PiPlus } from "react-icons/pi";
import CreateUserForm from "@features/users/components/CreateUserForm";
import UsersTable from "@features/users/components/UsersTable";
import { getAllowedUserRoleOptions } from "@features/users/constants/userValidations";
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
      <UsersTable filters={filters} />
    </PageLayout>
  );
};

export default Users;
