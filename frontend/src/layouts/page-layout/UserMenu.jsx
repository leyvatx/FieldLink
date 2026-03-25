import { Link } from "react-router-dom";
import { PiGearFill, PiMoonFill, PiSignOutBold, PiSunFill } from "react-icons/pi";
import { Dropdown } from "@/lib/antd-compat";
import { getImageUrl } from "@api/profileService";
import AppLogo from "@components/AppLogo";
import UserAvatar from "@components/UserAvatar";
import { useAuth } from "@context/AuthProvider";
import { useTheme } from "@context/ThemeProvider";

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const profilePictureUrl = user?.profile_picture ? getImageUrl(user.profile_picture) : null;

  const normalizedUser = {
    ...user,
    avatar: user?.avatar || profilePictureUrl || null,
  };

  const items = [
    {
      key: "profile",
      label: (
        <Link to="/profile" className="flex w-[min(240px,calc(100vw-7rem))] items-center justify-start gap-3">
          <UserAvatar user={normalizedUser} size="large" />
          <div className="min-w-0 flex flex-col">
            <span className="font-medium">{user?.name}</span>
            <span className="truncate text-xs text-[var(--ui-muted-foreground)]">{user?.email}</span>
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
      label: "Cerrar sesión",
      icon: <PiSignOutBold size={16} />,
      danger: true,
      onClick: () => logout.mutate(),
    },
    {
      type: "divider",
    },
    {
      key: "brand",
      label: <AppLogo compact style={{ width: 108 }} />,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <button
        type="button"
        aria-label="Abrir men? de usuario"
        className="group inline-flex h-10 w-10 items-center justify-center rounded-2xl text-left transition hover:scale-[1.02]"
      >
        <UserAvatar user={normalizedUser} size={40} />
      </button>
    </Dropdown>
  );
};

export default UserMenu;
