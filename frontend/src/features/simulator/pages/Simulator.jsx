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

const EVENT_TYPES = [
  { value: "INCIDENT", label: "Incidente" },
  { value: "FAILURE", label: "Falla" },
  { value: "TEST", label: "Prueba" },
];

const Simulator = () => {
  const { success, error } = useMessage();
  const [form] = Form.useForm();

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
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Button
          size="small"
          disabled={record.status !== "ACTIVE"}
          onClick={() => processMutation.mutate(record.id)}>
          Marcar procesado
        </Button>
      ),
    },
  ];

  return (
    <PageLayout title="Simulador de escenarios">
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
        <Table
          rowKey="id"
          dataSource={events}
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 8 }}
        />
      </div>
    </PageLayout>
  );
};

export default Simulator;
