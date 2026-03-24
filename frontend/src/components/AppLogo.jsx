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

  const surfaceColor = isDark ? "#0E0A18" : "#FFFFFF";
  const surfaceSecondary = isDark ? "#160F24" : "#F6F0FF";
  const strokeColor = isDark ? "rgba(196, 181, 253, 0.22)" : "rgba(124, 58, 237, 0.16)";
  const textColor = isDark ? "#F8F5FF" : "#1F1633";
  const resolvedIconSize =
    iconSize || (showWordmark ? (compact ? 34 : 92) : compact ? 42 : 92);
  const frameGradientId = `fieldlink-frame-${gradientScope}`;
  const ribbonGradientId = `fieldlink-ribbon-${gradientScope}`;
  const orbitGradientId = `fieldlink-orbit-${gradientScope}`;
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
          <linearGradient id={frameGradientId} x1="18" y1="18" x2="78" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E879F9" />
            <stop offset="45%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          <linearGradient id={ribbonGradientId} x1="26" y1="68" x2="70" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D946EF" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id={orbitGradientId} x1="32" y1="30" x2="74" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F0ABFC" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <radialGradient id={glowGradientId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(66 28) rotate(132.474) scale(40.0647)">
            <stop offset="0%" stopColor="rgba(232, 121, 249, 0.6)" />
            <stop offset="100%" stopColor="rgba(232, 121, 249, 0)" />
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
          opacity="0.92"
        />
        <circle cx="66" cy="28" r="22" fill={`url(#${glowGradientId})`} />

        <rect
          x="28"
          y="28"
          width="26"
          height="26"
          rx="10"
          transform="rotate(-45 41 41)"
          fill="none"
          stroke={`url(#${frameGradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <rect
          x="42"
          y="42"
          width="26"
          height="26"
          rx="10"
          transform="rotate(-45 55 55)"
          fill="none"
          stroke={`url(#${ribbonGradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M31 63.5C41.5 66 53.5 62 60.5 52"
          fill="none"
          stroke={`url(#${orbitGradientId})`}
          strokeLinecap="round"
          strokeWidth="5"
        />
        <circle cx="31" cy="63" r="4.5" fill="#F0ABFC" />
        <circle cx="65" cy="29" r="4.5" fill="#A855F7" />
      </svg>

      {showWordmark ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: compact ? 4 : 6,
            fontFamily: "Geist Variable, Geist, Heebo, sans-serif",
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
              background: "linear-gradient(135deg, #E879F9 0%, #8B5CF6 48%, #5B21B6 100%)",
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
