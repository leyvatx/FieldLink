import { useCallback, useMemo, useState } from "react";
import { Button, Card, Form, Input, Select, Table, Tag } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  getSimulationEvents,
  createSimulationEvent,
  processSimulationEvent,
} from "@api/simulationService";
import queryClient from "@lib/queryClient";
import { useMessage } from "@context/MessageProvider";
import { useDialog } from "@context/DialogProvider";

const EVENT_TYPES = [
  { value: "INCIDENT", label: "Incidente" },
  { value: "FAILURE", label: "Falla" },
  { value: "TEST", label: "Prueba" },
];

const Simulator = () => {
  const { success, error } = useMessage();
  const { openContextMenu } = useDialog();
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    search: "",
    eventType: null,
    status: null,
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["simulation-events"],
    queryFn: getSimulationEvents,
  });

  const createMutation = useMutation({
    mutationFn: createSimulationEvent,
    onSuccess: () => {
      success("Escenario creado");
      queryClient.invalidateQueries({ queryKey: ["simulation-events"] });
      form.resetFields();
    },
    onError: () => error("No se pudo crear el escenario"),
  });

  const processMutation = useMutation({
    mutationFn: processSimulationEvent,
    onSuccess: () => {
      success("Evento procesado");
      queryClient.invalidateQueries({ queryKey: ["simulation-events"] });
    },
    onError: () => error("No se pudo procesar el evento"),
  });

  const openSimulationContextMenu = useCallback(
    (event, record) => {
      openContextMenu({
        event,
        items: [
          {
            key: "process",
            label: "Marcar procesado",
            disabled: record.status !== "ACTIVE",
            onClick: () => processMutation.mutate(record.id),
          },
        ],
      });
    },
    [openContextMenu, processMutation]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((record) => {
      if (filters.eventType && record.event_type !== filters.eventType) {
        return false;
      }
      if (filters.status && record.status !== filters.status) {
        return false;
      }

      const search = filters.search.trim().toLowerCase();
      if (!search) {
        return true;
      }

      return [record.event_type, record.description, record.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [events, filters]);

  const columns = [
    {
      title: "Tipo",
      dataIndex: "event_type",
      key: "event_type",
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag color={value === "PROCESSED" ? "green" : "orange"}>{value}</Tag>
      ),
    },
  ];

  const searchConfig = useMemo(
    () => ({
      title: "Buscar y filtrar simulador",
      values: filters,
      fields: [
        {
          key: "search",
          label: "Buscar",
          placeholder: "Tipo, descripción o estado",
        },
        {
          key: "eventType",
          label: "Tipo de evento",
          type: "select",
          options: EVENT_TYPES,
        },
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "ACTIVE", label: "Activo" },
            { value: "PROCESSED", label: "Procesado" },
            { value: "CANCELLED", label: "Cancelado" },
          ],
        },
      ],
      onChange: (patch) => setFilters((prev) => ({ ...prev, ...patch })),
      onReset: () =>
        setFilters({
          search: "",
          eventType: null,
          status: null,
        }),
      onRefresh: () => queryClient.invalidateQueries({ queryKey: ["simulation-events"] }),
    }),
    [filters]
  );

  return (
    <PageLayout
      title="Simulador de escenarios"
      searchConfig={searchConfig}
    >
      <div className="grid gap-6">
        <Card className="rounded-2xl">
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => createMutation.mutate(values)}>
            <div className="grid md:grid-cols-[200px_1fr_auto] gap-4 items-end">
              <Form.Item
                label="Tipo"
                name="event_type"
                rules={[{ required: true, message: "Selecciona un tipo" }]}>
                <Select options={EVENT_TYPES} placeholder="Tipo" />
              </Form.Item>
              <Form.Item
                label="Descripción"
                name="description"
                rules={[{ required: true, message: "Describe el escenario" }]}>
                <Input placeholder="Ej: Caída de red en zona norte" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending}>
                Inyectar falla
              </Button>
            </div>
          </Form>
        </Card>
        <div className="grid gap-3">
          <span className="text-xs ui-text-muted">
            Clic derecho en una fila para procesar el evento.
          </span>
          <Table
            rowKey="id"
            dataSource={filteredEvents}
            columns={columns}
            loading={isLoading}
            onRow={(record) => ({
              onContextMenu: (event) => openSimulationContextMenu(event, record),
            })}
            pagination={{ pageSize: 8 }}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default Simulator;
