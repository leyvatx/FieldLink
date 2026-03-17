import { Result } from "antd";
import PageLayout from "@layouts/page-layout/PageLayout";

const NotAuthorized = () => {
  return (
    <PageLayout title="Acceso restringido">
      <Result
        status="403"
        title="Acceso restringido"
        subTitle="Tu perfil no tiene permisos para usar el centro de mando web."
      />
    </PageLayout>
  );
};

export default NotAuthorized;
