import { useCallback, useEffect, useMemo, useState } from "react";
import { sidebarItems } from "./sidebar.config";
import { useAuth } from "@context/AuthProvider";

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const useSidebarItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const filterItemsByPermissions = useCallback(
    (entries) => {
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
    },
    [user]
  );

  const initialItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return filterItemsByPermissions(sidebarItems);
  }, [filterItemsByPermissions, user]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filterItems = useCallback(
    (text) => {
      if (!text) {
        setItems(initialItems);
        return;
      }

      const normalizedSearch = normalizeText(text);

      const search = (entries) => {
        return entries
          .map((item) => {
            const searchableValues = [
              item.label,
              item.key,
              item.path,
              ...(item.wordkeys || []),
            ];
            const match = searchableValues.some((value) =>
              normalizeText(value).includes(normalizedSearch)
            );
            const childMatches = item.children ? search(item.children) : [];

            if (match || childMatches.length > 0) {
              return {
                ...item,
                defaultOpen: Boolean(item.children?.length),
                children: item.children
                  ? match
                    ? item.children
                    : childMatches
                  : undefined,
              };
            }

            return null;
          })
          .filter(Boolean);
      };

      setItems(search(initialItems));
    },
    [initialItems]
  );

  return {
    items,
    filterItems,
  };
};

export default useSidebarItems;
