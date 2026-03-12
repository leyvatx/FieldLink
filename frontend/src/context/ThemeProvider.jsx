import { createContext, useContext, useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";
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
            colorPrimary: "#6E59E2",
            colorBgContainer: isDark ? "#242334" : "#fff",
            colorBgElevated: isDark ? "#313046" : "#fff",
            fontFamily: "Heebo, system-ui, sans-serif",
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
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
