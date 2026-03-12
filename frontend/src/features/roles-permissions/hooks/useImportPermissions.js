import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importPermissions } from "@api/permissionService";
import { useMessage } from "@context/MessageProvider";

const useImportPermissions = () => {
  const { success } = useMessage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload }) => importPermissions(payload),
    onSuccess: ({ results = {} }) => {
      const { created = 0, updated = 0 } = results ?? {};
      const showAlert = created > 0 || updated > 0;

      if (showAlert) {
        success("Permisos importados exitosamente");
      }

      queryClient.removeQueries({ queryKey: ["permissions", "import-text"] });
      queryClient.invalidateQueries({ queryKey: ["roles-permissions-matrix"] });
    },
  });
};

export default useImportPermissions;
