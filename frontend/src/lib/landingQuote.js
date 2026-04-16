export const LANDING_SERVICE_OPTIONS = [
  {
    value: "diagnostico",
    label: "Diagnóstico",
    visitFee: 79,
    laborBase: 40,
    materialReserve: 0,
  },
  {
    value: "instalacion",
    label: "Instalación",
    visitFee: 119,
    laborBase: 120,
    materialReserve: 45,
  },
  {
    value: "mantenimiento",
    label: "Mantenimiento",
    visitFee: 89,
    laborBase: 70,
    materialReserve: 20,
  },
  {
    value: "reparacion",
    label: "Reparación",
    visitFee: 129,
    laborBase: 135,
    materialReserve: 55,
  },
];

export const LANDING_URGENCY_OPTIONS = [
  { value: "scheduled", label: "Programado", surcharge: 0 },
  { value: "priority", label: "Prioritario", surcharge: 39 },
  { value: "emergency", label: "Emergencia", surcharge: 95 },
];

const DEFAULT_SERVICE = LANDING_SERVICE_OPTIONS[0];
const DEFAULT_URGENCY = LANDING_URGENCY_OPTIONS[0];

export function getLandingServiceOption(value) {
  return LANDING_SERVICE_OPTIONS.find((option) => option.value === value) || DEFAULT_SERVICE;
}

export function getLandingUrgencyOption(value) {
  return LANDING_URGENCY_OPTIONS.find((option) => option.value === value) || DEFAULT_URGENCY;
}

export function estimateLandingQuote({ serviceType, urgency }) {
  const service = getLandingServiceOption(serviceType);
  const urgencyOption = getLandingUrgencyOption(urgency);
  const total =
    service.visitFee +
    service.laborBase +
    service.materialReserve +
    urgencyOption.surcharge;

  return {
    service,
    urgency: urgencyOption,
    visitFee: service.visitFee,
    laborBase: service.laborBase,
    materialReserve: service.materialReserve,
    urgencySurcharge: urgencyOption.surcharge,
    total,
    summary: `${service.label} · ${urgencyOption.label} · ${formatLandingUsd(total)} estimados`,
    disclaimer:
      "El total es una referencia inicial. Material especial y trabajos extra se validan en sitio.",
  };
}

export function formatLandingUsd(amount) {
  return `USD ${Number(amount || 0).toFixed(0)}`;
}
