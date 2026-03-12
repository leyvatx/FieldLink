import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { buildBatchPayload } from '../utils/rolesPermissions.utils.js';
import { updatePermissionsBatch, attachPermissionToRole, detachPermissionFromRole } from '../services/rolePermissionsActions.js';
import useRolesPermissionsContext from './useRolesPermissionsContext';

const useTogglePermissions = ({ reset } = {}) => {
  const [isToggling, setIsToggling] = useState(false);
  const { showSuccess, showError } = useRolesPermissionsContext();
  const queryClient = useQueryClient();

  const save = async (pendingChangesList) => {
    if (!pendingChangesList?.length) return;
    
    setIsToggling(true);
    
    try {
      const { attach, detach } = buildBatchPayload(pendingChangesList);
      
      try {
        await updatePermissionsBatch({ attach, detach });
      } catch (batchError) {
        const errors = [];
        
        for (const item of attach) {
          for (const pid of item.permissionIds) {
            try {
              await attachPermissionToRole(item.roleId, pid);
            } catch (attachError) {
              errors.push(`Error asignando permiso ${pid} a rol ${item.roleId}: ${attachError.message}`);
            }
          }
        }
        
        for (const item of detach) {
          for (const pid of item.permissionIds) {
            try {
              await detachPermissionFromRole(item.roleId, pid);
            } catch (detachError) {
              errors.push(`Error removiendo permiso ${pid} del rol ${item.roleId}: ${detachError.message}`);
            }
          }
        }
        
        if (errors.length > 0) {
          const errorMsg = errors.length > 3 
            ? `${errors.slice(0, 3).join(', ')} y ${errors.length - 3} más`
            : errors.join(', ');
          throw new Error(`Algunos cambios fallaron: ${errorMsg}`);
        }
      }
      
      showSuccess('Cambios guardados correctamente.');
      reset?.();
      queryClient.invalidateQueries(['roles-permissions-matrix']);
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
      showError(`Error al guardar los cambios: ${errorMessage}`);
    } finally {
      setIsToggling(false);
    }
  };

  const togglePermission = useCallback((roleId, permissionId, data, overlayData, setChangesFn) => {
    const originalHas = !!data?.matrix?.[roleId]?.includes(permissionId);
    const overlayHas = !!overlayData?.matrix?.[roleId]?.includes(permissionId);
    const target = !overlayHas;
    
    setChangesFn?.(prev => {
      const filtered = prev.filter(c => !(c.roleId === roleId && c.permissionId === permissionId));
      if (target === originalHas) return filtered;
      return [...filtered, { roleId, permissionId, action: target ? 'attach' : 'detach' }];
    });
  }, []);

  const toggleMultiplePermissions = useCallback((roleId, permissionIds, data, attach = true, setChangesFn) => {
    setChangesFn?.(prev => {
      let next = prev.filter(c => c.roleId !== roleId || !permissionIds.includes(c.permissionId));
      
      for (const permissionId of permissionIds) {
        const originalHas = !!data?.matrix?.[roleId]?.includes(permissionId);
        const target = attach;
        if (target === originalHas) continue;
        next.push({ roleId, permissionId, action: target ? 'attach' : 'detach' });
      }
      return next;
    });
  }, []);

  return {
    isToggling,
    save,
    togglePermission,
    toggleMultiplePermissions,
  };
};

export default useTogglePermissions;
