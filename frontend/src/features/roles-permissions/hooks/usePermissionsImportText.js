import { useQuery } from "@tanstack/react-query";
import { permissionsImportText } from "@api/permissionService";

const usePermissionsImportText = (options = {}) => {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryFn: permissionsImportText,
    queryKey: ["permissions", "import-text"],
    enabled,
  });
};

export default usePermissionsImportText;
