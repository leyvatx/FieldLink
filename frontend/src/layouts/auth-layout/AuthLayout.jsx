import { Outlet } from "react-router-dom";
import classNames from "classnames";
import { useSidebar } from "@context/SidebarProvider";
import Sidebar from "@layouts/auth-layout/sidebar/Sidebar";
import Main from "@layouts/auth-layout/Main";

const AuthLayout = () => {
  const { isExpanded, isMobile, isMobileOpen } = useSidebar();

  const layoutClass = classNames("layout", {
    "sidebar-expanded": !isMobile && isExpanded,
    "sidebar-collapsed": !isMobile && !isExpanded,
    "sidebar-mobile": isMobile,
    "sidebar-mobile-open": isMobile && isMobileOpen,
  });

  return (
    <div className={layoutClass}>
      <Sidebar />
      <Main>
        <Outlet />
      </Main>
    </div>
  );
};

export default AuthLayout;
