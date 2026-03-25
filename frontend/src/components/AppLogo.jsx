import { useId } from "react";
import { useTheme } from "@context/ThemeProvider";

const AppLogo = ({
  style,
  compact = false,
  showWordmark = true,
  iconSize,
}) => {
  const { isDark } = useTheme();
  const gradientScope = useId().replace(/:/g, "");

  const surfaceColor = isDark ? "#0A0910" : "#FFFFFF";
  const surfaceSecondary = isDark ? "#161124" : "#F7F1FF";
  const strokeColor = isDark ? "rgba(196, 181, 253, 0.24)" : "rgba(109, 40, 217, 0.14)";
  const textColor = isDark ? "#F7F4FF" : "#1B1430";
  const resolvedIconSize =
    iconSize || (showWordmark ? (compact ? 34 : 92) : compact ? 42 : 92);
  const routeGradientId = `fieldlink-route-${gradientScope}`;
  const branchGradientId = `fieldlink-branch-${gradientScope}`;
  const glowGradientId = `fieldlink-glow-${gradientScope}`;

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
        <defs>
          <linearGradient id={routeGradientId} x1="28" y1="24" x2="70" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E9D5FF" />
            <stop offset="35%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id={branchGradientId} x1="34" y1="58" x2="68" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <radialGradient id={glowGradientId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(66 26) rotate(132) scale(42)">
            <stop offset="0%" stopColor="rgba(196, 181, 253, 0.72)" />
            <stop offset="100%" stopColor="rgba(196, 181, 253, 0)" />
          </radialGradient>
        </defs>

        <rect
          x="12"
          y="12"
          width="72"
          height="72"
          rx="24"
          fill={surfaceColor}
          stroke={strokeColor}
          strokeWidth="1.5"
        />
        <rect
          x="18"
          y="18"
          width="60"
          height="60"
          rx="20"
          fill={surfaceSecondary}
          opacity="0.96"
        />
        <circle cx="66" cy="28" r="22" fill={`url(#${glowGradientId})`} />
        <path
          d="M30 68V28H58"
          fill="none"
          stroke={`url(#${routeGradientId})`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="10"
        />
        <path
          d="M30 48H50L68 66"
          fill="none"
          stroke={`url(#${branchGradientId})`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="10"
        />
        <circle cx="30" cy="28" r="6" fill="#F5E8FF" />
        <circle cx="50" cy="48" r="5.5" fill="#C084FC" />
        <circle cx="68" cy="66" r="7" fill="#7C3AED" />
      </svg>

      {showWordmark ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: compact ? 4 : 6,
            fontFamily: "Geist Variable, Geist, Sora, sans-serif",
            fontWeight: 700,
            fontSize: compact ? 18 : 46,
            letterSpacing: compact ? "-0.03em" : "-0.05em",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          <span style={{ color: textColor }}>Field</span>
          <span
            style={{
              background: "linear-gradient(135deg, #C084FC 0%, #8B5CF6 48%, #6D28D9 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Link
          </span>
        </span>
      ) : null}
    </span>
  );
};

export default AppLogo;
