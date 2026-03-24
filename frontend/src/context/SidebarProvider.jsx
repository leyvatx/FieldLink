/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@context/AuthProvider";
import useUpdateSettings from "@features/settings/hooks/useUpdateSettings";

const SidebarContext = createContext();
const MOBILE_BREAKPOINT = "(max-width: 1023px)";

const getInitialMobileState = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(MOBILE_BREAKPOINT).matches;
};

export const SidebarProvider = ({ children }) => {
  const { user } = useAuth();
  const updateSettingsMutation = useUpdateSettings();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(getInitialMobileState);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (user?.settings?.sidebar) {
      setIsExpanded(user.settings.sidebar === "expanded");
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const handleChange = (event) => {
      setIsMobile(event.matches);

      if (!event.matches) {
        setIsMobileOpen(false);
      }
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsMobileOpen((previousValue) => !previousValue);
      return;
    }

    const previous = isExpanded;
    const newIsExpanded = !isExpanded;
    const newSidebarMode = newIsExpanded ? "expanded" : "collapsed";

    setIsExpanded(newIsExpanded);

    updateSettingsMutation.mutate({ sidebar: newSidebarMode }, {
      onError: () => {
        setIsExpanded(previous);
      },
    });
  }, [isExpanded, isMobile, updateSettingsMutation]);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobile,
        isMobileOpen,
        toggleSidebar,
        openMobileSidebar,
        closeMobileSidebar,
      }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
