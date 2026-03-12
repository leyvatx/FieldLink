import { useTheme } from "@context/ThemeProvider";

const AppLogo = ({ style, compact = false }) => {
  const { isDark } = useTheme();

  return (
    <span
      aria-label="FieldLink"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        letterSpacing: "0.4px",
        color: isDark ? "#f5f5f5" : "#1f2937",
        fontSize: compact ? 14 : 22,
        lineHeight: 1,
        userSelect: "none",
        ...style,
      }}
    >
      FieldLink
    </span>
  );
};

export default AppLogo;
