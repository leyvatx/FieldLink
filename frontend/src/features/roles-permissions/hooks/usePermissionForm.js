import { useEffect, useRef, useMemo } from 'react';
import { Form } from 'antd';

/**
 * Hook para manejar la lógica del formulario de permisos
 * Centraliza la gestión de valores, inicialización y prefijos dinámicos
 */
const usePermissionForm = ({ 
  initialValues = {}, 
  modules = [], 
  submodules = [], 
  form 
}) => {
  const [internalForm] = Form.useForm();
  const formInstance = form || internalForm;
  const initialized = useRef(false);
  const selectedModuleId = Form.useWatch('module_id', formInstance);
  const selectedSubmoduleId = Form.useWatch('submodule_id', formInstance);
  const selectedModuleName = Form.useWatch('module_name', formInstance);
  const selectedSubmoduleName = Form.useWatch('submodule_name', formInstance);
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      if (initialValues.module_id) {
        const mod = modules.find(m => m.id == initialValues.module_id);
        if (mod) {
          formInstance.setFieldsValue({ ...initialValues, module_name: mod.name });
        }
      }
      if (initialValues.submodule_id) {
        const sub = submodules.find(s => s.id == initialValues.submodule_id);
        if (sub) {
          formInstance.setFieldsValue({ ...initialValues, submodule_name: sub.name });
        }
      }
      if (!initialValues.module_id && !initialValues.submodule_id) {
        formInstance.setFieldsValue(initialValues);
      }
      initialized.current = true;
    }
  }, [initialValues, formInstance, modules, submodules]);
  useEffect(() => {
    if (initialized.current && selectedModuleId && initialValues?.id && selectedModuleId !== initialValues.module_id) {
      formInstance.setFieldsValue({ 
        submodule_id: undefined,
        submodule_name: '',
        name: '' 
      });
    }
  }, [selectedModuleId, formInstance, initialValues?.id, initialValues?.module_id]);
  const dynamicPrefix = useMemo(() => {
    if (selectedModuleId) {
      const mod = modules.find(m => m.id == selectedModuleId);
      if (mod) {
        if (selectedSubmoduleId) {
          const sub = submodules.find(s => s.id == selectedSubmoduleId);
          if (sub) {
            return `${mod.name.toLowerCase().replace(/\s+/g, '')}.${sub.name.toLowerCase().replace(/\s+/g, '')}.`;
          }
        }
        if (selectedSubmoduleName) {
          return `${mod.name.toLowerCase().replace(/\s+/g, '')}.${selectedSubmoduleName.toLowerCase().replace(/\s+/g, '')}.`;
        }
        return `${mod.name.toLowerCase().replace(/\s+/g, '')}.`;
      }
    }
    if (selectedModuleName) {
      if (selectedSubmoduleName) {
        return `${selectedModuleName.toLowerCase().replace(/\s+/g, '')}.${selectedSubmoduleName.toLowerCase().replace(/\s+/g, '')}.`;
      }
      return `${selectedModuleName.toLowerCase().replace(/\s+/g, '')}.`;
    }
    return '';
  }, [selectedModuleId, selectedSubmoduleId, selectedModuleName, selectedSubmoduleName, modules, submodules]);

  return {
    formInstance,
    selectedModuleId,
    selectedSubmoduleId,
    selectedModuleName,
    selectedSubmoduleName,
    dynamicPrefix,
  };
};

export default usePermissionForm;