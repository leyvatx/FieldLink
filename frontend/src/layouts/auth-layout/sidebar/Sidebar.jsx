import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PiCaretRightBold, PiMagnifyingGlassBold, PiXBold } from "react-icons/pi";
import { Input } from "@/lib/antd-compat";
import AppLogo from "@components/AppLogo";
import { useSidebar } from "@context/SidebarProvider";
import SidebarItems from "@layouts/auth-layout/sidebar/SidebarItems";
import useSidebarItems from "@layouts/auth-layout/sidebar/useSidebarItems";

const Sidebar = () => {
  const [search, setSearch] = useState("");
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const {
    isExpanded,
    isMobile,
    isMobileOpen,
    toggleSidebar,
    closeMobileSidebar,
  } = useSidebar();
  const { items, filterItems } = useSidebarItems();

  useEffect(() => {
    filterItems(search);
  }, [filterItems, search]);

  useEffect(() => {
    if (previousPathRef.current !== location.pathname && isMobileOpen) {
      closeMobileSidebar();
    }

    previousPathRef.current = location.pathname;
  }, [closeMobileSidebar, isMobileOpen, location.pathname]);

  const logoSize = isMobile || isExpanded ? 38 : 28;

  return (
    <>
      {isMobile ? (
        <button
          className="sidebar-backdrop"
          onClick={closeMobileSidebar}
          type="button"
          aria-label="Cerrar menu lateral"
          tabIndex={isMobileOpen ? 0 : -1}
        />
      ) : null}
      <aside className="sidebar" aria-hidden={isMobile ? !isMobileOpen : undefined}>
        <div className="sidebar-surface">
          <div className="sidebar-header">
            <Link
              to="/"
              className="sidebar-brand-link"
              onClick={isMobile ? closeMobileSidebar : undefined}
            >
              <span className="sidebar-brand-mark">
                <AppLogo compact showWordmark={false} iconSize={logoSize} />
              </span>
              <span className="sidebar-brand-copy">
                <span className="sidebar-brand-eyebrow">FieldLink</span>
                <strong className="sidebar-brand-title">Field Ops</strong>
              </span>
            </Link>
            {isMobile ? (
              <button
                className="sidebar-mobile-close"
                onClick={closeMobileSidebar}
                type="button"
                aria-label="Cerrar sidebar"
              >
                <PiXBold size={18} />
              </button>
            ) : null}
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
    </>
  );
};

export default Sidebar;
