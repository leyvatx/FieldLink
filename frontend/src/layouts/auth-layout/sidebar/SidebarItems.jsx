import SidebarItem from "@layouts/auth-layout/sidebar/SidebarItem";
import SidebarItemLink from "@layouts/auth-layout/sidebar/SidebarItemLink";

const SidebarItems = ({ items }) => {
  return (
    <div className="sidebar-items">
      {items.map((item) =>
        item.path ? (
          <SidebarItemLink key={item.key} item={item} />
        ) : (
          <SidebarItem key={item.key} item={item} />
        )
      )}
    </div>
  );
};

export default SidebarItems;
