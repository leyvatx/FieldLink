import { useAuth } from "@context/AuthProvider";

const ROLE_PERMISSIONS = {
  OWNER: [
    "view.admin.menu",
    "view.users.option",
    "view.log.option",
    "view.roles.option",
    "release_notes.general.manage_release_notes",
    "view.permissions.both",
    "permissions.view_both",
    "permissions.view_name",
  ],
  DISPATCHER: ["view.users.option"],
  TECHNICIAN: [],
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
