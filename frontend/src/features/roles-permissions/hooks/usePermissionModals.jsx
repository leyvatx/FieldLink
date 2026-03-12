import { useState, useCallback, lazy } from "react";
import { useMessage } from '@context/MessageProvider';
import { useDialog } from '@context/DialogProvider';
import { getPermission as fetchPermission } from '@api/permissionService';
import { deleteExistingPermission, createNewPermission, updateExistingPermission } from '../services/rolePermissionsActions';
import { inferPermissionIds, translateError } from "../utils/rolesPermissions.utils";
import useSuspense from '@hooks/useSuspense';

const PermissionsModalSection = lazy(() => import('../components/sections/PermissionsModalSection'));
const PermissionImportTextModalSection = lazy(() => import('../components/sections/PermissionImportTextModalSection'));

/**
 * Hook para manejar la lógica de modales de permisos
 * Responsable de: crear, editar y eliminar permisos
 */
const usePermissionModals = ({ modules, submodules, refetch, invalidateCache }) => {
  const [modalError, setModalError] = useState(null);
  const { success: showSuccess, error: showError } = useMessage();
  const { openModal, closeModal, openModalConfirm } = useDialog();
  const suspense = useSuspense();

  const handleError = useCallback((error, defaultMessage = 'Error desconocido') => {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error?.message || error?.response?.data?.message || defaultMessage;
    showError(translateError(errorMessage));
  }, [showError]);

  const confirmDelete = useCallback((itemName, onConfirm) => {
    return openModalConfirm({
      title: 'Confirmar eliminación',
      content: `¿Está seguro que desea eliminar "${itemName}"?`,
      okText: 'Eliminar',
      cancelText: 'Cancelar',
      okButtonProps: { type: 'default', danger: true },
      onOk: onConfirm
    });
  }, [openModalConfirm]);

  const confirmCreate = useCallback((message, onConfirm) => {
    return openModalConfirm({
      title: 'Confirmar creación',
      content: message,
      okText: 'Crear',
      cancelText: 'Cancelar',
      okButtonProps: { type: 'primary' },
      onOk: onConfirm
    });
  }, [openModalConfirm]);

  const handlePermissionSubmit = useCallback(async (values) => {
    try {
      setModalError(null);
      let moduleData = values.module_id || values.module;
      if (!moduleData && values.module_name) {
        moduleData = { name: values.module_name, isNew: true };
      }
      
      let submoduleData = values.submodule_id || values.submodule;
      if (!submoduleData && values.submodule_name) {
        submoduleData = { name: values.submodule_name, isNew: true };
      }

      const isNewModule = typeof moduleData === 'object' && moduleData && moduleData.isNew;
      const isNewSubmodule = typeof submoduleData === 'object' && submoduleData && submoduleData.isNew;
      
      if (isNewModule || isNewSubmodule) {
        const newElements = [];
        if (isNewModule) newElements.push(`el módulo "${moduleData.name}"`);
        if (isNewSubmodule) newElements.push(`el submódulo "${submoduleData.name}"`);
        
        const elementText = newElements.length === 1 ? newElements[0] : newElements.join(' y ');
        const message = `Se va a crear ${elementText} junto con el permiso "${values.name}". ¿Desea continuar?`;
        
        confirmCreate(
          message,
          async () => {
            await processPermissionSubmit(values, moduleData, submoduleData);
          }
        );
        return;
      }
      await processPermissionSubmit(values, moduleData, submoduleData);
      
    } catch (error) {
      if (error.response?.data?.errors) {
        throw error;
      } else {
        handleError(error, 'Error al procesar permiso');
      }
    }
  }, [showSuccess, refetch, invalidateCache, handleError, setModalError, confirmCreate]);

  const onAfterSavePermission = useCallback((permission) => {
    setModalError(null);

    openModal({
      title: 'Permiso creado / actualizado',
      content: suspense(
        <PermissionImportTextModalSection
          onClose={closeModal}
          permission={permission}
        />
      ),
    })
  }, [openModal, closeModal, suspense]);

  const processPermissionSubmit = useCallback(async (values, moduleData, submoduleData) => {
    const payload = {
      name: values.name,
      description: values.description,
      module: moduleData,
      submodule: submoduleData || null,
    };

    let permission = null;

    if (values.id) {
      permission = await updateExistingPermission(values.id, payload);
      showSuccess('Permiso actualizado correctamente.');
    } else {
      permission = await createNewPermission(payload);
      showSuccess('Permiso creado correctamente.');
    }
    
    refetch?.();
    invalidateCache?.();

    onAfterSavePermission(permission);
  }, [showSuccess, refetch, invalidateCache, onAfterSavePermission]);

  const openNewPermission = useCallback((initial = {}) => {
    setModalError(null);
    
    openModal({
      title: initial?.id ? 'Editar Permiso' : 'Nuevo Permiso',
      content: suspense(
        <PermissionsModalSection
          onClose={closeModal}
          onSubmit={handlePermissionSubmit}
          initialValues={initial}
          modules={modules}
          submodules={submodules}
          error={modalError}
        />
      ),
      width: 520,
    });
  }, [openModal, closeModal, handlePermissionSubmit, modules, submodules, modalError, setModalError, suspense]);

  const onEditPermission = useCallback(async (perm) => {
    setModalError(null);
    
    let full = perm || {};
    if (perm?.id) {
      try {
        const resp = await fetchPermission(perm.id);
        full = resp || perm;
      } catch (err) {
        handleError(err, 'Error al cargar los datos del permiso');
        full = perm;
      }
    }
    const initial = inferPermissionIds(full, modules, submodules);
    openNewPermission(initial);
  }, [modules, submodules, openNewPermission, handleError, setModalError]);

  const onDeletePermission = useCallback((perm) => {
    if (!perm) return;
    
    confirmDelete(perm.description || perm.name, async () => {
      try {
        await deleteExistingPermission(perm.id);
        showSuccess('Permiso eliminado correctamente.');
        refetch();
      } catch (err) {
        handleError(err, 'Error al eliminar el permiso');
      }
    });
  }, [confirmDelete, showSuccess, refetch, handleError]);

  return {
    modalError,
    openNewPermission,
    onEditPermission,
    onDeletePermission,
  };
};

export default usePermissionModals;