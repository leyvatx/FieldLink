import apiClient from "@api/apiClient";

export const getReleaseNotesPagination = async (params) => {
  const { data } = await apiClient.get("/release-notes/pagination", {
    params,
  });
  return data;
};

export const createReleaseNote = async (payload) => {
  const { data } = await apiClient.post("/release-notes", payload);
  return data;
};

export const getReleaseNote = async (id) => {
  const { data } = await apiClient.get(`/release-notes/${id}`);
  return data;
};

export const getCurrentReleaseNote = async () => {
  const { data } = await apiClient.get("/release-notes/current");
  return data;
};

export const getCurrentVersionNumber = async () => {
  const { data } = await apiClient.get("/release-notes/current-version-number");
  return data;
}

export const updateReleaseNote = async (id, formData) => {
  formData.append("_method", "PUT");

  const { data } = await apiClient.post(`/release-notes/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const getReleaseNoteStatusOptions = async () => {
  const { data } = await apiClient.get("/release-notes/status/options");
  return data;
};

export const deleteReleaseNote = async (id) => {
  const { data } = await apiClient.delete(`/release-notes/${id}`);
  return data;
};

export const updateReleaseNoteStatus = async (id, status) => {
  const { data } = await apiClient.put(`/release-notes/${id}/status`, {
    status,
  });
  return data;
};
