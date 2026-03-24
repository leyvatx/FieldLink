import { useMemo, useState } from "react";
import { Button, Card, Table, Tag } from "@/lib/antd-compat";
import { useQuery } from "@tanstack/react-query";
import { PiPlusBold } from "react-icons/pi";
import ModuleOverview from "@components/ModuleOverview";
import PageLayout from "@layouts/page-layout/PageLayout";
import { useDialog } from "@context/DialogProvider";
import { getCustomers } from "@api/customerService";
import { getWorkOrders } from "@api/workOrderService";
import CreateCustomerForm from "@features/customers/components/CreateCustomerForm";
import queryClient from "@lib/queryClient";
import { matchesText } from "@/lib/filtering";

const STATUS_COLORS = {
  PENDING: "default",
  ASSIGNED: "blue",
  IN_TRANSIT: "cyan",
  IN_SERVICE: "gold",
  COMPLETED: "green",
  CANCELLED: "red",
};

const CUSTOMER_STATUS_LABELS = {
  PENDING: "Pendiente",
  VALIDATED: "Validado",
  REJECTED: "Rechazado",
};

const Customers = () => {
  const { openDrawer } = useDialog();
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    status: null,
  });

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

  const filteredCustomers = useMemo(() => {
    return customers.filter((record) => {
      if (filters.status && record.validation_status !== filters.status) {
        return false;
      }

      if (!matchesText(record.name, filters.name)) {
        return false;
      }
      if (!matchesText(record.phone, filters.phone)) {
        return false;
      }
      if (!matchesText(record.email, filters.email)) {
        return false;
      }
      return matchesText(record.address, filters.address);
    });
  }, [customers, filters]);

  const customerMetrics = useMemo(
    () => ({
      total: filteredCustomers.length,
      validated: filteredCustomers.filter(
        (record) => record.validation_status === "VALIDATED"
      ).length,
      pending: filteredCustomers.filter(
        (record) => record.validation_status === "PENDING"
      ).length,
      selectedHistory: selected ? history.length : 0,
    }),
    [filteredCustomers, history.length, selected]
  );

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
      render: (value) => value || "-",
    },
    {
      title: "Correo",
      dataIndex: "email",
      key: "email",
      render: (value) => value || "-",
    },
    {
      title: "Estado",
      dataIndex: "validation_status",
      key: "validation_status",
      render: (value) => (
        <Tag color={value === "VALIDATED" ? "green" : value === "REJECTED" ? "red" : "orange"}>
          {CUSTOMER_STATUS_LABELS[value] || value}
        </Tag>
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

  const searchConfig = useMemo(
    () => ({
      title: "Filtros de clientes",
      values: filters,
      fields: [
        {
          key: "name",
          label: "Cliente",
          placeholder: "Cliente, teléfono, correo o dirección",
        },
        {
          key: "phone",
          label: "Telefono",
          placeholder: "Numero o parte del numero",
        },
        {
          key: "email",
          label: "Correo",
          placeholder: "Correo del cliente",
        },
        {
          key: "address",
          label: "Direccion",
          placeholder: "Direccion del servicio",
        },
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "PENDING", label: "Pendiente" },
            { value: "VALIDATED", label: "Validado" },
            { value: "REJECTED", label: "Rechazado" },
          ],
        },
      ],
      onChange: (patch) => setFilters((prev) => ({ ...prev, ...patch })),
      onReset: () =>
        setFilters({
          name: "",
          phone: "",
          email: "",
          address: "",
          status: null,
        }),
      onRefresh: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
    }),
    [filters]
  );

  return (
    <PageLayout
      title="Clientes e historial"
      searchConfig={searchConfig}
      topbarOptions={
        <Button
          type="primary"
          icon={<PiPlusBold size={16} />}
          onClick={() =>
            openDrawer({
              title: "Crear cliente",
              content: <CreateCustomerForm onCreated={(customer) => setSelected(customer)} />,
            })
          }
        >
          Nuevo cliente
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6 lg:col-span-2">
          <ModuleOverview
            badge="Clientes"
            title="Clientes e historial"
            subtitle="Base, validacion e historial."
            tags={["Clientes", "Validacion", "Historial"]}
            stats={[
              {
                label: "Clientes",
                value: customerMetrics.total,
                help: "visibles",
              },
              {
                label: "Validados",
                value: customerMetrics.validated,
                help: "con alta confirmada",
              },
              {
                label: "Pendientes",
                value: customerMetrics.pending,
                help: "por revisar",
              },
              {
                label: "Historial",
                value: customerMetrics.selectedHistory,
                help: selected ? "del cliente seleccionado" : "selecciona un cliente",
              },
            ]}
          />
        </div>

        <Card className="rounded-2xl">
          <Table
            rowKey="id"
            dataSource={filteredCustomers}
            columns={customerColumns}
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            onRow={(record) => ({
              onClick: () => setSelected(record),
            })}
          />
        </Card>

        <Card className="rounded-2xl">
          <div className="mb-4 text-sm font-semibold">Historial de servicio</div>
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
