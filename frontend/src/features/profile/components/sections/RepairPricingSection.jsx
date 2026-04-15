import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, InputNumber, Tag, Typography } from "@/lib/antd-compat";
import { PiBriefcase, PiTruck } from "react-icons/pi";
import { getMyCompanyConfig, updateMyCompanyConfig } from "@api/companyConfigService";
import { useMessage } from "@context/MessageProvider";
import queryClient from "@lib/queryClient";

const { Title, Paragraph } = Typography;

const LABOR_FIELDS = [
  { key: "labor_basic_rate", label: "Básico", hint: "Reparación simple", suggested: 200 },
  { key: "labor_medium_rate", label: "Medio", hint: "Trabajo intermedio", suggested: 350 },
  { key: "labor_advanced_rate", label: "Avanzado", hint: "Intervención compleja", suggested: 500 },
];

const TRANSPORT_FIELDS = [
  { key: "transport_near_rate", label: "Cercano", hint: "Zona inmediata", suggested: 100 },
  { key: "transport_medium_rate", label: "Medio", hint: "Distancia media", suggested: 150 },
  { key: "transport_far_rate", label: "Lejano", hint: "Trayecto largo", suggested: 250 },
];

const EMPTY_FORM = {
  labor_basic_rate: undefined,
  labor_medium_rate: undefined,
  labor_advanced_rate: undefined,
  transport_near_rate: undefined,
  transport_medium_rate: undefined,
  transport_far_rate: undefined,
};

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function toFormState(config) {
  if (!config) {
    return EMPTY_FORM;
  }

  return {
    labor_basic_rate: config.labor_basic_rate ?? undefined,
    labor_medium_rate: config.labor_medium_rate ?? undefined,
    labor_advanced_rate: config.labor_advanced_rate ?? undefined,
    transport_near_rate: config.transport_near_rate ?? undefined,
    transport_medium_rate: config.transport_medium_rate ?? undefined,
    transport_far_rate: config.transport_far_rate ?? undefined,
  };
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

const RateGrid = ({ icon, title, description, fields, values, onChange }) => (
  <div className="rounded-[28px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_94%,transparent)] p-5 shadow-[var(--ui-shadow-soft)]">
    <div className="flex items-start gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-highlight)_20%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_10%,var(--ui-card))] text-[var(--ui-foreground)]">
        {icon}
      </div>
      <div>
        <div className="text-base font-semibold text-[var(--ui-foreground)]">{title}</div>
        <div className="mt-1 text-sm ui-text-muted">{description}</div>
      </div>
    </div>

    <div className="mt-5 grid gap-3">
      {fields.map((field) => (
        <div
          key={field.key}
          className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-medium text-[var(--ui-foreground)]">{field.label}</div>
              <div className="mt-1 text-sm ui-text-muted">{field.hint}</div>
            </div>
            <div className="text-sm font-medium text-[var(--ui-muted-foreground)]">
              Sugerido {formatCurrency(field.suggested)}
            </div>
          </div>
          <InputNumber
            className="mt-3 w-full"
            min={0}
            step={0.01}
            placeholder={`Ej. ${field.suggested}`}
            value={values[field.key]}
            onChange={(nextValue) => onChange(field.key, nextValue)}
          />
        </div>
      ))}
    </div>
  </div>
);

const RepairPricingSection = () => {
  const { success, error } = useMessage();
  const [formValues, setFormValues] = useState(EMPTY_FORM);

  const { data: companyConfig, isLoading } = useQuery({
    queryKey: ["company-config", "my-config"],
    queryFn: getMyCompanyConfig,
  });

  useEffect(() => {
    setFormValues(toFormState(companyConfig));
  }, [companyConfig]);

  const updateMutation = useMutation({
    mutationFn: updateMyCompanyConfig,
    onSuccess: () => {
      success("Tarifas guardadas");
      queryClient.invalidateQueries({ queryKey: ["company-config", "my-config"] });
    },
    onError: () => error("No se pudieron guardar las tarifas"),
  });

  const pricingStatus = useMemo(() => {
    if (companyConfig?.repair_pricing_ready) {
      return {
        color: "green",
        label: "Tarifas listas",
        description: "Las órdenes nuevas ya pueden calcular mano de obra, transporte y total de reparación.",
      };
    }

    return {
      color: "gold",
      label: "Falta configuración",
      description: "Si intentan crear una orden antes de completar estas tarifas, el sistema la bloqueará.",
    };
  }, [companyConfig]);

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      labor_basic_rate: formValues.labor_basic_rate ?? null,
      labor_medium_rate: formValues.labor_medium_rate ?? null,
      labor_advanced_rate: formValues.labor_advanced_rate ?? null,
      transport_near_rate: formValues.transport_near_rate ?? null,
      transport_medium_rate: formValues.transport_medium_rate ?? null,
      transport_far_rate: formValues.transport_far_rate ?? null,
    });
  };

  return (
    <div className="overflow-hidden rounded-[32px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card)),color-mix(in_srgb,var(--ui-card)_96%,transparent))] p-6 shadow-[var(--ui-shadow-soft)]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
            Costeo operativo
          </div>
          <Title level={3} className="mt-3">
            Tarifas de reparación
          </Title>
          <Paragraph type="secondary" className="mt-2 text-sm">
            Mano de obra y transporte se capturan por nivel. El material se suma automático desde el costo unitario de cada insumo.
          </Paragraph>
        </div>
        <Tag color={pricingStatus.color}>{pricingStatus.label}</Tag>
      </div>

      <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_16%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] px-4 py-4 text-sm text-[var(--ui-muted-foreground)]">
        {pricingStatus.description}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <RateGrid
          icon={<PiBriefcase size={20} />}
          title="Mano de obra"
          description="Estas tarifas se toman al crear la orden segun el nivel seleccionado."
          fields={LABOR_FIELDS}
          values={formValues}
          onChange={handleFieldChange}
        />
        <RateGrid
          icon={<PiTruck size={20} />}
          title="Transporte"
          description="La distancia elegida en la orden usa estos importes para el costo del traslado."
          fields={TRANSPORT_FIELDS}
          values={formValues}
          onChange={handleFieldChange}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm ui-text-muted">
          Valores sugeridos: Básico {formatCurrency(200)}, Medio {formatCurrency(350)}, Avanzado {formatCurrency(500)}, Cercano {formatCurrency(100)}, Medio {formatCurrency(150)}, Lejano {formatCurrency(250)}.
        </div>
        <Button type="primary" onClick={handleSave} loading={updateMutation.isPending} disabled={isLoading}>
          Guardar tarifas
        </Button>
      </div>
    </div>
  );
};

export default RepairPricingSection;
