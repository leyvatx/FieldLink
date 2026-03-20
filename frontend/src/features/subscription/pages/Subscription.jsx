import { useMemo, useState } from "react";
import { Button, Card, Result, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  getSubscriptionPlans,
  getCurrentCompanyPlan,
  upgradeCompanyPlan,
} from "@api/subscriptionService";
import queryClient from "@lib/queryClient";
import { useMessage } from "@context/MessageProvider";
import { useAuth } from "@context/AuthProvider";
import { isCompanyAdmin } from "@utils/constants/roles";
import { matchesText } from "@/lib/filtering";

const Subscription = () => {
  const { success, error } = useMessage();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    name: "",
    feature: "",
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
    
      <PageLayout title="Suscripción y planes">
        <Result
          status="403"
          title="Acceso restringido"
          subTitle="Solo la empresa puede gestionar la suscripción."
        />
      </PageLayout>
  ) : null;

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (!matchesText(plan.name, filters.name)) {
        return false;
      }
      return matchesText(plan.description, filters.feature);
    });
  }, [filters.feature, filters.name, plans]);

  const searchConfig = useMemo(
    () => ({
      title: "Buscar planes",
      values: filters,
      fields: [
        {
          key: "name",
          label: "Plan",
          placeholder: "Nombre o descripción del plan",
        },
        {
          key: "feature",
          label: "Descripcion",
          placeholder: "Beneficio o descripcion",
        },
      ],
      onChange: (patch) => setFilters((prev) => ({ ...prev, ...patch })),
      onReset: () => setFilters({ name: "", feature: "" }),
      onRefresh: () => {
        queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
        queryClient.invalidateQueries({ queryKey: ["current-plan"] });
      },
    }),
    [filters]
  );

  const currentPlanId = currentPlan?.plan;

  if (blockedView) {
    return blockedView;
  }

  return (
    <PageLayout
      title="Suscripción y planes"
      searchConfig={searchConfig}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {filteredPlans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <Card key={plan.id} className="rounded-2xl" loading={isLoading}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {isCurrent && <Tag color="green">Actual</Tag>}
              </div>
              <div className="text-2xl font-bold">
                ${plan.monthly_price}
                <span className="text-sm ui-text-muted"> / mes</span>
              </div>
              <p className="mt-2 text-sm ui-text-muted">{plan.description}</p>
              <div className="mt-4 grid gap-2 text-sm">
                <span>Hasta {plan.max_technicians} técnicos</span>
                <span>{plan.max_work_orders_per_month} órdenes / mes</span>
                <span>
                  Tracking en tiempo real: {plan.realtime_tracking ? "Sí" : "No"}
                </span>
                <span>
                  Flujo de materiales: {plan.material_approval_workflow ? "Sí" : "No"}
                </span>
              </div>
              <Button
                type={isCurrent ? "default" : "primary"}
                className="mt-6 w-full"
                disabled={isCurrent}
                loading={upgradeMutation.isPending}
                onClick={() => upgradeMutation.mutate(plan.id)}
              >
                {isCurrent ? "Plan activo" : "Pagar y activar"}
              </Button>
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
};

export default Subscription;
