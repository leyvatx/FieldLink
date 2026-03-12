import { useTheme } from "@context/ThemeProvider";
import FieldLinkLogoLight from "@assets/images/fieldlink-logo-light.png";
import FieldLinkLogoDark from "@assets/images/fieldlink-logo-dark.png";

const AppLogo = ({ style }) => {
  const { isDark } = useTheme();

  return (
    <img
      src={isDark ? FieldLinkLogoDark : FieldLinkLogoLight}
      alt="FieldLink"
      className="object-contain"
      style={style}
    />
  );
};

export default AppLogo;
