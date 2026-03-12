import { useMemo } from 'react';

/**
 * Hook para manejar las opciones de AutoComplete y filtrado
 * Centraliza la lógica de opciones de módulos y submódulos
 */
const usePermissionAutoComplete = ({
  modules = [],
  submodules = [],
  selectedModuleId,
  selectedModuleName,
}) => {
  const filteredSubmodules = useMemo(() => {
    if (selectedModuleId) {
      return submodules.filter(s => s.module_id == selectedModuleId);
    }
    
    if (selectedModuleName) {
      const moduleByName = modules.find(m => m.name.toLowerCase() === selectedModuleName.toLowerCase());
      if (moduleByName) {
        return submodules.filter(s => s.module_id == moduleByName.id);
      }
    }
    
    return [];
  }, [selectedModuleId, selectedModuleName, submodules, modules]);

  const moduleOptions = useMemo(() => {
    const uniqueModules = modules.filter((mod, index, self) => 
      self.findIndex(m => m.name.toLowerCase() === mod.name.toLowerCase()) === index
    );
    return uniqueModules.map(mod => ({
      value: mod.name,
      label: mod.name,
      key: `module-${mod.id}`,
      id: mod.id
    }));
  }, [modules]);

  const submoduleOptions = useMemo(() => {
    const uniqueSubmodules = filteredSubmodules.filter((sub, index, self) => 
      self.findIndex(s => s.name.toLowerCase() === sub.name.toLowerCase()) === index
    );
    return uniqueSubmodules.map(sub => ({
      value: sub.name,
      label: sub.name,
      key: `submodule-${sub.id}`,
      id: sub.id
    }));
  }, [filteredSubmodules]);

  const existingModule = useMemo(() => {
    if (selectedModuleId) {
      return modules.find(m => m.id == selectedModuleId);
    }
    if (selectedModuleName) {
      return modules.find(m => m.name.toLowerCase() === selectedModuleName.toLowerCase());
    }
    return null;
  }, [modules, selectedModuleId, selectedModuleName]);

  return {
    filteredSubmodules,
    moduleOptions,
    submoduleOptions,
    existingModule,
  };
};

export default usePermissionAutoComplete;