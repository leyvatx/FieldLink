import { useEffect, useMemo, useState } from "react";
import { sidebarItems } from "./sidebar.config";
import { useAuth } from "@context/AuthProvider";

const useSidebarItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const filterItemsByPermissions = (entries) => {
    return entries.reduce((acc, item) => {
      const isSuperuser = !!user?.is_superuser;
      const hasRoleAccess = !item.roles || item.roles.includes(user?.role);
      const hasPermissionAccess =
        !item.permission || user?.permissions?.includes(item.permission);
      const passesSuperuserCheck =
        (!item.superuserOnly || isSuperuser) &&
        (!item.hideForSuperuser || !isSuperuser);

      const filteredChildren = item.children
        ? filterItemsByPermissions(item.children)
        : [];

      const hasVisibleChildren = filteredChildren.length > 0;
      const isVisible =
        hasRoleAccess &&
        hasPermissionAccess &&
        passesSuperuserCheck &&
        (item.path || hasVisibleChildren);

      if (!isVisible) {
        return acc;
      }

      acc.push({
        ...item,
        children: hasVisibleChildren ? filteredChildren : undefined,
      });

      return acc;
    }, []);
  };

  const initialItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return filterItemsByPermissions(sidebarItems);
  }, [user]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filterItems = (text) => {
    if (!text) {
      setItems(initialItems);
      return;
    }

    const search = (entries) => {
      return entries
        .map((item) => {
          const match = item.wordkeys?.some((word) =>
            word.toLowerCase().includes(text.toLowerCase())
          );
          const childMatches = item.children ? search(item.children) : [];

          if (match || childMatches.length > 0) {
            return {
              ...item,
              children: childMatches.length > 0 ? childMatches : undefined,
            };
          }

          return null;
        })
        .filter(Boolean);
    };

    setItems(search(initialItems));
  };

  return {
    items,
    filterItems,
  };
};

export default useSidebarItems;
