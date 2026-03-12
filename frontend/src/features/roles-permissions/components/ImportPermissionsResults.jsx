import { Alert } from "antd";

const ImportPermissionsResults = ({ results = {} }) => {
  const { created = 0, updated = 0, duplicated = 0, errors = 0 } = results ?? {};
  return (
    <Alert
      style={{ padding: 14 }}
      showIcon
      type="info"
      message="Resultados de la importación"
      description={
        <span>
          Creados: {created} | Actualizados: {updated} | Duplicados: {duplicated} | Con error:{" "}
          {errors}
        </span>
      }
    />
  );
};

export default ImportPermissionsResults;
