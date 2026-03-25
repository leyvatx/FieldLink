import { useMemo, useState } from "react";
import { Button, Card, Empty, Result, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  PiCheckCircleFill,
  PiCrownSimpleFill,
  PiMapTrifoldBold,
  PiPackageFill,
  PiUsersThreeFill,
  PiXCircleFill,
} from "react-icons/pi";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  getCurrentCompanyPlan,
  getSubscriptionPlans,
  upgradeCompanyPlan,
} from "@api/subscriptionService";
import queryClient from "@lib/queryClient";
import { useMessage } from "@context/MessageProvider";
import { useAuth } from "@context/AuthProvider";
import { isCompanyAdmin } from "@utils/constants/roles";
import { matchesAnyText } from "@/lib/filtering";

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const toNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPlanFeatures = (plan) => [
  {
    key: "techs",
    label: `${plan.max_technicians} técnicos`,
    enabled: true,
    icon: PiUsersThreeFill,
  },
  {
    key: "orders",
    label: `${plan.max_work_orders_per_month} ordenes al mes`,
    enabled: true,
    icon: PiPackageFill,
  },
  {
    key: "tracking",
    label: "Tracking en tiempo real",
    enabled: !!plan.realtime_tracking,
    icon: PiMapTrifoldBold,
  },
  {
    key: "materials",
    label: "Flujo de materiales",
    enabled: !!plan.material_approval_workflow,
    icon: PiCheckCircleFill,
  },
];

const Subscription = () => {
  const { success, error } = useMessage();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    query: "",
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: getSubscriptionPlans,
  });

  const { data: currentPlan } = useQuery({
    queryKey: ["current-plan"],
    queryFn: getCurrentCompanyPlan,
    retry: false,
  });

  const upgradeMutation = useMutation({
    mutationFn: upgradeCompanyPlan,
    onSuccess: () => {
      success("Plan actualizado");
      queryClient.invalidateQueries({ queryKey: ["current-plan"] });
    },
    onError: () => error("No se pudo actualizar el plan"),
  });

  const isAdmin = isCompanyAdmin(user);

  const blockedView = !isAdmin ? (
    <PageLayout title="Suscripcion y planes">
      <Result
        status="403"
        title="Acceso restringido"
        subTitle="Solo la empresa puede gestionar la suscripcion."
      />
    </PageLayout>
  ) : null;

  const currentPlanId = currentPlan?.plan;

  const currentPlanDetails = useMemo(
    () => plans.find((plan) => plan.id === currentPlanId) || null,
    [currentPlanId, plans]
  );

  const filteredPlans = useMemo(() => {
    return [...plans]
      .filter((plan) =>
        matchesAnyText(
          [
            plan.name,
            plan.description,
            `${plan.max_technicians} técnicos`,
            `${plan.max_work_orders_per_month} ordenes`,
            plan.realtime_tracking ? "tracking en tiempo real" : "",
            plan.material_approval_workflow ? "flujo de materiales" : "",
          ],
          filters.query
        )
      )
      .sort((left, right) => {
        if (left.id === currentPlanId) {
          return -1;
        }

        if (right.id === currentPlanId) {
          return 1;
        }

        return toNumber(left.monthly_price) - toNumber(right.monthly_price);
      });
  }, [currentPlanId, filters.query, plans]);

  const searchConfig = useMemo(
    () => ({
      title: "Buscar planes",
      values: filters,
      fields: [
        {
          key: "query",
          label: "Buscar",
          placeholder: "Plan, beneficio o limite",
        },
      ],
      onChange: (patch) => setFilters((prev) => ({ ...prev, ...patch })),
      onReset: () => setFilters({ query: "" }),
      onRefresh: () => {
        queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
        queryClient.invalidateQueries({ queryKey: ["current-plan"] });
      },
    }),
    [filters]
  );

  const compactStats = [
    {
      label: "Plan activo",
      value: currentPlanDetails?.name || "Sin plan",
    },
    {
      label: "Precio",
      value: currentPlanDetails ? formatCurrency(currentPlanDetails.monthly_price) : "$0",
    },
    {
      label: "Técnicos",
      value: currentPlanDetails?.max_technicians ?? "-",
    },
    {
      label: "Ordenes / mes",
      value: currentPlanDetails?.max_work_orders_per_month ?? "-",
    },
  ];

  if (blockedView) {
    return blockedView;
  }

  return (
    <PageLayout title="Suscripcion y planes" searchConfig={searchConfig}>
      <div className="grid gap-5">
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.4fr))]">
          {compactStats.map((stat, index) => (
            <div
              key={stat.label}
              className={`rounded-[24px] border px-4 py-4 shadow-[var(--ui-shadow-soft)] ${
                index === 0
                  ? "border-[color:color-mix(in_srgb,var(--ui-highlight)_22%,var(--ui-border))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ui-card)_94%,transparent),color-mix(in_srgb,var(--ui-highlight)_10%,var(--ui-card)))]"
                  : "border-[var(--ui-border)] bg-[var(--ui-card)]"
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                {stat.label}
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--ui-foreground)]">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {!isLoading && !filteredPlans.length ? (
          <Card className="rounded-[28px]">
            <Empty description="No se encontraron planes con ese filtro." />
          </Card>
        ) : null}

        <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {(isLoading ? plans : filteredPlans).map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isProcessingPlan =
              upgradeMutation.isPending && upgradeMutation.variables === plan.id;
            const planFeatures = getPlanFeatures(plan);

            return (
              <Card
                key={plan.id}
                className={`rounded-[28px] border ${
                  isCurrent
                    ? "border-[color:color-mix(in_srgb,var(--ui-highlight)_26%,var(--ui-border))]"
                    : "border-[var(--ui-border)]"
                }`}
                loading={isLoading}
              >
                <div className="flex h-full flex-col gap-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="m-0 text-lg font-semibold text-[var(--ui-foreground)]">
                          {plan.name}
                        </h2>
                        {isCurrent ? <Tag color="green">Actual</Tag> : null}
                      </div>
                      <p className="mt-2 text-sm ui-text-muted">
                        {plan.description || "Sin descripcion registrada."}
                      </p>
                    </div>
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] text-[var(--ui-highlight)]">
                      <PiCrownSimpleFill size={20} />
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="text-3xl font-semibold tracking-[-0.04em] text-[var(--ui-foreground)]">
                      {formatCurrency(plan.monthly_price)}
                    </div>
                    <div className="pb-1 text-sm ui-text-muted">por mes</div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {planFeatures.map((feature) => {
                      const FeatureIcon = feature.icon;

                      return (
                        <div
                          key={feature.key}
                          className="rounded-2xl border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_94%,transparent)] px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="grid h-9 w-9 place-items-center rounded-2xl ui-bg-soft text-[var(--ui-highlight)]">
                              <FeatureIcon size={16} />
                            </div>
                            {feature.enabled ? (
                              <PiCheckCircleFill size={18} className="text-[var(--sk-color-green)]" />
                            ) : (
                              <PiXCircleFill size={18} className="text-[var(--ui-muted-foreground)]" />
                            )}
                          </div>
                          <div className="mt-3 text-sm text-[var(--ui-foreground)]">
                            {feature.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    type={isCurrent ? "default" : "primary"}
                    className="mt-auto w-full"
                    disabled={isCurrent}
                    loading={isProcessingPlan}
                    onClick={() => upgradeMutation.mutate(plan.id)}
                  >
                    {isCurrent ? "Plan activo" : "Cambiar a este plan"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

export default Subscription;
