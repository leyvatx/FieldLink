import constants from "@shared/constants.json";
import {
  PiPlus,
  PiPencilSimple,
  PiTrashSimple,
  PiThumbsUp,
  PiToggleRight,
  PiCheckCircle,
  PiXCircle,
  PiArchive,
  PiUser,
  PiUserFocus,
  PiLockOpen,
} from "react-icons/pi";

// Mapear movimientos con sus íconos
export const movementsType = constants.MOVEMENTS.map((m) => {
  const icons: Record<string, any> = {
    create: PiPlus,
    edit: PiPencilSimple,
    delete: PiTrashSimple,
    confirm: PiThumbsUp,
    enable_material: PiToggleRight,
    approve: PiCheckCircle,
    reject: PiXCircle,
    archive: PiLockOpen,
    restore: PiArchive,
  };

  return {
    ...m,
    icon: icons[m.name] || null,
  };
});

// Mapear módulos con íconos
export const modules = constants.MODULES.map((m) => {
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
