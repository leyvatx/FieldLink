import { Button } from "@/lib/antd-compat";

const FormActions = ({ onCancel, isLoading }) => {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-2 flex flex-col-reverse gap-2 border-t border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-1 pt-4 backdrop-blur sm:flex-row sm:justify-end">
      <Button onClick={onCancel} disabled={isLoading}>
        Cancelar
      </Button>
      <Button type="primary" htmlType="submit" loading={isLoading}>
        {isLoading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
};

export default FormActions;
