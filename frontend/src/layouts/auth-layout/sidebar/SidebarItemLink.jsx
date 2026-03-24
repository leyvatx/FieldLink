import { NavLink } from "react-router-dom";
import sidebarIcons from "@layouts/auth-layout/sidebar/sidebarIcons";
import { cn } from "@/lib/utils";
import { useSidebar } from "@context/SidebarProvider";

const SidebarItemLink = ({ item }) => {
  const ItemIcon = sidebarIcons[item.icon];
  const { isMobile, closeMobileSidebar } = useSidebar();

  return (
    <NavLink
      key={item.key}
      to={item.path}
      onClick={isMobile ? closeMobileSidebar : undefined}
      className={({ isActive }) => cn("sidebar-item-link", isActive && "active")}>
      <div className="sidebar-item-link-icon-content">
        <ItemIcon size={18} />
      </div>
      <span className="sidebar-item-link-label">{item.label}</span>
    </NavLink>
  );
};

export default SidebarItemLink;
