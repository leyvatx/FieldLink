/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { ConfigProvider, theme } from "@/lib/antd-compat";
import { Toaster } from "sonner";
import { useAuth } from "@context/AuthProvider";
import { useMessage } from "@context/MessageProvider";
import useUpdateSettings from "@features/settings/hooks/useUpdateSettings";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const { contextHolder } = useMessage();
  const updateSettingsMutation = useUpdateSettings();

  const [mode, setMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  useEffect(() => {
    if (user?.settings?.theme) {
      setMode(user.settings.theme);
    }
  }, [user]);

  useEffect(() => {
    updateHtmlClass(mode);
  }, [mode]);

  const updateHtmlClass = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
  };

  const toggleTheme = () => {
    const previous = mode;
    const newMode = mode === "light" ? "dark" : "light";

    setMode(newMode);
    updateHtmlClass(newMode);

    updateSettingsMutation.mutate(
      { theme: newMode },
      {
        onError: () => {
          setMode(previous);
          updateHtmlClass(previous);
        },
      }
    );
  };

  const isDark = mode === "dark";

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, isDark }}>
      <ConfigProvider
        theme={{
          cssVar: false,
          hashed: false,
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: isDark ? "#fafafa" : "#18181b",
            colorBgContainer: isDark ? "#111113" : "#ffffff",
            colorBgElevated: isDark ? "#161619" : "#ffffff",
            fontFamily: "Geist Variable, Geist, Heebo, system-ui, sans-serif",
          },
          components: {
            Card: {
              borderRadiusLG: 16,
            },
            Tag: {
              marginXS: 0,
            },
          },
        }}>
        {contextHolder}
        <Toaster
          theme={isDark ? "dark" : "light"}
          closeButton
          richColors
          expand
          toastOptions={{
            className: "fd-toast",
          }}
        />
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
