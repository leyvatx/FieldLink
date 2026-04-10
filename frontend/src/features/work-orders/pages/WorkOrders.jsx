import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Card, DatePicker, Form, Input, Modal, Select, Table, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PiPlusBold } from "react-icons/pi";
import ModuleStatStrip from "@components/ModuleStatStrip";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  assignWorkOrder,
  cancelWorkOrder,
  createWorkOrder,
  getWorkOrders,
} from "@api/workOrderService";
import LocationPicker from "@/common/components/location/LocationPicker";
import { getCustomers } from "@api/customerService";
import { getTechnicians } from "@api/userService";
import { useMessage } from "@context/MessageProvider";
import queryClient from "@lib/queryClient";
import { matchesText } from "@/lib/filtering";

const STATUS_LABELS = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignada",
  IN_TRANSIT: "En ruta",
  IN_SERVICE: "En servicio",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS = {
  PENDING: "default",
  ASSIGNED: "blue",
  IN_TRANSIT: "cyan",
  IN_SERVICE: "gold",
  COMPLETED: "green",
  CANCELLED: "red",
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

const PRIORITY_LABELS = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const PRIORITY_COLORS = {
  LOW: "default",
  MEDIUM: "blue",
  HIGH: "gold",
  URGENT: "red",
};

function formatDateTime(value) {
  return value ? dayjs(value).format("DD MMM YYYY HH:mm") : "Sin programar";
}

const WorkOrders = () => {
  const { success, error } = useMessage();
  const [filters, setFilters] = useState({
    customer: "",
    address: "",
    phone: "",
    technician: "",
    status: null,
    priority: null,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [assignTechnicianId, setAssignTechnicianId] = useState(undefined);
  const [form] = Form.useForm();
  const selectedCustomerId = Form.useWatch("customer", form);
  const serviceAddress = Form.useWatch("service_location_address", form);
  const serviceLatitude = Form.useWatch("customer_latitude", form);
  const serviceLongitude = Form.useWatch("customer_longitude", form);

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ["work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === String(selectedCustomerId ?? "")) || null,
    [customers, selectedCustomerId]
  );

  const refreshOrders = () => {
    queryClient.invalidateQueries({ queryKey: ["work-orders"] });
  };

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const customer = customers.find((item) => item.id === values.customer);
      const resolvedAddress = values.service_location_address?.trim() || "";
      const customerAddress = customer?.address?.trim() || "";

      const payload = {
        customer: values.customer,
        priority: values.priority,
        notes: values.notes || "",
        service_location_address: resolvedAddress,
        customer_phone: customer?.phone || "",
        customer_email: customer?.email || "",
      };

      const latitude =
        values.customer_latitude != null && values.customer_latitude !== ""
          ? Number(values.customer_latitude)
          : null;
      const longitude =
        values.customer_longitude != null && values.customer_longitude !== ""
          ? Number(values.customer_longitude)
          : null;

      if (latitude != null && longitude != null) {
        payload.customer_latitude = latitude;
        payload.customer_longitude = longitude;
      }

      if (
        payload.customer_latitude == null &&
        payload.customer_longitude == null &&
        customer &&
        resolvedAddress &&
        customerAddress &&
        resolvedAddress === customerAddress
      ) {
        payload.customer_latitude = customer.latitude ?? null;
        payload.customer_longitude = customer.longitude ?? null;
      }

      if (values.scheduled_date) {
        payload.scheduled_date = dayjs(values.scheduled_date).toISOString();
      }

      const order = await createWorkOrder(payload);

      if (values.technician) {
        return assignWorkOrder(order.id, values.technician);
      }

      return order;
    },
    onSuccess: () => {
      success("Orden creada correctamente");
      setModalOpen(false);
      form.resetFields();
      refreshOrders();
    },
    onError: (requestError) =>
      error(
        requestError.response?.data?.error ||
          requestError.response?.data?.service_location_address?.[0] ||
          requestError.response?.data?.customer?.[0] ||
          "No se pudo crear la orden"
      ),
  });

  const assignMutation = useMutation({
    mutationFn: ({ orderId, technicianId }) =>
      assignWorkOrder(orderId, technicianId),
    onSuccess: () => {
      success("Orden asignada");
      refreshOrders();
    },
    onError: () => error("No se pudo asignar la orden"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelWorkOrder,
    onSuccess: () => {
      success("Orden cancelada");
      refreshOrders();
    },
    onError: () => error("No se pudo cancelar la orden"),
  });

  const filteredOrders = useMemo(() => {
    return workOrders.filter((record) => {
      if (filters.status && record.status !== filters.status) {
        return false;
      }
      if (filters.priority && record.priority !== filters.priority) {
        return false;
      }

      if (!matchesText(record.customer_name, filters.customer)) {
        return false;
      }
      if (!matchesText(record.service_location_address, filters.address)) {
        return false;
      }
      if (!matchesText(record.customer_phone, filters.phone)) {
        return false;
      }
      return matchesText(record.technician_name, filters.technician);
    });
  }, [filters, workOrders]);

  useEffect(() => {
    if (!filteredOrders.length) {
      if (selectedOrderId !== null) {
        setSelectedOrderId(null);
      }
      return;
    }

    const stillVisible = filteredOrders.some(
      (record) => String(record.id) === String(selectedOrderId)
    );

    if (!stillVisible) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder = useMemo(
    () =>
      filteredOrders.find((record) => String(record.id) === String(selectedOrderId)) || null,
    [filteredOrders, selectedOrderId]
  );

  useEffect(() => {
    setAssignTechnicianId(selectedOrder?.technician ?? undefined);
  }, [selectedOrder]);

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.name} - ${customer.phone || "sin teléfono"}`,
      })),
    [customers]
  );

  const technicianOptions = useMemo(
    () =>
      technicians.map((technician) => ({
        value: technician.id,
        label: technician.name,
      })),
    [technicians]
  );

  const orderMetrics = useMemo(
    () => ({
      total: filteredOrders.length,
      pending: filteredOrders.filter((order) => order.status === "PENDING").length,
      assigned: filteredOrders.filter((order) =>
        ["ASSIGNED", "IN_TRANSIT", "IN_SERVICE"].includes(order.status)
      ).length,
      unassigned: filteredOrders.filter((order) => !order.technician).length,
    }),
    [filteredOrders]
  );

  const searchConfig = useMemo(
    () => ({
      title: "Filtros de órdenes",
      values: filters,
      fields: [
        {
          key: "customer",
          label: "Cliente",
          placeholder: "Cliente",
        },
        {
          key: "address",
          label: "Dirección",
          placeholder: "Dirección del servicio",
        },
        {
          key: "phone",
          label: "Teléfono",
          placeholder: "Teléfono del cliente",
        },
        {
          key: "technician",
          label: "Técnico",
          placeholder: "Técnico asignado",
        },
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: Object.entries(STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        },
        {
          key: "priority",
          label: "Prioridad",
          type: "select",
          options: PRIORITY_OPTIONS,
        },
      ],
      onChange: (nextFilters) => setFilters((previous) => ({ ...previous, ...nextFilters })),
      onReset: () =>
        setFilters({
          customer: "",
          address: "",
          phone: "",
          technician: "",
          status: null,
          priority: null,
        }),
      onRefresh: refreshOrders,
    }),
    [filters]
  );

  const columns = [
    {
      title: "Cliente",
      key: "customer",
      width: 240,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="font-semibold text-[var(--ui-foreground)]">{record.customer_name}</div>
          <div className="text-sm ui-text-muted">{record.customer_phone || "Sin teléfono"}</div>
        </div>
      ),
    },
    {
      title: "Servicio",
      key: "service",
      width: 420,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="line-clamp-2 text-sm leading-5 text-[var(--ui-foreground)]">
            {record.service_location_address || "Sin dirección"}
          </div>
          <div className="text-sm ui-text-muted">{formatDateTime(record.scheduled_date)}</div>
        </div>
      ),
    },
    {
      title: "Estado",
      key: "status",
      width: 180,
      render: (_, record) => (
        <div className="flex flex-wrap gap-2">
          <Tag color={STATUS_COLORS[record.status] || "default"}>
            {STATUS_LABELS[record.status] || record.status}
          </Tag>
          <Tag color={PRIORITY_COLORS[record.priority] || "default"}>
            {PRIORITY_LABELS[record.priority] || record.priority}
          </Tag>
        </div>
      ),
    },
    {
      title: "Técnico",
      key: "technician",
      width: 220,
      render: (_, record) => (
        <div className="grid gap-1">
          <div>{record.technician_name || "Sin asignar"}</div>
          <div className="text-sm ui-text-muted">
            {record.tracking_token ? `Tracking ${String(record.tracking_token).slice(0, 8)}` : "Sin tracking"}
          </div>
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      title="Órdenes de trabajo"
      searchConfig={searchConfig}
      topbarOptions={
        <Button
          type="primary"
          icon={<PiPlusBold size={16} />}
          onClick={() => setModalOpen(true)}
        >
          Crear orden
        </Button>
      }
    >
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.88fr)]">
        <div className="2xl:col-span-2">
          <ModuleStatStrip
            badge="Órdenes"
            description="La tabla queda al frente y el panel lateral concentra asignación, estado y contexto de la orden elegida."
            stats={[
              {
                label: "Visibles",
                value: orderMetrics.total,
                help: "órdenes filtradas",
              },
              {
                label: "Pendientes",
                value: orderMetrics.pending,
                help: "sin iniciar",
              },
              {
                label: "En curso",
                value: orderMetrics.assigned,
                help: "con técnico o en ruta",
              },
              {
                label: "Sin técnico",
                value: orderMetrics.unassigned,
                help: "por asignar",
              },
            ]}
          />
        </div>

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Base de órdenes
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Selecciona una fila para asignarla, revisarla o cancelarla sin perder la tabla.
              </div>
            </div>
            <Tag color="purple">{filteredOrders.length} visibles</Tag>
          </div>
          <Table
            rowKey="id"
            dataSource={filteredOrders}
            columns={columns}
            loading={
              isLoading ||
              createMutation.isPending ||
              assignMutation.isPending ||
              cancelMutation.isPending
            }
            pagination={{ pageSize: 8 }}
            scroll={{ x: 980 }}
            onRow={(record) => ({
              onClick: () => setSelectedOrderId(record.id),
              className:
                String(selectedOrderId) === String(record.id)
                  ? "bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))]"
                  : undefined,
            })}
          />
        </Card>

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Orden activa
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Desde aquí asignas técnico y controlas la orden elegida.
              </div>
            </div>
            {selectedOrder ? (
              <Tag color={STATUS_COLORS[selectedOrder.status] || "default"}>
                {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
              </Tag>
            ) : null}
          </div>

          {selectedOrder ? (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Cliente</div>
                  <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                    {selectedOrder.customer_name}
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    {selectedOrder.customer_phone || "Sin teléfono"}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Programación</div>
                  <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                    {formatDateTime(selectedOrder.scheduled_date)}
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    {selectedOrder.tracking_token
                      ? `Tracking ${String(selectedOrder.tracking_token).slice(0, 8)}`
                      : "Sin tracking"}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_97%,transparent)] p-4">
                <div className="flex flex-wrap gap-2">
                  <Tag color={PRIORITY_COLORS[selectedOrder.priority] || "default"}>
                    {PRIORITY_LABELS[selectedOrder.priority] || selectedOrder.priority}
                  </Tag>
                  <Tag color={selectedOrder.technician_name ? "blue" : "default"}>
                    {selectedOrder.technician_name || "Sin técnico"}
                  </Tag>
                </div>
                <div className="mt-3 text-sm font-medium text-[var(--ui-foreground)]">
                  Dirección del servicio
                </div>
                <div className="mt-2 text-sm leading-6 ui-text-muted">
                  {selectedOrder.service_location_address || "Sin dirección registrada"}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--ui-foreground)]">
                  Técnico responsable
                </label>
                <Select
                  allowClear
                  options={technicianOptions}
                  placeholder="Selecciona un técnico"
                  value={assignTechnicianId}
                  onChange={setAssignTechnicianId}
                  disabled={["COMPLETED", "CANCELLED"].includes(selectedOrder.status)}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="primary"
                  onClick={() =>
                    assignMutation.mutate({
                      orderId: selectedOrder.id,
                      technicianId: assignTechnicianId,
                    })
                  }
                  disabled={
                    !assignTechnicianId ||
                    ["COMPLETED", "CANCELLED"].includes(selectedOrder.status)
                  }
                  loading={assignMutation.isPending}
                >
                  {selectedOrder.technician_name ? "Reasignar técnico" : "Asignar técnico"}
                </Button>
                <Button
                  danger
                  onClick={() => cancelMutation.mutate(selectedOrder.id)}
                  disabled={["COMPLETED", "CANCELLED"].includes(selectedOrder.status)}
                  loading={cancelMutation.isPending}
                >
                  Cancelar orden
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm ui-text-muted">
              No hay órdenes disponibles con los filtros actuales.
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title="Crear orden de trabajo"
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Crear orden"
        cancelText="Cancelar"
        confirmLoading={createMutation.isPending}
        width={980}
      >
        <Form
          form={form}
          layout="vertical"
          className="grid gap-5"
          onValuesChange={(changedValues) => {
            if (!Object.prototype.hasOwnProperty.call(changedValues, "customer")) {
              return;
            }
            form.setFieldsValue({
              service_location_address: "",
              customer_latitude: "",
              customer_longitude: "",
            });
          }}
          onFinish={(values) => createMutation.mutate(values)}
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(16rem,0.82fr)]">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <Form.Item
                  label="Cliente"
                  name="customer"
                  rules={[{ required: true, message: "Selecciona un cliente" }]}
                >
                  <Select
                    showSearch
                    options={customerOptions}
                    placeholder="Selecciona un cliente"
                  />
                </Form.Item>
                <Form.Item
                  label="Prioridad"
                  name="priority"
                  initialValue="MEDIUM"
                  rules={[{ required: true, message: "Selecciona la prioridad" }]}
                >
                  <Select options={PRIORITY_OPTIONS} />
                </Form.Item>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Form.Item label="Técnico inicial" name="technician">
                  <Select
                    allowClear
                    options={technicianOptions}
                    placeholder="Opcional"
                  />
                </Form.Item>
                <Form.Item label="Fecha programada" name="scheduled_date">
                  <DatePicker
                    showTime
                    className="w-full"
                    format="YYYY-MM-DD HH:mm"
                    placeholder="Selecciona fecha y hora"
                  />
                </Form.Item>
              </div>

              <Form.Item
                label="Dirección del servicio"
                name="service_location_address"
                rules={[{ required: true, message: "Ingresa la ubicación del servicio" }]}
                extra={
                  selectedCustomer
                    ? selectedCustomer.address
                      ? "La orden necesita su propia dirección de servicio. Solo usa la del cliente si realmente coincide."
                      : "Este cliente no tiene dirección guardada. Debes indicar la ubicación del trabajo."
                    : "La orden necesita una ubicación clara para enviar al técnico."
                }
              >
                <LocationPicker
                  value={serviceAddress}
                  latitude={serviceLatitude}
                  longitude={serviceLongitude}
                  onLocationSelect={(location) => {
                    form.setFieldsValue({
                      customer_latitude: location?.latitude ?? "",
                      customer_longitude: location?.longitude ?? "",
                    });
                  }}
                />
              </Form.Item>

              <Form.Item hidden name="customer_latitude">
                <input type="hidden" />
              </Form.Item>
              <Form.Item hidden name="customer_longitude">
                <input type="hidden" />
              </Form.Item>

              <Form.Item label="Notas" name="notes">
                <Input.TextArea rows={4} placeholder="Detalles útiles para la visita" />
              </Form.Item>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] p-4">
                <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Cliente elegido</div>
                <div className="mt-3 font-medium text-[var(--ui-foreground)]">
                  {selectedCustomer?.name || "Selecciona un cliente"}
                </div>
                <div className="mt-2 grid gap-1 text-sm ui-text-muted">
                  <span>{selectedCustomer?.phone || "Sin teléfono"}</span>
                  <span>{selectedCustomer?.email || "Sin correo"}</span>
                  <span className="line-clamp-3">
                    {selectedCustomer?.address || "Sin dirección guardada"}
                  </span>
                </div>
              </div>
              <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] p-4">
                <div className="text-sm font-medium text-[var(--ui-foreground)]">Antes de crear</div>
                <div className="mt-2 text-sm leading-6 ui-text-muted">
                  Define dirección, prioridad y técnico solo si ya sabes quién tomará la orden.
                </div>
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </PageLayout>
  );
};

export default WorkOrders;
