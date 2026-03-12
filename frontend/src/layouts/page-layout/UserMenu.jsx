import { Dropdown } from "antd";
import { useAuth } from "@context/AuthProvider";
import { useTheme } from "@context/ThemeProvider";
import UserAvatar from "@components/UserAvatar";
import { Link } from "react-router-dom";
import { getImageUrl } from "@api/profileService";
import AppLogo from "@components/AppLogo";
import {
  PiSunFill,
  PiMoonFill,
  PiGearFill,
  PiSignOutBold,
} from "react-icons/pi";

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const profilePictureUrl = user?.profile_picture
    ? getImageUrl(user.profile_picture)
    : null;

  const normalizedUser = {
    ...user,
    avatar: user?.avatar || profilePictureUrl || null,
  };

  const items = [
    {
      key: "profile",
      label: (
        <Link
          to="/profile"
          className="flex items-center justify-start gap-2 min-w-[200px]"
        >
          <UserAvatar
            user={normalizedUser}
            size="large"
          />
          <div className="flex flex-col">
            <span>{user?.name}</span>
            <span className="text-xs text-gray-500">{user?.email}</span>
          </div>
        </Link>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "theme",
      label: `Usar modo ${isDark ? "claro" : "oscuro"}`,
      icon: isDark ? <PiSunFill size={16} /> : <PiMoonFill size={16} />,
      onClick: () => toggleTheme(),
    },
    {
      key: "config",
      label: "Configuracion",
      icon: <PiGearFill size={16} />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Cerrar sesion",
      icon: <PiSignOutBold size={16} />,
      danger: true,
      onClick: () => logout.mutate(),
    },
    {
      type: "divider",
    },
    {
      key: "brand",
      label: <AppLogo style={{ height: "20px" }} />,
    },
  ];

  return (
    <Dropdown
      menu={{ items }}
      trigger={["click"]}
    >
      <a className="rounded-full">
        <UserAvatar user={normalizedUser} />
      </a>
    </Dropdown>
  );
};

export default UserMenu;
