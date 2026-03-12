import { useCallback } from 'react';
import { useMessage } from '@context/MessageProvider';
import { translateError } from '../utils/rolesPermissions.utils';

/**
 * Hook centralizado para manejo de errores en el módulo de roles y permisos
 */
export const useErrorHandler = () => {
  const message = useMessage();
  /**
   * Maneja errores de validación de formularios
   * @param {Object} errorData - Datos del error del servidor
   * @param {Object} form - Instancia del formulario de Ant Design
   */
  const handleValidationErrors = useCallback((errorData, form) => {
    if (errorData?.errors) {
      const fieldErrors = Object.keys(errorData.errors).map(fieldName => {
        const fieldError = errorData.errors[fieldName];
        const errorMessage = Array.isArray(fieldError) ? fieldError[0] : fieldError;
        
        return {
          name: fieldName,
          errors: [translateError(errorMessage)]
        };
      });
      
      form?.setFields(fieldErrors);
    } else if (errorData?.message) {
      message.error(translateError(errorData.message));
    } else {
      message.error('Error desconocido');
    }
  }, []);

  /**
   * Maneja errores generales con mensaje personalizable
   * @param {Error|Object|string} error - Error a manejar
   * @param {string} defaultMessage - Mensaje por defecto si no se puede extraer el error
   */
  const handleGeneralError = useCallback((error, defaultMessage = 'Error desconocido') => {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error?.response?.data?.message || error?.response?.data || defaultMessage;
    
    message.error(translateError(errorMessage));
  }, []);

  /**
   * Procesa errores de operaciones asíncronas y los formatea
   * @param {Error} error - Error capturado
   * @returns {Object} Objeto de error formateado para manejo posterior
   */
  const processAsyncError = useCallback((error) => {
    return error?.response?.data || { 
      message: error?.message || 'Error desconocido' 
    };
  }, []);

  return {
    handleValidationErrors,
    handleGeneralError,
    processAsyncError
  };
};

export default useErrorHandler;