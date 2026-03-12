import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PiCaretRightBold } from "react-icons/pi";
import { Input } from "antd";
import FieldLinkLogo from "@assets/images/fieldlink-logo.png";
import { useSidebar } from "@context/SidebarProvider";
import SidebarItems from "@layouts/auth-layout/sidebar/SidebarItems";
import useSidebarItems from "@layouts/auth-layout/sidebar/useSidebarItems";

const Sidebar = () => {
  const [search, setSearch] = useState("");
  const { toggleSidebar } = useSidebar();
  const { items, filterItems } = useSidebarItems();

  useEffect(() => {
    filterItems(search);
  }, [search]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Link to="/dashboard">
          <img
            src={FieldLinkLogo}
            alt="FieldLink Logo"
            style={{ minWidth: 36, maxWidth: 36 }}
          />
        </Link>
      </div>
      <div className="sidebar-body">
        <Input onChange={(e) => setSearch(e.target.value)} />
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
