import { useEffect, useMemo, useState } from "react";
import { sidebarItems } from "./sidebar.config";
import { useAuth } from "@context/AuthProvider";

const useSidebarItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const filterItemsByPermissions = (items) => {
    return items
      .filter((item) => {
        if (!item.permission) {
          return true;
        }

        return user?.permissions?.includes(item.permission);
      })
      .map((item) => ({
        ...item,
        children: item.children
          ? filterItemsByPermissions(item.children)
          : undefined,
      }));
  };

  // ✅ Generar los ítems iniciales en base a permisos
  const initialItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return filterItemsByPermissions(sidebarItems);
  }, [user]);

  // Seteamos los ítems visibles
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filterItems = (text) => {
    if (!text) return setItems(initialItems);

    const search = (items) => {
      return items
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
