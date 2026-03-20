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
        <Link to="/profile" className="flex min-w-[220px] items-center justify-start gap-3">
          <UserAvatar user={normalizedUser} size="large" />
          <div className="flex flex-col">
            <span className="font-medium">{user?.name}</span>
            <span className="text-xs text-[var(--ui-muted-foreground)]">{user?.email}</span>
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
      label: <AppLogo compact style={{ width: 108 }} />,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <button
        type="button"
        className="group flex items-center gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-card)] px-2.5 py-2 text-left shadow-[var(--ui-shadow-soft)] transition hover:bg-[var(--ui-accent)]"
      >
        <div className="hidden min-w-0 text-right sm:block">
          <div className="truncate text-sm font-medium text-[var(--ui-foreground)]">{user?.name}</div>
          <div className="truncate text-xs text-[var(--ui-muted-foreground)]">{user?.email}</div>
        </div>
        <UserAvatar user={normalizedUser} />
      </button>
    </Dropdown>
  );
};

export default UserMenu;
