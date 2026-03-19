export const PLATFORM_ROLE = "ADMIN";
export const COMPANY_ROLE = "COMPANY";
export const SUPERVISOR_ROLE = "SUPERVISOR";
export const TECHNICIAN_ROLE = "TECHNICIAN";

export const COMPANY_OPERATION_ROLES = [COMPANY_ROLE, SUPERVISOR_ROLE];

export const ROLE_LABELS = {
  [PLATFORM_ROLE]: "Admin",
  [COMPANY_ROLE]: "Empresa",
  [SUPERVISOR_ROLE]: "Supervisor",
  [TECHNICIAN_ROLE]: "Técnico",
};

export const ROLE_COLORS = {
  [PLATFORM_ROLE]: "volcano",
  [COMPANY_ROLE]: "purple",
  [SUPERVISOR_ROLE]: "blue",
  [TECHNICIAN_ROLE]: "green",
};

export const isPlatformAdmin = (user) =>
  Boolean(user?.is_superuser || user?.role === PLATFORM_ROLE);

export const isCompanyAdmin = (user) => user?.role === COMPANY_ROLE;

export const isSupervisor = (user) => user?.role === SUPERVISOR_ROLE;

export const isTechnician = (user) => user?.role === TECHNICIAN_ROLE;
