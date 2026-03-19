import { useAuth } from "@context/AuthProvider";
import {
  COMPANY_ROLE,
  PLATFORM_ROLE,
  SUPERVISOR_ROLE,
  TECHNICIAN_ROLE,
} from "@utils/constants/roles";

const ROLE_PERMISSIONS = {
  [PLATFORM_ROLE]: [
    "view.admin.menu",
    "view.users.option",
    "view.companies.option",
    "view.log.option",
    "view.roles.option",
    "view.release_notes.option",
    "release_notes.general.manage_release_notes",
    "view.permissions.both",
    "permissions.view_both",
    "permissions.view_name",
    "roles.create",
    "roles.edit",
    "roles.delete",
    "permissions.create",
    "permissions.edit",
    "permissions.delete",
  ],
  [COMPANY_ROLE]: ["view.users.option", "view.subscription.option"],
  [SUPERVISOR_ROLE]: ["view.users.option"],
  [TECHNICIAN_ROLE]: [],
};

const useCan = ({ permission = null, permissions = [], all = false }) => {
  const { user, loadingUser } = useAuth();

  if (loadingUser || !user) {
    return false;
  }

  const effectivePermissions =
    user.permissions || ROLE_PERMISSIONS[user.role] || [];

  if (permission) {
    return effectivePermissions.includes(permission);
  }

  if (!permissions.length) {
    return false;
  }

  return all
    ? permissions.every((item) => effectivePermissions.includes(item))
    : permissions.some((item) => effectivePermissions.includes(item));
};

export default useCan;
