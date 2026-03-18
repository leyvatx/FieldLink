import { useCallback, useMemo, useState } from "react";
import { Button, Card, Form, Input, Modal, Select, Table, Tag } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PiPlusBold } from "react-icons/pi";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  assignWorkOrder,
  cancelWorkOrder,
  createWorkOrder,
  getWorkOrders,
} from "@api/workOrderService";
import { getCustomers } from "@api/customerService";
import { getTechnicians } from "@api/userService";
import { useDialog } from "@context/DialogProvider";
import { useMessage } from "@context/MessageProvider";
import queryClient from "@lib/queryClient";

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

const WorkOrders = () => {
  const { success, error } = useMessage();
  const { openContextMenu } = useDialog();
  const [filters, setFilters] = useState({
    search: "",
    status: null,
    priority: null,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

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

  const refreshOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["work-orders"] });
  }, []);

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const selectedCustomer = customers.find(
        (customer) => customer.id === values.customer
      );

      const payload = {
        customer: values.customer,
        priority: values.priority,
        notes: values.notes || "",
        service_location_address:
          values.service_location_address || selectedCustomer?.address || "",
        customer_phone: selectedCustomer?.phone || "",
        customer_email: selectedCustomer?.email || "",
      };

      if (values.scheduled_date) {
        payload.scheduled_date = new Date(values.scheduled_date).toISOString();
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

      const search = filters.search.trim().toLowerCase();
      if (!search) {
        return true;
      }

      return [
        record.customer_name,
        record.service_location_address,
        record.customer_phone,
        record.technician_name,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [filters, workOrders]);

  const openOrderContextMenu = useCallback(
    (event, order) => {
      const technicianItems = technicians.length
        ? technicians.map((technician) => ({
            key: `assign-${technician.id}`,
            label: technician.name,
            onClick: () =>
              assignMutation.mutate({
                orderId: order.id,
                technicianId: technician.id,
              }),
          }))
        : [
            {
              key: "no-technicians",
              label: "Sin técnicos disponibles",
              disabled: true,
            },
          ];

      openContextMenu({
        event,
        items: [
          {
            key: "assign",
            label: order.technician_name
              ? `Reasignar de ${order.technician_name}`
              : "Asignar técnico",
            children: technicianItems,
            disabled: technicians.length === 0,
          },
          {
            key: "cancel",
            label: "Cancelar orden",
            danger: true,
            disabled: ["COMPLETED", "CANCELLED"].includes(order.status),
            onClick: () => cancelMutation.mutate(order.id),
          },
        ],
      });
    },
    [assignMutation, cancelMutation, openContextMenu, technicians]
  );

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

  const searchConfig = useMemo(
    () => ({
      title: "Buscar y filtrar órdenes",
      values: filters,
      fields: [
        {
          key: "search",
          label: "Buscar",
          placeholder: "Cliente, dirección, teléfono o técnico",
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
          search: "",
          status: null,
          priority: null,
        }),
      onRefresh: refreshOrders,
    }),
    [filters, refreshOrders]
  );

  const columns = [
    {
      title: "Cliente",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "Dirección",
      dataIndex: "service_location_address",
      key: "service_location_address",
      render: (value) => value || "-",
    },
    {
      title: "Prioridad",
      dataIndex: "priority",
      key: "priority",
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag color={STATUS_COLORS[value] || "default"}>
          {STATUS_LABELS[value] || value}
        </Tag>
      ),
    },
    {
      title: "Técnico",
      dataIndex: "technician_name",
      key: "technician_name",
      render: (value) => value || "Sin asignar",
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
      <div className="grid gap-6">
        <Card className="rounded-2xl">
          <div className="mb-3 text-xs ui-text-muted">
            Clic derecho en una orden para asignarla, reasignarla o cancelarla.
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
            onRow={(record) => ({
              onContextMenu: (event) => openOrderContextMenu(event, record),
            })}
            pagination={{ pageSize: 8 }}
          />
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
      >
        <Card className="rounded-xl">
          <Form
            form={form}
            layout="vertical"
            onValuesChange={(changedValues) => {
              if (!changedValues.customer) {
                return;
              }
              const customer = customers.find(
                (item) => item.id === changedValues.customer
              );
              if (!customer) {
                return;
              }
              form.setFieldsValue({
                service_location_address: customer.address || "",
              });
            }}
            onFinish={(values) => createMutation.mutate(values)}
          >
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
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item
                label="Prioridad"
                name="priority"
                initialValue="MEDIUM"
                rules={[{ required: true, message: "Selecciona la prioridad" }]}
              >
                <Select options={PRIORITY_OPTIONS} />
              </Form.Item>
              <Form.Item label="Técnico inicial" name="technician">
                <Select
                  allowClear
                  options={technicianOptions}
                  placeholder="Opcional"
                />
              </Form.Item>
            </div>
            <Form.Item
              label="Fecha programada"
              name="scheduled_date"
            >
              <Input type="datetime-local" />
            </Form.Item>
            <Form.Item
              label="Dirección del servicio"
              name="service_location_address"
            >
              <Input.TextArea rows={2} placeholder="Dirección del servicio" />
            </Form.Item>
            <Form.Item label="Notas" name="notes">
              <Input.TextArea rows={3} placeholder="Detalles de la orden" />
            </Form.Item>
          </Form>
        </Card>
      </Modal>
    </PageLayout>
  );
};

export default WorkOrders;
