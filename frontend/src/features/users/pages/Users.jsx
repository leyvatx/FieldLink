import { useMemo, useState } from "react";
import { Button } from "antd";
import PageLayout from "@layouts/page-layout/PageLayout";
import { useDialog } from "@context/DialogProvider";
import { useAuth } from "@context/AuthProvider";
import { PiPlus } from "react-icons/pi";
import CreateUserForm from "@features/users/components/CreateUserForm";
import UsersTable from "@features/users/components/UsersTable";
import { getAllowedUserRoleOptions } from "@features/users/constants/userValidations";

const Users = () => {
  const { openDrawer } = useDialog();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    role: null,
    isActive: null,
  });
  const roleOptions = getAllowedUserRoleOptions(user?.role);
  const isDispatcher = user?.role === "DISPATCHER";

  const searchConfig = useMemo(
    () => ({
      title: isDispatcher ? "Buscar y filtrar técnicos" : "Buscar y filtrar personal",
      values: filters,
      fields: [
        {
          key: "search",
          label: "Buscar",
          placeholder: "Nombre, correo o teléfono",
        },
        ...(isDispatcher
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
          search: "",
          role: null,
          isActive: null,
        }),
    }),
    [filters, isDispatcher, roleOptions]
  );

  return (
    <PageLayout
      title={isDispatcher ? "Técnicos de campo" : "Personal de la empresa"}
      searchConfig={searchConfig}
      topbarOptions={
        <Button
          icon={<PiPlus size={20} />}
          color="default"
          variant="filled"
          onClick={() =>
            openDrawer({
              title: isDispatcher ? "Crear técnico" : "Crear integrante",
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
