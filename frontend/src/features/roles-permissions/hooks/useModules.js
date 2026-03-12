import { useState, useEffect } from "react";
import { fetchModules, fetchSubmodules } from "../services/rolePermissionsActions.js";
import useRolesPermissionsContext from './useRolesPermissionsContext';

const cache = {
  modules: { data: null, promise: null },
  submodules: { data: null, promise: null }
};

export const useModules = () => {
  const [modules, setModules] = useState(cache.modules.data || []);
  const [submodules, setSubmodules] = useState(cache.submodules.data || []);
  const { showError } = useRolesPermissionsContext();

  const invalidateCache = () => {
    cache.modules = { data: null, promise: null };
    cache.submodules = { data: null, promise: null };
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async (key, fetchFn, setter) => {
      try {
        if (!cache[key].data) {
          cache[key].promise = cache[key].promise || fetchFn().then(res => {
            cache[key].data = res || [];
            return cache[key].data;
          }).catch(err => {
            cache[key].promise = null;
            throw err;
          });
        }
        const data = await cache[key].promise;
        if (mounted) setter(data || []);
      } catch (e) {
        if (mounted) showError(`Error al cargar los ${key}`);
      }
    };

    loadData('modules', fetchModules, setModules);
    loadData('submodules', fetchSubmodules, setSubmodules);

    return () => { mounted = false; };
  }, [showError]);

  return { modules, submodules, invalidateCache };
};
