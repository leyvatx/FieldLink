import React, { useCallback, lazy } from "react";
import { useMessage } from '@context/MessageProvider';
import { useDialog } from '@context/DialogProvider';
import { createNewRole } from '../services/rolePermissionsActions';
import { translateError } from "../utils/rolesPermissions.utils";
import useSuspense from '@hooks/useSuspense';

const RoleModalSection = lazy(() => import('../components/sections/RoleModalSection'));

/**
 * Hook para manejar la lógica de modales de roles
 * Responsable de: crear y editar roles
 */
export function useRoleModals({ refetch }) {
  const { success: showSuccess, error: showError } = useMessage();
  const { openModal, closeModal } = useDialog();
  const suspense = useSuspense();
  
  const handleError = useCallback((error, defaultMessage = 'Error desconocido') => {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error?.message || error?.response?.data?.message || defaultMessage;
    showError(translateError(errorMessage));
  }, [showError]);

  const handleRoleSubmit = useCallback(async (values, { onClose } = {}) => {
    try {
      const payload = { 
        name: values.name?.toLowerCase(),
        permissions: [] 
      };
      await createNewRole(payload);
      showSuccess('Rol creado correctamente.');
      refetch?.();
      onClose?.();
    } catch (error) {
      if (error.response?.data?.errors) {
        throw error;
      } else {
        handleError(error, 'Error al crear rol');
      }
    }
  }, [showSuccess, refetch, handleError]);

  const openNewRole = useCallback((initial = {}) => {
    openModal({
      title: initial?.id ? 'Editar Rol' : 'Nuevo Rol',
      content: suspense(
        React.createElement(RoleModalSection, {
          onClose: closeModal,
          onSubmit: handleRoleSubmit,
          initialValues: initial
        })
      ),
      width: 520,
    });
  }, [openModal, closeModal, handleRoleSubmit, suspense]);

  return {
    openNewRole,
  };
}