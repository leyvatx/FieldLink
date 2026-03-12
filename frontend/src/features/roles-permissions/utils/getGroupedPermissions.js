let permissionRoleMapCache = null;
let lastDataHash = null;
let roleChecksCacheMap = new Map();

export function clearGroupedPermissionsCache() {
  permissionRoleMapCache = null;
  lastDataHash = null;
  roleChecksCacheMap.clear();
}

function getDataHash(data) {
  if (!data?.matrix || !data?.roles) return null;
  const matrixKeys = Object.keys(data.matrix).sort();
  const matrixSize = matrixKeys.reduce((acc, key) => acc + (data.matrix[key]?.length || 0), 0);
  return `${data.roles.length}-${matrixKeys.length}-${matrixSize}`;
}

function buildPermissionRoleMap(data) {
  if (!data?.matrix || !data?.roles) return {};
  
  const currentHash = getDataHash(data);
  if (currentHash === lastDataHash && permissionRoleMapCache) {
    return permissionRoleMapCache;
  }
  
  const map = {};
  Object.entries(data.matrix).forEach(([roleId, permIds]) => {
    const roleIdNum = parseInt(roleId);
    if (permIds && permIds.length > 0) {
      permIds.forEach(pid => {
        if (!map[pid]) map[pid] = {};
        map[pid][roleIdNum] = true;
      });
    }
  });
  permissionRoleMapCache = map;
  lastDataHash = currentHash;
  
  return map;
}

export function getGroupedPermissions(data, search) {
  if (!data?.permissions) return [];
  
  const permRoleMap = buildPermissionRoleMap(data);
  const q = search ? search.toLowerCase() : null;
  const cacheKey = `${data.roles?.length || 0}-${data.permissions?.length || 0}-${getDataHash(data)}`;
  let roleChecksCache = roleChecksCacheMap.get(cacheKey);
  
  if (!roleChecksCache && data.roles) {
    roleChecksCache = {};
    data.permissions.forEach(perm => {
      roleChecksCache[perm.id] = {};
      data.roles.forEach(role => {
        roleChecksCache[perm.id][`role_${role.id}`] = !!(permRoleMap[perm.id]?.[role.id]);
      });
    });
    roleChecksCacheMap.set(cacheKey, roleChecksCache);
    if (roleChecksCacheMap.size > 10) {
      const oldestKey = roleChecksCacheMap.keys().next().value;
      roleChecksCacheMap.delete(oldestKey);
    }
  }
  if (!roleChecksCache) {
    roleChecksCache = {};
  }
  const permissionsToProcess = q 
    ? data.permissions.filter(perm => {
        const moduleName = perm.module?.name || 'Sin Módulo';
        const submoduleName = perm.submodule?.name || 'Sin Submódulo';
        const searchText = `${perm.name} ${perm.description || ''} ${moduleName} ${submoduleName}`.toLowerCase();
        return searchText.includes(q);
      })
    : data.permissions;
  const modules = {};
  permissionsToProcess.forEach(perm => {
    const moduleName = perm.module?.name || 'Sin Módulo';
    const submoduleName = perm.submodule?.name || 'Sin Submódulo';
    
    if (!modules[moduleName]) modules[moduleName] = {};
    if (!modules[moduleName][submoduleName]) modules[moduleName][submoduleName] = [];
    modules[moduleName][submoduleName].push(perm);
  });
  return Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, submodules]) => {
      const filteredSubmodules = Object.entries(submodules)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([submodule, perms]) => {
          if (perms.length === 0) return null;
          
          const sortedPerms = perms.sort((a, b) => a.name.localeCompare(b.name));
          
          return {
            key: `${module}-${submodule}`,
            name: submodule,
            isSubmodule: true,
            children: sortedPerms.map((perm) => ({
              key: perm.id,
              name: perm.name,
              perm,
              module: perm.module?.name,
              submodule: perm.submodule?.name,
              ...(roleChecksCache[perm.id] || {}),
            })),
          };
        })
        .filter(Boolean);

      if (filteredSubmodules.length === 0) return null;
      
      return {
        key: module,
        name: module,
        isModule: true,
        children: filteredSubmodules,
      };
    })
    .filter(Boolean);
}
