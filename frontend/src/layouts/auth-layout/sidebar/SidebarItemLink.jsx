import { NavLink } from "react-router-dom";
import sidebarIcons from "@layouts/auth-layout/sidebar/sidebarIcons";

const SidebarItemLink = ({ item }) => {
  const ItemIcon = sidebarIcons[item.icon];

  return (
    <NavLink
      key={item.key}
      to={item.path}
      className={({ isActive }) => `sidebar-item-link ${isActive && "active"}`}>
      <div className="sidebar-item-link-icon-content">
        <ItemIcon size={18} />
      </div>
      <span className="sidebar-item-link-label">{item.label}</span>
    </NavLink>
  );
};

export default SidebarItemLink;
