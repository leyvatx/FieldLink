import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@context/AuthProvider";
import useUpdateSettings from "@features/settings/hooks/useUpdateSettings";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const { user } = useAuth();
  const updateSettingsMutation = useUpdateSettings();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user?.settings?.sidebar) {
      setIsExpanded(user.settings.sidebar === "expanded");
    }
  }, [user]);

  const toggleSidebar = () => {
    const previous = isExpanded;
    const newIsExpanded = !isExpanded;
    const newSidebarMode = newIsExpanded ? "expanded" : "collapsed";

    setIsExpanded(newIsExpanded);

    updateSettingsMutation.mutate({ sidebar: newSidebarMode }, {
      onError: () => {
        setIsExpanded(previous);
      },
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        toggleSidebar,
      }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
