import { getGroupedPermissions } from "./getGroupedPermissions";
import { ERROR_TRANSLATIONS, ERROR_PATTERNS } from '../constants/translations';

export const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
export const deepClone = (obj) => structuredClone?.(obj) ?? JSON.parse(JSON.stringify(obj));

export const getGroupedPermissionsData = (data, search) => {
  if (!data?.permissions) return { grouped: [], total: 0 };
  
  const q = search.trim().toLowerCase();
  if (!q) {
    const grouped = getGroupedPermissions(data, "");
    return { grouped, total: data.permissions.length };
  }

  const filteredPerms = data.permissions.filter((perm) => {
    const searchableText = [
      perm.name,
      perm.description,
      perm.module?.name,
      perm.submodule?.name
    ].filter(Boolean).join(' ').toLowerCase();
    return searchableText.includes(q);
  });

  return { 
    grouped: getGroupedPermissions({ ...data, permissions: filteredPerms }, ""), 
    total: filteredPerms.length 
  };
};

export const bindToggleHooks = (toggleHooks, data, overlayData, setChanges) => {
  if (!toggleHooks) {
    return {
      togglePermission: () => {},
      toggleMultiplePermissions: () => {},
      save: async () => {},
      isToggling: false,
    };
  }

  return {
    togglePermission: (roleId, permissionId) => 
      toggleHooks.togglePermission?.(roleId, permissionId, data, overlayData, setChanges),
    toggleMultiplePermissions: (roleId, permissionIds, attach = true) => 
      toggleHooks.toggleMultiplePermissions?.(roleId, permissionIds, data, attach, setChanges),
    save: async (pendingChanges) => toggleHooks.save?.(pendingChanges),
    isToggling: !!toggleHooks.isToggling
  };
};

export const buildBatchPayload = (pendingChanges = []) => {
  const { attachMap, detachMap } = pendingChanges.reduce((acc, ch) => {
    const roleId = Number(ch.roleId);
    const mapKey = ch.action === 'attach' ? 'attachMap' : 'detachMap';
    acc[mapKey][roleId] = acc[mapKey][roleId] || new Set();
    acc[mapKey][roleId].add(ch.permissionId);
    return acc;
  }, { attachMap: {}, detachMap: {} });

  const attach = Object.entries(attachMap).map(([roleId, permissionIds]) => ({ 
    roleId: Number(roleId), 
    permissionIds: Array.from(permissionIds) 
  }));
  const detach = Object.entries(detachMap).map(([roleId, permissionIds]) => ({ 
    roleId: Number(roleId), 
    permissionIds: Array.from(permissionIds) 
  }));

  return { attach, detach };
};

const normalizeName = (str) => (str || '').toString().toLowerCase().replace(/[-_\s]/g, ' ');

export const inferPermissionIds = (full, modules = [], submodules = []) => {
  const initial = {
    id: full?.id,
    name: full?.name || '',
    description: full?.description || full?.desc || '',
    module_id: full?.module_id ?? full?.module?.id,
    submodule_id: full?.submodule_id ?? (full?.submodule?.id ?? undefined),
  };

  if (!initial.module_id && initial.name) {
    const parts = initial.name.split('.');
    if (parts.length >= 3) {
      const modCandidate = parts[0].toString().toLowerCase().replace(/\s+/g, '');
      const modFound = modules.find(m => 
        (m.name || '').toString().toLowerCase().replace(/\s+/g, '') === modCandidate
      );
      if (modFound) initial.module_id = modFound.id;
    }
  }

  let found = null;
  if (!initial.submodule_id) {
    if (full?.submodule_id) {
      const sid = Number(full.submodule_id);
      found = submodules.find(s => 
        Number(s.id) === sid && Number(s.module_id) === Number(initial.module_id)
      );
    }
    if (!found && full?.submodule) {
      if (typeof full.submodule === 'object' && full.submodule?.id) {
        const sid = Number(full.submodule.id);
        found = submodules.find(s => 
          Number(s.id) === sid && Number(s.module_id) === Number(initial.module_id)
        );
      } else if (typeof full.submodule === 'string') {
        const subName = normalizeName(full.submodule);
        found = submodules.find(s => 
          Number(s.module_id) === Number(initial.module_id) && 
          normalizeName(s.name) === subName
        );
      }
    }
    if (!found && initial.name) {
      const parts = initial.name.split('.');
      if (parts.length >= 3) {
        const candidateSub = normalizeName(parts[1]);
        found = submodules.find(s => 
          Number(s.module_id) === Number(initial.module_id) && 
          normalizeName(s.name) === candidateSub
        );
      }
    }
    
    if (found) initial.submodule_id = found.id;
  }
  if (initial.module_id && initial.submodule_id && initial.name) {
    const mod = modules.find(m => m.id == initial.module_id);
    const sub = submodules.find(s => s.id == initial.submodule_id);
    if (mod && sub) {
      const prefix = `${mod.name.toLowerCase().replace(/\s+/g, '')}.${sub.name.toLowerCase().replace(/\s+/g, '')}.`;
      if (initial.name.startsWith(prefix)) {
        initial.name = initial.name.slice(prefix.length);
      }
    }
  }
  
  return initial;
};

export const translateError = (msg) => {
  if (!msg) return msg;
  if (ERROR_TRANSLATIONS[msg]) return ERROR_TRANSLATIONS[msg];
  
  for (const { regex, translation } of ERROR_PATTERNS) {
    const match = msg.match(regex);
    if (match) return translation(match[1]);
  }
  
  return msg;
};

export const computeOverlayData = (data, pendingChanges = []) => {
  if (!data) return null;
  if (pendingChanges.length === 0) return data;
  const out = deepClone(data);
  out.matrix = out.matrix || {};
    const changesByRole = pendingChanges.reduce((acc, ch) => {
      const roleId = Number(ch.roleId);
      if (!acc[roleId]) acc[roleId] = [];
      acc[roleId].push(ch);
      return acc;
    }, {});
    
    Object.entries(changesByRole).forEach(([roleId, changes]) => {
      const r = Number(roleId);
      if (!out.matrix[r]) out.matrix[r] = [];
      
      changes.forEach(ch => {
        const p = Number(ch.permissionId);
        if (ch.action === 'attach') {
          if (!out.matrix[r].includes(p)) out.matrix[r].push(p);
        } else {
          out.matrix[r] = out.matrix[r].filter(id => id !== p);
        }
      });
    });
    if (Array.isArray(out.roles) && Array.isArray(out.permissions)) {
      for (const role of out.roles) {
        const ids = out.matrix[role.id] || [];
        role.permissions = out.permissions.filter(per => ids.includes(per.id));
      }
    }
    
    return out;
};