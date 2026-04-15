export const COUNTRY_CODES = [
  { code: "+52", country: "MX", label: "México", flag: "🇲🇽" },
  { code: "+1", country: "US", label: "USA / Canadá", flag: "🇺🇸" },
  { code: "+34", country: "ES", label: "España", flag: "🇪🇸" },
  { code: "+57", country: "CO", label: "Colombia", flag: "🇨🇴" },
  { code: "+54", country: "AR", label: "Argentina", flag: "🇦🇷" },
  { code: "+56", country: "CL", label: "Chile", flag: "🇨🇱" },
  { code: "+51", country: "PE", label: "Perú", flag: "🇵🇪" },
  { code: "+58", country: "VE", label: "Venezuela", flag: "🇻🇪" },
  { code: "+593", country: "EC", label: "Ecuador", flag: "🇪🇨" },
  { code: "+591", country: "BO", label: "Bolivia", flag: "🇧🇴" },
  { code: "+595", country: "PY", label: "Paraguay", flag: "🇵🇾" },
  { code: "+598", country: "UY", label: "Uruguay", flag: "🇺🇾" },
  { code: "+502", country: "GT", label: "Guatemala", flag: "🇬🇹" },
  { code: "+503", country: "SV", label: "El Salvador", flag: "🇸🇻" },
  { code: "+504", country: "HN", label: "Honduras", flag: "🇭🇳" },
  { code: "+505", country: "NI", label: "Nicaragua", flag: "🇳🇮" },
  { code: "+506", country: "CR", label: "Costa Rica", flag: "🇨🇷" },
  { code: "+507", country: "PA", label: "Panamá", flag: "🇵🇦" },
  { code: "+53", country: "CU", label: "Cuba", flag: "🇨🇺" },
  { code: "+1809", country: "DO", label: "República Dominicana", flag: "🇩🇴" },
  { code: "+1787", country: "PR", label: "Puerto Rico", flag: "🇵🇷" },
];

export const DEFAULT_DIAL_CODE = "+52";

const sortedCodes = [...COUNTRY_CODES].sort((a, b) => {
  const toInt = (c) => parseInt(c.code.replace(/[^0-9]/g, ""), 10);
  return toInt(b) - toInt(a);
});

export const splitE164 = (value) => {
  const raw = (value || "").toString().trim();
  if (!raw) {
    return { dialCode: DEFAULT_DIAL_CODE, national: "" };
  }

  const normalized = raw.replace(/[\s()-]/g, "");
  if (!normalized.startsWith("+")) {
    return { dialCode: DEFAULT_DIAL_CODE, national: normalized };
  }

  const match = sortedCodes.find((c) => normalized.startsWith(c.code));
  if (match) {
    return {
      dialCode: match.code,
      national: normalized.slice(match.code.length),
    };
  }

  return { dialCode: DEFAULT_DIAL_CODE, national: normalized.replace(/^\+/, "") };
};

export const joinE164 = (dialCode, national) => {
  const cleanNational = (national || "").replace(/[^0-9]/g, "");
  if (!cleanNational) {
    return "";
  }
  return `${dialCode}${cleanNational}`;
};
