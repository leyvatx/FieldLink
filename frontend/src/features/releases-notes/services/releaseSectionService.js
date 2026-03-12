import apiClient from "@api/apiClient";

export const createReleaseSection = async (id, formData) => {
  const { data } = await apiClient.post(
    `/release-notes/${id}/release-sections`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
};
