import { NavLink } from "react-router-dom";
import sidebarIcons from "@layouts/auth-layout/sidebar/sidebarIcons";
import { cn } from "@/lib/utils";

const SidebarItemLink = ({ item }) => {
  const ItemIcon = sidebarIcons[item.icon];

  return (
    <NavLink
      key={item.key}
      to={item.path}
      className={({ isActive }) => cn("sidebar-item-link", isActive && "active")}>
      <div className="sidebar-item-link-icon-content">
        <ItemIcon size={18} />
      </div>
      <span className="sidebar-item-link-label">{item.label}</span>
    </NavLink>
  );
};

export default SidebarItemLink;
