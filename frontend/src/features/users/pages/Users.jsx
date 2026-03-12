import { Button } from "antd";
import PageLayout from "@layouts/page-layout/PageLayout";
import { useDialog } from "@context/DialogProvider";
import { PiPlus } from "react-icons/pi";
import CreateUserForm from "@features/users/components/CreateUserForm";
import UsersTable from "@features/users/components/UsersTable";

const Users = () => {
  const { openDrawer } = useDialog();

  return (
    <PageLayout
      title="Usuarios"
      topbarOptions={
        <Button
          icon={<PiPlus size={20} />}
          color="default"
          variant="filled"
          onClick={() =>
            openDrawer({ title: "Crear usuario", content: <CreateUserForm /> })
          }
        />
      }>
      <UsersTable />
    </PageLayout>
  );
};

export default Users;
