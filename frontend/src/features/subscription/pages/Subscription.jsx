import { Button, Card, Result, Tag } from "antd";
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

const Subscription = () => {
  const { success, error } = useMessage();
  const { user } = useAuth();

  if (user?.role !== "OWNER") {
    return (
      <PageLayout title="Suscripción y planes">
        <Result
          status="403"
          title="Acceso restringido"
          subTitle="Solo el propietario puede gestionar la suscripción."
        />
      </PageLayout>
    );
  }

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

  const currentPlanId = currentPlan?.plan;

  return (
    <PageLayout title="Suscripción y planes">
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <Card key={plan.id} className="rounded-2xl" loading={isLoading}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {isCurrent && <Tag color="green">Actual</Tag>}
              </div>
              <div className="text-2xl font-bold">
                ${plan.monthly_price}
                <span className="text-sm ui-text-muted"> / mes</span>
              </div>
              <p className="text-sm ui-text-muted mt-2">{plan.description}</p>
              <div className="mt-4 grid gap-2 text-sm">
                <span>Hasta {plan.max_technicians} técnicos</span>
                <span>{plan.max_work_orders_per_month} órdenes / mes</span>
                <span>Tracking en tiempo real: {plan.realtime_tracking ? "Sí" : "No"}</span>
                <span>Flujo de materiales: {plan.material_approval_workflow ? "Sí" : "No"}</span>
              </div>
              <Button
                type={isCurrent ? "default" : "primary"}
                className="mt-6 w-full"
                disabled={isCurrent}
                loading={upgradeMutation.isPending}
                onClick={() => upgradeMutation.mutate(plan.id)}>
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
