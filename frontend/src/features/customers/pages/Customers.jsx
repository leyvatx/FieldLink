import { useState } from "react";
import { Card, Table, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@layouts/page-layout/PageLayout";
import { getCustomers } from "@api/customerService";
import { getWorkOrders } from "@api/workOrderService";

const STATUS_COLORS = {
  PENDING: "default",
  ASSIGNED: "blue",
  IN_TRANSIT: "cyan",
  IN_SERVICE: "gold",
  COMPLETED: "green",
  CANCELLED: "red",
};

const Customers = () => {
  const [selected, setSelected] = useState(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["customer-history", selected?.id],
    queryFn: () =>
      selected?.id ? getWorkOrders({ customer: selected.id }) : Promise.resolve([]),
    enabled: !!selected?.id,
  });

  const customerColumns = [
    {
      title: "Cliente",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Teléfono",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Estado",
      dataIndex: "validation_status",
      key: "validation_status",
      render: (value) => (
        <Tag color={value === "VALIDATED" ? "green" : "orange"}>{value}</Tag>
      ),
    },
  ];

  const historyColumns = [
    {
      title: "Orden",
      dataIndex: "id",
      key: "id",
      render: (value) => value.slice(0, 8),
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (value) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>,
    },
    {
      title: "Prioridad",
      dataIndex: "priority",
      key: "priority",
    },
  ];

  return (
    <PageLayout title="Clientes e historial">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="rounded-2xl">
          <Table
            rowKey="id"
            dataSource={customers}
            columns={customerColumns}
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            onRow={(record) => ({
              onClick: () => setSelected(record),
            })}
          />
        </Card>
        <Card className="rounded-2xl">
          <div className="text-sm font-semibold mb-4">
            Historial de servicio
          </div>
          {selected ? (
            <Table
              rowKey="id"
              dataSource={history}
              columns={historyColumns}
              loading={loadingHistory}
              pagination={{ pageSize: 6 }}
            />
          ) : (
            <div className="text-sm ui-text-muted">
              Selecciona un cliente para ver su historial.
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default Customers;
