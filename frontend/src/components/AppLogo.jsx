import { useTheme } from "@context/ThemeProvider";

const AppLogo = ({
  style,
  compact = false,
  showWordmark = true,
  iconSize,
}) => {
  const { isDark } = useTheme();

  const primaryColor = isDark ? "#5AA7FF" : "#1D4ED8";
  const accentColor = isDark ? "#8EDB5B" : "#52C41A";
  const neutralColor = isDark ? "#F4F6FF" : "#1F2937";
  const surfaceColor = isDark ? "#171237" : "#FFFFFF";
  const haloColor = isDark ? "rgba(90, 167, 255, 0.16)" : "rgba(29, 78, 216, 0.12)";
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
        <circle
          cx="48"
          cy="48"
          r="42"
          fill={haloColor}
        />
        <g transform="rotate(-45 48 48)">
          <rect
            x="19"
            y="25"
            width="26"
            height="46"
            rx="13"
            fill={primaryColor}
          />
          <rect
            x="51"
            y="25"
            width="26"
            height="46"
            rx="13"
            fill={accentColor}
          />
          <rect
            x="34"
            y="34"
            width="28"
            height="28"
            rx="10"
            fill={surfaceColor}
          />
          <rect
            x="23"
            y="29"
            width="18"
            height="38"
            rx="9"
            fill="none"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="1.4"
          />
          <rect
            x="55"
            y="29"
            width="18"
            height="38"
            rx="9"
            fill="none"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="1.4"
          />
        </g>
      </svg>

      {showWordmark ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            fontFamily: "Heebo, sans-serif",
            fontWeight: 700,
            fontSize: compact ? 18 : 46,
            letterSpacing: compact ? "-0.02em" : "-0.045em",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          <span style={{ color: neutralColor }}>Field</span>
          <span style={{ color: accentColor }}>Link</span>
        </span>
      ) : null}
    </span>
  );
};

export default AppLogo;
