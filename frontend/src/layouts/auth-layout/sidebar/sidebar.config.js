export const sidebarItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "PiHouseFill",
    wordkeys: ["dashboard", "inicio", "home"],
    path: "/dashboard",
  },
  {
    key: "profile",
    label: "Perfil",
    icon: "PiUserFill",
    wordkeys: ["perfil", "usuario", "cuenta"],
    path: "/profile",
  },
  {
    key: "users",
    label: "Usuarios",
    icon: "PiUsersThreeFill",
    permission: "view.users.option",
    wordkeys: ["usuarios", "users", "staff"],
    path: "/users",
  },
];
