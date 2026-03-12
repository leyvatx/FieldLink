import { createRole, updateRole, deleteRole } from "@api/roleService";
import {
  createPermission,
  updatePermission,
  deletePermission,
} from "@api/permissionService";
import {
  getModules,
  getSubmodules,
  createModule,
  createSubmodule,
} from "@api/moduleService";
import {
  batchUpdatePermissions,
  attachPermission,
  detachPermission,
  getRolesPermissionsMatrix,
} from "@api/rolesPermissionsService";

export const createNewRole = createRole;
export const updateExistingRole = updateRole;
export const deleteExistingRole = deleteRole;

export const createNewPermission = async (payload) => {
  try {
    let moduleId = payload.module;
    let submoduleId = payload.submodule;

    if (typeof moduleId === "object" && moduleId && moduleId.isNew) {
      const newModule = await createModule({ name: moduleId.name });
      moduleId = newModule.id;
    }
    if (typeof submoduleId === "object" && submoduleId && submoduleId.isNew) {
      const newSubmodule = await createSubmodule({
        name: submoduleId.name,
        module_id: moduleId,
      });
      submoduleId = newSubmodule.id;
    }
    const permissionPayload = {
      ...payload,
      module: moduleId,
      submodule: submoduleId,
    };

    const result = await createPermission(permissionPayload);
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateExistingPermission = async (id, payload) => {
  try {
    let moduleId = payload.module;
    let submoduleId = payload.submodule;
    if (typeof moduleId === "object" && moduleId && moduleId.isNew) {
      const newModule = await createModule({ name: moduleId.name });
      moduleId = newModule.id;
    }
    if (typeof submoduleId === "object" && submoduleId && submoduleId.isNew) {
      const newSubmodule = await createSubmodule({
        name: submoduleId.name,
        module_id: moduleId,
      });
      submoduleId = newSubmodule.id;
    }
    const permissionPayload = {
      ...payload,
      module: moduleId,
      submodule: submoduleId,
    };

    const result = await updatePermission(id, permissionPayload);
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteExistingPermission = deletePermission;
export const fetchModules = getModules;
export const fetchSubmodules = getSubmodules;
export const updatePermissionsBatch = batchUpdatePermissions;
export const attachPermissionToRole = attachPermission;
export const detachPermissionFromRole = detachPermission;
export const fetchRolesPermissionsMatrix = getRolesPermissionsMatrix;
