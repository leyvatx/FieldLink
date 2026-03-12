import { useCallback } from 'react';

/**
 * Hook para manejar los eventos del formulario de permisos
 * Centraliza la lógica de cambios y selecciones en AutoComplete
 */
const usePermissionHandlers = ({
  formInstance,
  modules = [],
  filteredSubmodules = [],
}) => {
  const handleModuleChange = useCallback((value) => {
    formInstance.setFieldsValue({ 
      module_name: value,
      submodule_id: undefined,
      submodule_name: '',
      name: ''
    });
    const existingModule = modules.find(m => m.name.toLowerCase() === value.toLowerCase());
    if (existingModule) {
      formInstance.setFieldsValue({ module_id: existingModule.id });
    } else {
      formInstance.setFieldsValue({ module_id: undefined });
    }
  }, [formInstance, modules]);
  const handleSubmoduleChange = useCallback((value) => {
    formInstance.setFieldsValue({ 
      submodule_name: value,
      name: ''
    });
    const existingSubmodule = filteredSubmodules.find(s => s.name.toLowerCase() === value.toLowerCase());
    if (existingSubmodule) {
      formInstance.setFieldsValue({ submodule_id: existingSubmodule.id });
    } else {
      formInstance.setFieldsValue({ submodule_id: undefined });
    }
  }, [formInstance, filteredSubmodules]);
  const handleModuleSelect = useCallback((value, option) => {
    if (option && option.id) {
      formInstance.setFieldsValue({ 
        module_id: option.id,
        module_name: value,
        submodule_id: undefined,
        submodule_name: '',
        name: '' 
      });
    } else {
      formInstance.setFieldsValue({ 
        module_id: undefined,
        module_name: value,
        submodule_id: undefined,
        submodule_name: '',
        name: ''
      });
    }
  }, [formInstance]);
  const handleSubmoduleSelect = useCallback((value, option) => {
    if (option && option.id) {
      formInstance.setFieldsValue({ 
        submodule_id: option.id,
        submodule_name: value,
        name: ''
      });
    } else {
      formInstance.setFieldsValue({ 
        submodule_id: undefined,
        submodule_name: value,
        name: ''
      });
    }
  }, [formInstance]);

  return {
    handleModuleChange,
    handleSubmoduleChange,
    handleModuleSelect,
    handleSubmoduleSelect,
  };
};

export default usePermissionHandlers;