import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PiCaretRightBold, PiMagnifyingGlassBold } from "react-icons/pi";
import { Input } from "@/lib/antd-compat";
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
  }, [filterItems, search]);

  return (
    <aside className="sidebar">
      <div className="sidebar-surface">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand-link">
            <span className="sidebar-brand-mark">
              <AppLogo compact showWordmark={false} iconSize={isExpanded ? 38 : 28} />
            </span>
            <span className="sidebar-brand-copy">
              <span className="sidebar-brand-eyebrow">FieldLink</span>
              <strong className="sidebar-brand-title">Field Ops</strong>
            </span>
          </Link>
        </div>
        <div className="sidebar-body">
          <div className="sidebar-search-shell">
            <Input
              allowClear
              prefix={<PiMagnifyingGlassBold size={16} />}
              placeholder="Buscar modulo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <SidebarItems items={items} />
        </div>
      </div>
      <button className="sidebar-toggle-btn" onClick={toggleSidebar} type="button" aria-label="Cambiar tamano del sidebar">
        <PiCaretRightBold />
      </button>
    </aside>
  );
};

export default Sidebar;
