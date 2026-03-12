import constants from "@shared/constants.json";

import {
  PiThumbsUp,
  PiUser,
  PiUserFocus,
  PiLockOpen,
  PiToggleRight,
  PiCheckCircle,
  PiXCircle,
  PiArchiveFill,
  PiPencilFill,
  PiTrashFill,
  PiPlusBold,
} from "react-icons/pi";

// Mapear movimientos con sus íconos
export const movementsType = Object.values(constants.MOVEMENTS).map((m) => {
  const icons: Record<string, any> = {
    create: PiPlusBold,
    edit: PiPencilFill,
    delete: PiTrashFill,
    confirm: PiThumbsUp,
    enable_material: PiToggleRight,
    approve: PiCheckCircle,
    reject: PiXCircle,
    archive: PiArchiveFill,
    restore: PiArchiveFill,
  };

  return {
    ...m,
    icon: icons[m.name] || null,
  };
});

// Mapear módulos con íconos
export const modules = Object.values(constants.MODULES).map((m) => {
  const icons: Record<string, any> = {
    user: PiUser,
    role: PiUserFocus,
    permission: PiLockOpen,
  };

  return {
    ...m,
    icon: icons[m.name] || null,
  };
});
