import { createNewRole } from '../services/rolePermissionsActions.js';
import useRolesPermissionsContext from './useRolesPermissionsContext';
import useErrorHandler from './useErrorHandler';

/**
 * Hook para manejo del modal de roles con mejores prácticas
 * Proporciona funcionalidad para crear nuevos roles
 */
const useRoleModal = ({ refetch } = {}) => {
  const { showSuccess } = useRolesPermissionsContext();
  const { handleGeneralError } = useErrorHandler();

  /**
   * Maneja el envío del formulario de creación de rol
   * @param {Object} values - Valores del formulario
   * @param {Object} options - Opciones adicionales como onClose
   */
  const handleRoleSubmit = async (values, { onClose } = {}) => {
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
        handleGeneralError(error, 'Error al crear rol');
      }
    }
  };

  return { handleRoleSubmit };
};

export default useRoleModal;
