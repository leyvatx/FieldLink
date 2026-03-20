import { useTheme } from "@context/ThemeProvider";

const AppLogo = ({
  style,
  compact = false,
  showWordmark = true,
  iconSize,
}) => {
  const { isDark } = useTheme();

  const primaryColor = isDark ? "#93C5FD" : "#2563EB";
  const accentColor = isDark ? "#5EEAD4" : "#0F766E";
  const neutralColor = isDark ? "#F8FAFC" : "#0F172A";
  const surfaceColor = isDark ? "#0B1120" : "#FFFFFF";
  const strokeColor = isDark ? "rgba(248, 250, 252, 0.18)" : "rgba(15, 23, 42, 0.12)";
  const resolvedIconSize =
    iconSize || (showWordmark ? (compact ? 34 : 92) : compact ? 42 : 92);

  return (
    <span
      aria-label="FieldLink"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: compact || !showWordmark ? "row" : "column",
        gap: showWordmark ? (compact ? 10 : 14) : 0,
        lineHeight: 1,
        userSelect: "none",
        width: "fit-content",
        maxWidth: "100%",
        ...style,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 96 96"
        style={{
          width: resolvedIconSize,
          height: resolvedIconSize,
          flexShrink: 0,
        }}
      >
        <rect
          x="14"
          y="14"
          width="68"
          height="68"
          rx="24"
          fill={surfaceColor}
          stroke={strokeColor}
          strokeWidth="2"
        />
        <path
          d="M33 61c-8.837 0-16-7.163-16-16s7.163-16 16-16h10"
          fill="none"
          stroke={primaryColor}
          strokeLinecap="round"
          strokeWidth="11"
        />
        <path
          d="M63 35c8.837 0 16 7.163 16 16s-7.163 16-16 16H53"
          fill="none"
          stroke={accentColor}
          strokeLinecap="round"
          strokeWidth="11"
        />
        <path
          d="M41 48h14"
          fill="none"
          stroke={neutralColor}
          strokeLinecap="round"
          strokeOpacity="0.9"
          strokeWidth="7"
        />
        <circle cx="33" cy="61" r="4.5" fill={primaryColor} />
        <circle cx="63" cy="35" r="4.5" fill={accentColor} />
      </svg>

      {showWordmark ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            fontFamily: "Geist Variable, Geist, Heebo, sans-serif",
            fontWeight: 700,
            fontSize: compact ? 18 : 46,
            letterSpacing: compact ? "-0.02em" : "-0.045em",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          <span style={{ color: neutralColor }}>Field</span>
          <span style={{ color: primaryColor }}>Link</span>
        </span>
      ) : null}
    </span>
  );
};

export default AppLogo;
