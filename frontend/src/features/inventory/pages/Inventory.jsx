import { useState } from "react";
import { Button, Card, Form, Input, Modal, Table, Tabs, Tag } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  getCentralWarehouse,
  getTechnicianInventory,
  getRestockHistory,
  restockTechnicianInventory,
} from "@api/inventoryService";
import queryClient from "@lib/queryClient";
import { useMessage } from "@context/MessageProvider";

const Inventory = () => {
  const { success, error } = useMessage();
  const [restockTarget, setRestockTarget] = useState(null);
  const [form] = Form.useForm();

  const { data: warehouse = [], isLoading: loadingWarehouse } = useQuery({
    queryKey: ["central-warehouse"],
    queryFn: getCentralWarehouse,
  });

  const { data: technicianInventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["technician-inventory"],
    queryFn: () => getTechnicianInventory(),
  });

  const { data: restockHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["restock-history"],
    queryFn: () => getRestockHistory(),
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, payload }) => restockTechnicianInventory(id, payload),
    onSuccess: () => {
      success("Inventario actualizado");
      queryClient.invalidateQueries({ queryKey: ["technician-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["restock-history"] });
      setRestockTarget(null);
      form.resetFields();
    },
    onError: () => error("No se pudo reabastecer"),
  });

  const warehouseColumns = [
    {
      title: "Material",
      dataIndex: "material_name",
      key: "material_name",
    },
    {
      title: "Disponible",
      dataIndex: "quantity_available",
      key: "quantity_available",
    },
    {
      title: "Reservado",
      dataIndex: "quantity_reserved",
      key: "quantity_reserved",
    },
    {
      title: "Usable",
      dataIndex: "quantity_usable",
      key: "quantity_usable",
    },
    {
      title: "Reorden",
      key: "needs_restock",
      render: (_, record) =>
        record.needs_restock ? (
          <Tag color="red">Reabastecer</Tag>
        ) : (
          <Tag color="green">OK</Tag>
        ),
    },
  ];

  const technicianColumns = [
    {
      title: "Técnico",
      dataIndex: "technician_name",
      key: "technician_name",
    },
    {
      title: "Material",
      dataIndex: "material_name",
      key: "material_name",
    },
    {
      title: "Cantidad",
      dataIndex: "current_quantity",
      key: "current_quantity",
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          onClick={() => setRestockTarget(record)}>
          Reabastecer
        </Button>
      ),
    },
  ];

  const historyColumns = [
    {
      title: "Material",
      dataIndex: "warehouse_material",
      key: "warehouse_material",
    },
    {
      title: "Tipo",
      dataIndex: "restock_type",
      key: "restock_type",
    },
    {
      title: "Cantidad",
      dataIndex: "quantity_change",
      key: "quantity_change",
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
    },
  ];

  return (
    <PageLayout title="Inventario y reabastecimiento">
      <Tabs
        items={[
          {
            key: "warehouse",
            label: "Almacén central",
            children: (
              <Table
                rowKey="id"
                dataSource={warehouse}
                columns={warehouseColumns}
                loading={loadingWarehouse}
                pagination={{ pageSize: 8 }}
              />
            ),
          },
          {
            key: "technicians",
            label: "Inventario de técnicos",
            children: (
              <Table
                rowKey="id"
                dataSource={technicianInventory}
                columns={technicianColumns}
                loading={loadingInventory}
                pagination={{ pageSize: 8 }}
              />
            ),
          },
          {
            key: "history",
            label: "Registro de almacén",
            children: (
              <Table
                rowKey="id"
                dataSource={restockHistory}
                columns={historyColumns}
                loading={loadingHistory}
                pagination={{ pageSize: 8 }}
              />
            ),
          },
        ]}
      />

      <Modal
        open={!!restockTarget}
        title="Reabastecer técnico"
        onCancel={() => setRestockTarget(null)}
        onOk={() => form.submit()}
        okText="Confirmar"
        cancelText="Cancelar"
        confirmLoading={restockMutation.isPending}>
        <Card className="rounded-xl">
          <div className="text-sm font-semibold mb-3">
            {restockTarget?.technician_name} - {restockTarget?.material_name}
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) =>
              restockMutation.mutate({
                id: restockTarget.id,
                payload: {
                  ...values,
                  quantity: Number(values.quantity),
                },
              })
            }>
            <Form.Item
              label="Cantidad"
              name="quantity"
              rules={[{ required: true, message: "Ingresa una cantidad" }]}>
              <Input type="number" min={1} />
            </Form.Item>
            <Form.Item label="Notas" name="notes">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Form>
        </Card>
      </Modal>
    </PageLayout>
  );
};

export default Inventory;
