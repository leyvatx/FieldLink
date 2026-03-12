import { Outlet } from "react-router-dom";
import classNames from "classnames";
import { useSidebar } from "@context/SidebarProvider";
import Sidebar from "@layouts/auth-layout/sidebar/Sidebar";
import Main from "@layouts/auth-layout/Main";

const AuthLayout = () => {
  const { isExpanded } = useSidebar();

  const layoutClass = classNames("layout", {
    "sidebar-expanded": isExpanded,
    "sidebar-collapsed": !isExpanded,
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
