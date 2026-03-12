import { useMessage } from '@context/MessageProvider';
import { useDialog } from '@context/DialogProvider';
import { useAuth } from '@context/AuthProvider';

/**
 * Hook centralizado para el contexto del módulo de roles y permisos
 * Proporciona acceso a todos los contexts necesarios del proyecto
 * y funciones específicas del módulo
 */
export const useRolesPermissionsContext = () => {
  const { 
    success: showSuccess, 
    error: showError, 
    warning: showWarning,
    info: showInfo
  } = useMessage();
  const { 
    openModal, 
    closeModal, 
    openModalConfirm
  } = useDialog();
  const { user, permissions, hasPermission } = useAuth();

  /**
   * Muestra un mensaje de error con manejo mejorado
   * @param {Error|Object|string} error - Error a mostrar
   */
  const showErrorMessage = (error) => {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error?.message || error?.response?.data?.message || 'Error desconocido';
    showError(errorMessage);
  };

  /**
   * Abre un modal de confirmación para eliminación
   * @param {string} itemName - Nombre del elemento a eliminar
   * @param {Function} onConfirm - Función a ejecutar al confirmar
   */
  const confirmDelete = (itemName, onConfirm) => {
    return openModalConfirm({
      title: 'Confirmar eliminación',
      content: `¿Está seguro que desea eliminar "${itemName}"?`,
      okText: 'Eliminar',
      cancelText: 'Cancelar',
      okButtonProps: { type: 'default', danger: true },
      onOk: onConfirm
    });
  };
  
  /**
   * Verificaciones de permisos específicas del módulo
   */
  const permissions_check = {
    canEditRoles: () => hasPermission('roles.edit'),
    canDeleteRoles: () => hasPermission('roles.delete'),
    canCreateRoles: () => hasPermission('roles.create'),
    canEditPermissions: () => hasPermission('permissions.edit'),
    canDeletePermissions: () => hasPermission('permissions.delete'),
    canCreatePermissions: () => hasPermission('permissions.create'),
  };

  return {
    showSuccess,
    showError: showErrorMessage,
    showWarning,
    showInfo,
    openModal,
    closeModal,
    openModalConfirm,
    confirmDelete,
    user,
    permissions,
    hasPermission,
    ...permissions_check,
  };
};

export default useRolesPermissionsContext;