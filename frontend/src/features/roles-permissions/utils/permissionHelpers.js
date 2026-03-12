const permissionIdsCache = new Map();

export function getPermissionIdsForRecord(record) {
  if (!record) return [];
  const cacheKey = `${record.key}-${record.isModule}-${record.isSubmodule}`;
  if (permissionIdsCache.has(cacheKey)) {
    return permissionIdsCache.get(cacheKey);
  }
  
  let result = [];
  
  if (record.isModule) {
    result = record.children ? record.children.flatMap(sub => 
      sub.children ? sub.children.map(p => p.perm.id) : []
    ) : [];
  } else if (record.isSubmodule) {
    result = record.children ? record.children.map(p => p.perm.id) : [];
  } else {
    result = [record.perm?.id || record.id].filter(Boolean);
  }
  permissionIdsCache.set(cacheKey, result);
  return result;
}
const allCheckedCache = new Map();

export function areAllChecked(data, roleId, permissionIds = []) {
  if (!data || !data.matrix) return false;
  if (!permissionIds || permissionIds.length === 0) return false;
  const cacheKey = `${roleId}-${permissionIds.join(',')}-${JSON.stringify(data.matrix[roleId] || [])}`;
  if (allCheckedCache.has(cacheKey)) {
    return allCheckedCache.get(cacheKey);
  }
  
  const result = permissionIds.every(pid => data.matrix[roleId]?.includes(pid));
  if (allCheckedCache.size > 1000) {
    const firstKey = allCheckedCache.keys().next().value;
    allCheckedCache.delete(firstKey);
  }
  allCheckedCache.set(cacheKey, result);
  
  return result;
}

export function permissionIdsToUpdate(data, roleId, permissionIds = [], targetChecked) {
  if (!data || !data.matrix) return [];
  if (targetChecked) {
    return permissionIds.filter(pid => !data.matrix[roleId]?.includes(pid));
  }
  return permissionIds.filter(pid => data.matrix[roleId]?.includes(pid));
}
export function clearPermissionHelpersCaches() {
  permissionIdsCache.clear();
  allCheckedCache.clear();
}
