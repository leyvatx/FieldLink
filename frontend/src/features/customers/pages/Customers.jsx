import { useMemo, useState } from "react";
import { Button, Card, Table, Tag } from "@/lib/antd-compat";
import { useQuery } from "@tanstack/react-query";
import { PiPlusBold } from "react-icons/pi";
import ModuleStatStrip from "@components/ModuleStatStrip";
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

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === String(selected?.id)) || selected,
    [customers, selected]
  );

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
      selectedHistory: selectedCustomer ? history.length : 0,
    }),
    [filteredCustomers, history.length, selectedCustomer]
  );

  const customerColumns = [
    {
      title: "Cliente",
      key: "name",
      width: 280,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="font-semibold text-[var(--ui-foreground)]">{record.name}</div>
          <div className="text-sm ui-text-muted">{record.email || "Sin correo"}</div>
        </div>
      ),
    },
    {
      title: "Contacto",
      key: "contact",
      width: 360,
      render: (_, record) => (
        <div className="grid gap-1">
          <div>{record.phone || "-"}</div>
          <div className="line-clamp-2 text-sm ui-text-muted">
            {record.address || "Sin dirección"}
          </div>
        </div>
      ),
    },
    {
      title: "Estado",
      dataIndex: "validation_status",
      key: "validation_status",
      width: 160,
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
      width: 150,
      render: (value) => value.slice(0, 8),
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (value) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>,
    },
    {
      title: "Prioridad",
      dataIndex: "priority",
      key: "priority",
      width: 140,
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
          label: "Teléfono",
          placeholder: "Número o parte del número",
        },
        {
          key: "email",
          label: "Correo",
          placeholder: "Correo del cliente",
        },
        {
          key: "address",
          label: "Dirección",
          placeholder: "Dirección del cliente",
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
              width: 720,
              content: <CreateCustomerForm onCreated={(customer) => setSelected(customer)} />,
            })
          }
        >
          Nuevo cliente
        </Button>
      }
    >
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]">
        <div className="2xl:col-span-2">
          <ModuleStatStrip
            badge="Clientes"
            description="La tabla queda al frente y el historial solo acompaña al cliente que selecciones."
            stats={[
              {
                label: "Visibles",
                value: customerMetrics.total,
                help: "clientes filtrados",
              },
              {
                label: "Validados",
                value: customerMetrics.validated,
                help: "alta confirmada",
              },
              {
                label: "Pendientes",
                value: customerMetrics.pending,
                help: "por revisar",
              },
              {
                label: "Historial",
                value: customerMetrics.selectedHistory,
                help: selectedCustomer ? "del cliente actual" : "elige un cliente",
              },
            ]}
          />
        </div>

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Base de clientes
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Selecciona una fila para ver contexto e historial sin perder la tabla.
              </div>
            </div>
            <Tag color="purple">{filteredCustomers.length} visibles</Tag>
          </div>
          <Table
            rowKey="id"
            dataSource={filteredCustomers}
            columns={customerColumns}
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            onRow={(record) => ({
              onClick: () => setSelected(record),
              className:
                String(selectedCustomer?.id ?? "") === String(record.id)
                  ? "bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))]"
                  : undefined,
            })}
            scroll={{ x: 760 }}
          />
        </Card>

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Historial de servicio
              </div>
              {selectedCustomer ? (
                <div className="mt-2 grid gap-1 text-sm ui-text-muted">
                  <span>{selectedCustomer.name}</span>
                  <span>{selectedCustomer.phone || "Sin teléfono"}</span>
                  <span className="line-clamp-2">
                    {selectedCustomer.address || "Sin dirección"}
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-sm ui-text-muted">
                  Selecciona un cliente para ver sus órdenes recientes.
                </div>
              )}
            </div>
            {selectedCustomer ? (
              <Tag
                color={
                  selectedCustomer.validation_status === "VALIDATED"
                    ? "green"
                    : selectedCustomer.validation_status === "REJECTED"
                      ? "red"
                      : "orange"
                }
              >
                {CUSTOMER_STATUS_LABELS[selectedCustomer.validation_status] ||
                  selectedCustomer.validation_status}
              </Tag>
            ) : null}
          </div>
          {selectedCustomer ? (
            <Table
              rowKey="id"
              dataSource={history}
              columns={historyColumns}
              loading={loadingHistory}
              pagination={{ pageSize: 6 }}
              scroll={{ x: 460 }}
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
