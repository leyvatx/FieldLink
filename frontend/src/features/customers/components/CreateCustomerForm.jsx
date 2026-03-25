import { Button, Form, Input } from "@/lib/antd-compat";
import { useMutation } from "@tanstack/react-query";
import { useDialog } from "@context/DialogProvider";
import { useMessage } from "@context/MessageProvider";
import { createCustomer } from "@api/customerService";
import LocationPicker from "@/common/components/location/LocationPicker";
import { formatErrors } from "@lib/formatErrors";
import queryClient from "@lib/queryClient";

const CreateCustomerForm = ({ onCreated }) => {
  const { closeDrawer, closeModal } = useDialog();
  const { success, error } = useMessage();
  const [form] = Form.useForm();
  const address = Form.useWatch("address", form);
  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);

  const handleClose = () => {
    closeDrawer();
    closeModal();
  };

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      success("Cliente creado correctamente");
      onCreated?.(customer);
      handleClose();
    },
    onError: (requestError) => {
      if (requestError.response?.data) {
        form.setFields(formatErrors(requestError));
      }

      error(
        requestError.response?.data?.detail ||
          requestError.response?.data?.error ||
          requestError.response?.data?.non_field_errors?.[0] ||
          "No se pudo crear el cliente"
      );
    },
  });

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => createMutation.mutate(values)}
      className="grid gap-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item
          label="Nombre"
          name="name"
          rules={[
            { required: true, message: "El nombre es obligatorio" },
            { max: 150, message: "El nombre no puede exceder 150 caracteres" },
          ]}
        >
          <Input maxLength={150} placeholder="Nombre del cliente" showCount />
        </Form.Item>

        <Form.Item
          label="Teléfono"
          name="phone"
          rules={[
            { required: true, message: "El teléfono es obligatorio" },
            { max: 20, message: "El teléfono no puede exceder 20 caracteres" },
          ]}
        >
          <Input maxLength={20} placeholder="Teléfono de contacto" showCount />
        </Form.Item>
      </div>

      <Form.Item
        label="Correo"
        name="email"
        rules={[
          { type: "email", message: "Ingresa un correo valido" },
          { max: 254, message: "El correo no puede exceder 254 caracteres" },
        ]}
      >
        <Input maxLength={254} placeholder="Correo del cliente" showCount />
      </Form.Item>

      <Form.Item
        label="Dirección"
        name="address"
        rules={[{ required: true, message: "La dirección es obligatoria" }]}
        extra="Busca la dirección y ajusta el punto exacto en el mapa."
      >
        <LocationPicker
          value={address}
          latitude={latitude}
          longitude={longitude}
          onLocationSelect={(location) => {
            form.setFieldsValue({
              latitude: location?.latitude ?? "",
              longitude: location?.longitude ?? "",
            });
          }}
        />
      </Form.Item>

      <Form.Item hidden name="latitude">
        <input type="hidden" />
      </Form.Item>

      <Form.Item hidden name="longitude">
        <input type="hidden" />
      </Form.Item>

      <div className="sticky bottom-0 z-10 -mx-1 mt-2 flex flex-col-reverse gap-2 border-t border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-1 pt-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button onClick={handleClose} disabled={createMutation.isPending}>
          Cancelar
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={createMutation.isPending}
        >
          {createMutation.isPending ? "Guardando..." : "Crear cliente"}
        </Button>
      </div>
    </Form>
  );
};

export default CreateCustomerForm;
