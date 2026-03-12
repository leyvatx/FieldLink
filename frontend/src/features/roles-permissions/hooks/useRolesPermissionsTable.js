import { useState, useCallback, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRolesPermissionsMatrix } from "./useRolesPermissionsMatrix";
import { getGroupedPermissionsData, computeOverlayData, bindToggleHooks } from "../utils/rolesPermissions.utils";
import { getRolesPermissionsColumns } from "../utils/getRolesPermissionsColumns.jsx";
import { useModules } from "./useModules";
import useTogglePermissions from './useTogglePermissions';
import { useTableState } from './useTableState';
import usePermissionModals from './usePermissionModals.jsx';
import { useRoleModals } from './useRoleModals.js';
import useCan from '@hooks/useCan';
import { clearGroupedPermissionsCache } from '../utils/getGroupedPermissions';
import { clearPermissionHelpersCaches } from '../utils/permissionHelpers';

/**
 * Hook principal para manejar la tabla de roles y permisos
 * Coordinador que usa hooks especializados para cada responsabilidad
 */
export const useRolesPermissionsTable = () => {
  const { data, refetch, isLoading, error } = useRolesPermissionsMatrix();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState([]);
  const { modules, submodules, invalidateCache } = useModules();
  const tableState = useTableState();
  const permissionModals = usePermissionModals({ 
    modules, 
    submodules, 
    refetch, 
    invalidateCache 
  });
  const roleModals = useRoleModals({ refetch });
  const canSeeBoth = useCan({ 
    permissions: ['view.permissions.both', 'permissions.view_both', 'permissions.view_name']
  });

  const {
    search,
    debouncedSearch,
    expandedRowKeys,
    hiddenRoles,
    handleRowExpand,
    updateHiddenRoles,
    updateSearch,
  } = tableState;
  const {
    openNewPermission,
    onEditPermission,
    onDeletePermission,
  } = permissionModals;

  const { openNewRole } = roleModals;
  const setChanges = useCallback((updater) => {
    setPendingChanges(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);
  
  const reset = useCallback(() => {
    setPendingChanges([]);
  }, []);

  const toggleHooks = useTogglePermissions({ reset });
  useEffect(() => {
    if (data) {
      clearGroupedPermissionsCache();
      clearPermissionHelpersCaches();
    }
  }, [data]);
  const overlayData = useMemo(() => {
    return computeOverlayData(data, pendingChanges);
  }, [data?.roles, data?.permissions, data?.matrix, pendingChanges]);
  const groupedData = useMemo(() => {
    return getGroupedPermissionsData(overlayData, debouncedSearch);
  }, [overlayData?.roles, overlayData?.permissions, overlayData?.matrix, debouncedSearch]);
  const { togglePermission, toggleMultiplePermissions, save: saveFn } = bindToggleHooks(toggleHooks, data, overlayData, setChanges);
  const save = useCallback(async () => saveFn(pendingChanges), [saveFn, pendingChanges]);
  const discardChanges = useCallback(() => reset(), [reset]);
  const refreshRoles = useCallback(() => queryClient.invalidateQueries({ queryKey: ['roles-permissions-matrix'] }), [queryClient]);
  const dataSource = useMemo(() => {
    const base = groupedData?.grouped;
    if (!Array.isArray(base)) {
      return [{ key: 'toggle-all', name: 'Todos los permisos', isModule: true }];
    }
    return [{ key: 'toggle-all', name: 'Todos los permisos', isModule: true }, ...base];
  }, [groupedData?.grouped]);

  const columns = useMemo(() => getRolesPermissionsColumns({
    search, setSearch: updateSearch, 
    data: overlayData || { roles: [], permissions: [], matrix: {} }, 
    canSeeBoth, onNewPermission: openNewPermission, 
    onNewRole: openNewRole, refreshRoles,
    togglePermission, toggleMultiplePermissions, 
    isToggling: toggleHooks.isToggling,
    setHiddenRoles: updateHiddenRoles, hiddenRoles, 
    onEditPermission, onDeletePermission,
  }), [
    overlayData?.roles, overlayData?.permissions, overlayData?.matrix,
    search, hiddenRoles, toggleHooks.isToggling, canSeeBoth,
    updateSearch, openNewPermission, openNewRole, refreshRoles,
    updateHiddenRoles, onEditPermission, onDeletePermission,
    togglePermission, toggleMultiplePermissions
  ]);

  return {
    columns, dataSource, expandedRowKeys,
    hasChanges: pendingChanges.length > 0,
    isToggling: toggleHooks.isToggling,
    isLoading, error,
    hiddenRoles, save, discardChanges,
    handleRowExpand, setHiddenRoles: 
    updateHiddenRoles, openNewPermission, 
    openNewRole, onEditPermission, onDeletePermission,
  };
};