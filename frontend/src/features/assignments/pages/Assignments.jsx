import { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import ModuleOverview from "@components/ModuleOverview";
import {
  PiCheckCircleBold,
  PiClockCountdownBold,
  PiMapPinBold,
  PiUserListBold,
} from "react-icons/pi";
import PageLayout from "@layouts/page-layout/PageLayout";
import { getWorkOrders, assignWorkOrder, cancelWorkOrder } from "@api/workOrderService";
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

const ACTIVE_ORDER_STATUSES = ["ASSIGNED", "IN_TRANSIT", "IN_SERVICE"];

const Assignments = () => {
  const { success, error } = useMessage();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [filters, setFilters] = useState({
    customer: "",
    address: "",
    technician: "",
    priority: null,
    availability: null,
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const { data: technicians = [], isLoading: loadingTechnicians } = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });

  const assignMutation = useMutation({
    mutationFn: ({ orderId, technicianId }) => assignWorkOrder(orderId, technicianId),
    onSuccess: () => {
      success("Orden asignada correctamente");
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
    onError: () => error("No se pudo asignar la orden"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelWorkOrder,
    onSuccess: () => {
      success("Orden cancelada");
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
    onError: () => error("No se pudo cancelar la orden"),
  });

  const technicianLoad = useMemo(() => {
    const counts = new Map();
    workOrders.forEach((order) => {
      if (!order.technician || !ACTIVE_ORDER_STATUSES.includes(order.status)) {
        return;
      }
      counts.set(order.technician, (counts.get(order.technician) || 0) + 1);
    });
    return counts;
  }, [workOrders]);

  const filteredOrders = useMemo(() => {
    return workOrders
      .filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status))
      .filter((order) => {
        if (filters.priority && order.priority !== filters.priority) {
          return false;
        }

        if (!matchesText(order.customer_name, filters.customer)) {
          return false;
        }
        if (!matchesText(order.service_location_address, filters.address)) {
          return false;
        }
        return matchesText(order.technician_name, filters.technician);
      })
      .sort((left, right) => {
        if (left.status === "PENDING" && right.status !== "PENDING") {
          return -1;
        }
        if (left.status !== "PENDING" && right.status === "PENDING") {
          return 1;
        }
        return 0;
      });
  }, [filters, workOrders]);

  const technicianCards = useMemo(() => {
    return technicians
      .map((technician) => {
        const activeOrders = technicianLoad.get(technician.id) || 0;
        return {
          ...technician,
          activeOrders,
          availability: activeOrders === 0 ? "available" : "busy",
        };
      })
      .filter((technician) => {
        if (filters.availability && technician.availability !== filters.availability) {
          return false;
        }

        if (!matchesText(technician.name, filters.technician)) {
          return false;
        }
        return true;
      })
      .sort((left, right) => left.activeOrders - right.activeOrders);
  }, [filters, technicianLoad, technicians]);

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (!selectedOrderId || !filteredOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedOrderId) || null;

  const metrics = useMemo(
    () => ({
      pending: workOrders.filter((order) => order.status === "PENDING").length,
      assigned: workOrders.filter((order) => order.status === "ASSIGNED").length,
      availableTechnicians: technicianCards.filter(
        (technician) => technician.availability === "available"
      ).length,
      busyTechnicians: technicianCards.filter(
        (technician) => technician.availability === "busy"
      ).length,
    }),
    [technicianCards, workOrders]
  );

  const searchConfig = useMemo(
    () => ({
      title: "Buscar y filtrar asignaciones",
      values: filters,
      fields: [
        {
          key: "customer",
          label: "Cliente",
          placeholder: "Cliente, dirección, teléfono o técnico",
        },
        {
          key: "address",
          label: "Direccion",
          placeholder: "Direccion o correo tecnico",
        },
        {
          key: "technician",
          label: "Tecnico",
          placeholder: "Tecnico asignado",
        },
        {
          key: "priority",
          label: "Prioridad",
          type: "select",
          options: PRIORITY_OPTIONS,
        },
        {
          key: "availability",
          label: "Disponibilidad",
          type: "select",
          options: [
            { value: "available", label: "Disponible" },
            { value: "busy", label: "Con carga" },
          ],
        },
      ],
      onChange: (nextFilters) => setFilters((prev) => ({ ...prev, ...nextFilters })),
      onReset: () =>
        setFilters({
          customer: "",
          address: "",
          technician: "",
          priority: null,
          availability: null,
        }),
      onRefresh: () => {
        queryClient.invalidateQueries({ queryKey: ["work-orders"] });
        queryClient.invalidateQueries({ queryKey: ["technicians"] });
      },
    }),
    [filters]
  );

  return (
    <PageLayout
      title="Asignación de trabajo"
      searchConfig={searchConfig}
    >
      <div className="grid gap-6">
        <ModuleOverview
          badge="Asignacion"
          title="Asignacion de trabajo"
          subtitle="Ordenes, tecnicos y carga."
          tags={["Pendientes", "Tecnicos", "Carga"]}
          stats={[
            {
              label: "Pendientes",
              value: metrics.pending,
              help: "por asignar",
            },
            {
              label: "Asignadas",
              value: metrics.assigned,
              help: "activas",
            },
            {
              label: "Libres",
              value: metrics.availableTechnicians,
              help: "tecnicos disponibles",
            },
            {
              label: "Ocupados",
              value: metrics.busyTechnicians,
              help: "con carga",
            },
          ]}
        />










































        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <Card className="rounded-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Órdenes por asignar</div>
                <div className="text-xs ui-text-muted">
                  Selecciona una orden y luego asígnala a un técnico disponible.
                </div>
              </div>
              {selectedOrder && (
                <Button
                  danger
                  size="small"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(selectedOrder.id)}
                >
                  Cancelar orden
                </Button>
              )}
            </div>
            <div className="grid gap-3">
              {!filteredOrders.length && <Empty description="Sin órdenes abiertas" />}
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedOrderId === order.id
                      ? "ui-border-default ui-bg-elevated"
                      : "ui-border-subtle ui-bg-surface"
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{order.customer_name}</div>
                      <div className="text-xs ui-text-muted">
                        {order.service_location_address || "Sin dirección"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Tag color={STATUS_COLORS[order.status] || "default"}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Tag>
                      <Tag>{order.priority}</Tag>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs ui-text-muted">
                    <span>Teléfono: {order.customer_phone || "Sin dato"}</span>
                    <span>
                      Técnico actual: {order.technician_name || "Sin asignar"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl">
            <div className="mb-4">
              <div className="font-semibold">Técnicos disponibles</div>
              <div className="text-xs ui-text-muted">
                La carga activa se calcula con órdenes asignadas, en ruta o en servicio.
              </div>
            </div>

            {selectedOrder ? (
              <div className="mb-4 rounded-2xl border ui-border-default ui-bg-elevated p-4">
                <div className="text-xs ui-text-muted">Orden seleccionada</div>
                <div className="mt-1 font-semibold">{selectedOrder.customer_name}</div>
                <div className="text-sm ui-text-muted">
                  {selectedOrder.service_location_address || "Sin dirección"}
                </div>
              </div>
            ) : (
              <div className="mb-4 rounded-2xl border ui-border-subtle ui-bg-soft p-4 text-sm ui-text-muted">
                Selecciona una orden para habilitar la asignación.
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {technicianCards.map((technician) => (
                <Card
                  key={technician.id}
                  className="rounded-2xl"
                  styles={{ body: { padding: 16 } }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{technician.name}</div>
                      <div className="text-xs ui-text-muted">{technician.email}</div>
                    </div>
                    <Tag color={technician.availability === "available" ? "green" : "gold"}>
                      {technician.availability === "available" ? "Disponible" : "Con carga"}
                    </Tag>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm ui-text-muted">
                    <span>Órdenes activas: {technician.activeOrders}</span>
                    <span>Teléfono: {technician.phone || "Sin teléfono"}</span>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    type="primary"
                    disabled={!selectedOrder}
                    loading={assignMutation.isPending}
                    onClick={() =>
                      assignMutation.mutate({
                        orderId: selectedOrder.id,
                        technicianId: technician.id,
                      })
                    }
                  >
                    Asignar orden seleccionada
                  </Button>
                </Card>
              ))}
            </div>

            {!technicianCards.length && !loadingTechnicians && (
              <Empty className="mt-6" description="Sin técnicos disponibles" />
            )}
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Assignments;
