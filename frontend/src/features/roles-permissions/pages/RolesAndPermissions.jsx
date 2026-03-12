import { lazy } from "react";
import PageLayout from "@layouts/page-layout/PageLayout";
import { useRolesPermissionsTable } from "../hooks/useRolesPermissionsTable";
import { Button, Popover, Tooltip } from "antd";
import {
  PiCheck,
  PiX,
  PiEye,
  PiDownloadSimpleFill,
  PiUploadSimpleFill,
} from "react-icons/pi";
import useSuspense from "@hooks/useSuspense";

const RolesPermissionsTable = lazy(() =>
  import("../components/RolesPermissionsTable")
);
const PermissionsImportText = lazy(() =>
  import("@features/roles-permissions/components/PermissionsImportText")
);
const ImportPermissions = lazy(() =>
  import("@features/roles-permissions/components/ImportPermissions")
);

/**
 * Página principal del módulo de Roles y Permisos
 */
const RolesAndPermissions = () => {
  const suspense = useSuspense();
  const {
    columns,
    dataSource,
    expandedRowKeys,
    handleRowExpand,
    save,
    discardChanges,
    hasChanges,
    isToggling,
    hiddenRoles,
    setHiddenRoles,
    isLoading,
  } = useRolesPermissionsTable();

  /**
   * Opciones de la barra superior con indicadores visuales del estado
   */
  const topbarOptions = (
    <div style={{ display: "flex", gap: 8 }}>
      <Tooltip title="Exportar permisos">
        <Popover
          content={suspense(<PermissionsImportText />)}
          classNames={{ body: "w-[500px] !p-4" }}
          trigger="click"
          placement="bottomRight"
          destroyOnHidden>
          <Button
            color="default"
            variant="filled"
            icon={<PiUploadSimpleFill size={16} />}
          />
        </Popover>
      </Tooltip>
      <Tooltip title="Importar permisos">
        <Popover
          content={suspense(<ImportPermissions />)}
          classNames={{ body: "w-[500px] !p-4" }}
          trigger="click"
          placement="bottomRight"
          destroyOnHidden>
          <Button
            color="default"
            variant="filled"
            icon={<PiDownloadSimpleFill size={16} />}
          />
        </Popover>
      </Tooltip>
      {hasChanges && (
        <Button
          onClick={save}
          loading={isToggling}
          type="primary"
          icon={<PiCheck size={16} />}
          title="Guardar cambios"
        />
      )}
      {hasChanges && (
        <Button
          onClick={discardChanges}
          icon={<PiX size={16} />}
          title="Descartar cambios"
        />
      )}
      {hiddenRoles.length > 0 && (
        <Button
          onClick={() => setHiddenRoles([])}
          icon={<PiEye size={16} />}
          title={`Mostrar ${hiddenRoles.length} roles ocultos`}
        />
      )}
    </div>
  );

  return (
    <PageLayout
      title="Roles y permisos"
      topbarOptions={topbarOptions}>
      {suspense(
        <RolesPermissionsTable
          columns={columns}
          dataSource={dataSource}
          isToggling={isToggling}
          isLoading={isLoading}
          handleRowExpand={handleRowExpand}
          expandedRowKeys={expandedRowKeys}
        />
      )}
    </PageLayout>
  );
};

export default RolesAndPermissions;
