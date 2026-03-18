import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PiCaretRightBold } from "react-icons/pi";
import { Input } from "antd";
import AppLogo from "@components/AppLogo";
import { useSidebar } from "@context/SidebarProvider";
import SidebarItems from "@layouts/auth-layout/sidebar/SidebarItems";
import useSidebarItems from "@layouts/auth-layout/sidebar/useSidebarItems";

const Sidebar = () => {
  const [search, setSearch] = useState("");
  const { isExpanded, toggleSidebar } = useSidebar();
  const { items, filterItems } = useSidebarItems();

  useEffect(() => {
    filterItems(search);
  }, [search]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Link
          to="/"
          className="sidebar-brand-link"
        >
          <span className="sidebar-brand-mark">
            <AppLogo
              compact
              showWordmark={false}
              iconSize={isExpanded ? 48 : 34}
            />
          </span>
        </Link>
      </div>
      <div className="sidebar-body">
        <Input
          placeholder="Buscar módulo"
          onChange={(event) => setSearch(event.target.value)}
        />
        <SidebarItems items={items} />
      </div>
      <button
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
      >
        <PiCaretRightBold />
      </button>
    </div>
  );
};

export default Sidebar;
