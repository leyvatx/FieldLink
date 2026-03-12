import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "@features/releases-notes/services/projectService";
import { useMessage } from "@context/MessageProvider";

const useCreateProject = () => {
  const { success } = useMessage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createProject(payload),
    onSuccess: () => {
      success("Proyecto creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export default useCreateProject;
