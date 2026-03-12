import apiClient from "@api/apiClient";

export const getProjectsOptions = async () => {
  const { data } = await apiClient.get("/projects/options");
  return data;
};

export const createProject = async (payload) => {
  const { data } = await apiClient.post("/projects", payload);
  return data;
};
