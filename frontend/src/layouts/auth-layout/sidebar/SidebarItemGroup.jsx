import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import classnames from "classnames";
import SidebarItem from "@layouts/auth-layout/sidebar/SidebarItem";
import { PiCaretRight } from "react-icons/pi";
import sidebarIcons from "@layouts/auth-layout/sidebar/sidebarIcons";

const SidebarItemGroup = ({ item }) => {
  const location = useLocation();
  const hasActiveChild = useMemo(
    () =>
      item.children?.some(
        (child) => child.path && location.pathname.startsWith(child.path)
      ),
    [item.children, location.pathname]
  );
  const [open, setOpen] = useState(hasActiveChild || item.defaultOpen);

  useEffect(() => {
    if (hasActiveChild || item.defaultOpen) {
      setOpen(true);
      return;
    }

    setOpen(false);
  }, [hasActiveChild, item.defaultOpen]);

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
        type="button"
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
