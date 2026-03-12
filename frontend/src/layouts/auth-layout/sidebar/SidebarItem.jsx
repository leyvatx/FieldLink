
import SidebarItemGroup from "@layouts/auth-layout/sidebar/SidebarItemGroup";
import SidebarItemLink from "@layouts/auth-layout/sidebar/SidebarItemLink";

const SidebarItem = ({ item }) => {
  if (item.path) {
    return <SidebarItemLink item={item} />;
  }
  
  return <SidebarItemGroup item={item} />;
};

export default SidebarItem;
