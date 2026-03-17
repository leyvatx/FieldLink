import apiClient from "./apiClient";

export const getSubscriptionPlans = async () => {
  const { data } = await apiClient.get("/subscription-plans/");
  return data;
};

export const getCurrentCompanyPlan = async () => {
  const { data } = await apiClient.get("/company-plans/current_plan/");
  return data;
};

export const upgradeCompanyPlan = async (planId) => {
  const { data } = await apiClient.post("/company-plans/upgrade/", {
    plan_id: planId,
  });
  return data;
};
