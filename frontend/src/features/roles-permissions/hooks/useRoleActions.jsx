import { useState, lazy } from "react";
import { updateExistingRole, deleteExistingRole } from "../services/rolePermissionsActions";
import useRolesPermissionsContext from './useRolesPermissionsContext';
import useErrorHandler from './useErrorHandler';
import useSuspense from '@hooks/useSuspense';

const RoleModalSection = lazy(() => import('../components/sections/RoleModalSection'));

/**
 * Hook para manejo de acciones de rolessu
 */
const useRoleActions = (role, onRoleNameChange, refreshRoles, setHiddenRoles) => {
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const { 
    showSuccess, 
    openModal, 
    openModalConfirm, 
    closeModal,
  } = useRolesPermissionsContext();
  const { handleGeneralError } = useErrorHandler();
  const suspense = useSuspense();

  /**
   * Maneja las acciones del menú contextual de roles
   * @param {Object} param0 - Objeto con la key de la acción
   */
  const handleMenuClick = async ({ key }) => {
    if (key === "edit") {
      openModal({
        title: 'Editar rol',
        content: suspense(
          <RoleModalSection
            onClose={() => closeModal()}
            onSubmit={async (values, { onClose } = {}) => {
              setIsUpdatingRole(true);
              try {
                const payload = { 
                  name: values.name?.toLowerCase(),
                  permissions: [] 
                };
                await updateExistingRole(role.id, payload);
                if (onRoleNameChange) onRoleNameChange(role.id, values.name?.toLowerCase());
                if (refreshRoles) await refreshRoles();
                showSuccess("El rol se actualizó correctamente.");
                onClose?.();
              } catch (error) {
                if (error.response?.data?.errors) {
                  throw error;
                } else {
                  handleGeneralError(error, 'Error al actualizar rol');
                }
              } finally {
                setIsUpdatingRole(false);
              }
            }}
            initialValues={{ 
              name: role.name,
            }}
          />
        ),
        width: 520,
      });
    } else if (key === "delete") {
      openModalConfirm({
        title: 'Confirmar eliminación',
        content: `¿Está seguro que desea eliminar el rol "${role.name}"?`,
        okText: 'Eliminar',
        cancelText: 'Cancelar',
        okButtonProps: { type: 'default', danger: true },
        onOk: async () => {
          setIsDeletingRole(true);
          try {
            await deleteExistingRole(role.id);
            if (refreshRoles) await refreshRoles();
            showSuccess('El rol se eliminó correctamente.');
          } catch (error) {
            handleGeneralError(error, 'Error al eliminar rol');
          } finally {
            setIsDeletingRole(false);
          }
        }
      });
    } else if (key === "hide") {
      setHiddenRoles(prev => [...prev, role.id]);
    }
  };

  return {
    isUpdatingRole,
    isDeletingRole,
    handleMenuClick,
  };
};

export default useRoleActions;