import { useState } from "react";
import classnames from "classnames";
import SidebarItem from "@layouts/auth-layout/sidebar/SidebarItem";
import { PiCaretRight } from "react-icons/pi";
import sidebarIcons from "@layouts/auth-layout/sidebar/sidebarIcons";

const SidebarItemGroup = ({ item }) => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen((prevValue) => !prevValue);
  };

  const groupClassName = classnames("sidebar-item-group", {
    open: open,
  });

  const ItemIcon = sidebarIcons[item.icon];

  return (
    <div className={groupClassName}>
      <button
        className="sidebar-item-group-btn"
        type="text"
        onClick={toggleOpen}>
        <div className="flex items-center">
          <div className="sidebar-item-group-btn-icon">
            <ItemIcon size={18} />
          </div>
          <span className="sidebar-item-group-btn-label">{item.label}</span>
        </div>
        <div className="sidebar-item-group-btn-arrow">
          <PiCaretRight size={18} />
        </div>
      </button>

      <div className="sidebar-item-group-children">
        {item.children.map((child) => (
          <SidebarItem key={child.key} item={child} />
        ))}
      </div>
    </div>
  );
};

export default SidebarItemGroup;
