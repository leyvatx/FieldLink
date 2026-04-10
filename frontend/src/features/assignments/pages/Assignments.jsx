import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Card, Empty, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PiEnvelope, PiMapPinBold, PiPhone, PiUserListBold } from "react-icons/pi";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  assignWorkOrder,
  getWorkOrders,
  unassignWorkOrder,
} from "@api/workOrderService";
import { getTechnicians } from "@api/userService";
import { useMessage } from "@context/MessageProvider";
import queryClient from "@lib/queryClient";
import { matchesAnyText } from "@/lib/filtering";

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

const PRIORITY_LABELS = Object.fromEntries(
  PRIORITY_OPTIONS.map((option) => [option.value, option.label])
);

const PRIORITY_COLORS = {
  LOW: "default",
  MEDIUM: "blue",
  HIGH: "gold",
  URGENT: "red",
};

const PRIORITY_RANK = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const ACTIVE_ORDER_STATUSES = ["ASSIGNED", "IN_TRANSIT", "IN_SERVICE"];

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "T";
  }

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getAvailabilityState = (activeOrders) =>
  activeOrders === 0 ? "available" : "busy";

const getAvailabilityLabel = (activeOrders) =>
  activeOrders === 0 ? "Disponible" : "Con carga";

const getAvailabilityColor = (activeOrders) =>
  activeOrders === 0 ? "green" : activeOrders > 1 ? "red" : "gold";

const sortOrders = (left, right) => {
  const leftPriority = PRIORITY_RANK[left.priority] ?? 99;
  const rightPriority = PRIORITY_RANK[right.priority] ?? 99;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return String(left.customer_name || "").localeCompare(String(right.customer_name || ""));
};

const isOrderAssigned = (order) => Boolean(order?.technician);

const Assignments = () => {
  const { success, error } = useMessage();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [dragOverLaneId, setDragOverLaneId] = useState(null);
  const [filters, setFilters] = useState({
    query: "",
    technician: "",
    priority: null,
    availability: null,
  });

  const { data: workOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const { data: technicians = [], isLoading: loadingTechnicians } = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });

  const openOrders = useMemo(
    () =>
      workOrders.filter(
        (order) => !["COMPLETED", "CANCELLED"].includes(order.status)
      ),
    [workOrders]
  );

  const findOrderById = (orderId) =>
    openOrders.find((order) => String(order.id) === String(orderId)) || null;

  const technicianLoad = useMemo(() => {
    const counts = new Map();

    openOrders.forEach((order) => {
      if (!order.technician || !ACTIVE_ORDER_STATUSES.includes(order.status)) {
        return;
      }

      counts.set(order.technician, (counts.get(order.technician) || 0) + 1);
    });

    return counts;
  }, [openOrders]);

  const technicianLanes = useMemo(() => {
    return technicians
      .map((technician) => {
        const activeOrders = technicianLoad.get(technician.id) || 0;

        return {
          ...technician,
          activeOrders,
          availability: getAvailabilityState(activeOrders),
        };
      })
      .filter((technician) => {
        if (filters.availability && technician.availability !== filters.availability) {
          return false;
        }

        return matchesAnyText(
          [technician.name, technician.email, technician.phone],
          filters.technician
        );
      })
      .sort((left, right) => {
        if (left.activeOrders !== right.activeOrders) {
          return left.activeOrders - right.activeOrders;
        }

        return String(left.name || "").localeCompare(String(right.name || ""));
      });
  }, [filters.availability, filters.technician, technicianLoad, technicians]);

  const filteredOrders = useMemo(() => {
    const visibleTechnicianIds = new Set(
      technicianLanes.map((technician) => String(technician.id))
    );

    return openOrders
      .filter((order) => {
        if (filters.priority && order.priority !== filters.priority) {
          return false;
        }

        if (
          !matchesAnyText(
            [
              order.customer_name,
              order.service_location_address,
              order.customer_phone,
              order.technician_name,
            ],
            filters.query
          )
        ) {
          return false;
        }

        if (order.technician && filters.technician) {
          return visibleTechnicianIds.has(String(order.technician));
        }

        return true;
      })
      .sort(sortOrders);
  }, [filters.priority, filters.query, filters.technician, openOrders, technicianLanes]);

  const unassignedOrders = useMemo(
    () => filteredOrders.filter((order) => !order.technician),
    [filteredOrders]
  );

  const ordersByTechnician = useMemo(() => {
    const grouped = new Map();

    technicianLanes.forEach((technician) => {
      grouped.set(String(technician.id), []);
    });

    filteredOrders.forEach((order) => {
      if (!order.technician) {
        return;
      }

      const key = String(order.technician);

      if (!grouped.has(key)) {
        return;
      }

      grouped.get(key).push(order);
    });

    return grouped;
  }, [filteredOrders, technicianLanes]);

  useEffect(() => {
    if (!openOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (selectedOrderId && openOrders.some((order) => String(order.id) === String(selectedOrderId))) {
      return;
    }

    if (unassignedOrders.length) {
      setSelectedOrderId(unassignedOrders[0].id);
      return;
    }

    setSelectedOrderId(filteredOrders[0]?.id || openOrders[0].id);
  }, [filteredOrders, openOrders, selectedOrderId, unassignedOrders]);

  const selectedOrder = findOrderById(selectedOrderId);

  const assignMutation = useMutation({
    mutationFn: ({ orderId, technicianId }) => assignWorkOrder(orderId, technicianId),
    onSuccess: () => {
      success("Orden asignada correctamente");
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      setDraggedOrderId(null);
      setDragOverLaneId(null);
    },
    onError: () => error("No se pudo asignar la orden"),
  });

  const unassignMutation = useMutation({
    mutationFn: unassignWorkOrder,
    onSuccess: () => {
      success("Orden devuelta a pendientes");
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      setDraggedOrderId(null);
      setDragOverLaneId(null);
    },
    onError: () => error("No se pudo devolver la orden"),
  });

  const searchConfig = useMemo(
    () => ({
      title: "Buscar y filtrar asignaciónes",
      values: filters,
      fields: [
        {
          key: "query",
          label: "Orden",
          placeholder: "Cliente, dirección, teléfono o técnico",
        },
        {
          key: "technician",
          label: "Técnico",
          placeholder: "Técnico, correo o teléfono",
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
          query: "",
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

  const handleAssign = (orderId, technicianId) => {
    const order = findOrderById(orderId);

    if (!order) {
      error("Selecciona o arrastra una orden");
      return;
    }

    if (String(order.technician ?? "") === String(technicianId)) {
      error("La orden ya está con este técnico");
      return;
    }

    setSelectedOrderId(order.id);

    assignMutation.mutate({
      orderId: order.id,
      technicianId,
    });
  };

  const handleUnassign = (orderId) => {
    const order = findOrderById(orderId);

    if (!order || !order.technician) {
      error("La orden ya está en pendientes");
      return;
    }

    setSelectedOrderId(order.id);
    unassignMutation.mutate(order.id);
  };

  const handleDragStart = (event, orderId) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(orderId));
    setDraggedOrderId(orderId);
    setSelectedOrderId(orderId);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverLaneId(null);
  };

  const handleDropOnLane = (event, technicianId) => {
    event.preventDefault();
    const droppedOrderId = event.dataTransfer.getData("text/plain") || draggedOrderId;
    handleAssign(droppedOrderId, technicianId);
  };

  const draggedOrder = findOrderById(draggedOrderId);
  const canReturnDraggedOrder = isOrderAssigned(draggedOrder);

  const counts = {
    pending: openOrders.filter((order) => !order.technician).length,
    available: technicianLanes.filter((technician) => technician.availability === "available").length,
    busy: technicianLanes.filter((technician) => technician.availability === "busy").length,
  };

  const renderOrderCard = (order) => {
    const isSelected = String(selectedOrderId ?? "") === String(order.id);
    const isDragging = String(draggedOrderId ?? "") === String(order.id);

    return (
      <div
        key={order.id}
        role="button"
        tabIndex={0}
        draggable
        onClick={() => setSelectedOrderId(order.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSelectedOrderId(order.id);
          }
        }}
        onDragStart={(event) => handleDragStart(event, order.id)}
        onDragEnd={handleDragEnd}
        className={`cursor-pointer rounded-[22px] border px-4 py-4 text-left transition ${
          isSelected
            ? "border-[color:color-mix(in_srgb,var(--ui-highlight)_24%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] shadow-[var(--ui-shadow-soft)]"
            : "border-[var(--ui-border)] bg-[var(--ui-card)]"
        } ${isDragging ? "opacity-60" : ""}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[var(--ui-foreground)]">
              {order.customer_name || "Sin cliente"}
            </div>
            <div className="mt-2 flex items-start gap-2 text-sm ui-text-muted">
              <PiMapPinBold size={15} className="mt-0.5 shrink-0" />
              <span className="min-w-0">
                {order.service_location_address || "Sin dirección registrada"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag color={STATUS_COLORS[order.status] || "default"}>
              {STATUS_LABELS[order.status] || order.status}
            </Tag>
            <Tag color={PRIORITY_COLORS[order.priority] || "default"}>
              {PRIORITY_LABELS[order.priority] || order.priority || "Sin prioridad"}
            </Tag>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm ui-text-muted">
          <div className="flex items-center gap-2">
            <PiPhone size={15} />
            <span>{order.customer_phone || "Sin teléfono"}</span>
          </div>
          {order.technician_name ? (
            <div className="flex items-center gap-2">
              <PiUserListBold size={15} />
              <span>{order.technician_name}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-xs ui-text-muted">
            {order.technician
              ? "Arrastra para mover o devuelvela a pendientes."
              : "Arrastra o toca para asignarla."}
          </div>
          {order.technician ? (
            <Button
              size="small"
              type="default"
              className="border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_7%,var(--ui-card))] text-[var(--ui-foreground)] hover:border-[color:color-mix(in_srgb,var(--ui-highlight)_28%,var(--ui-border))] hover:bg-[color:color-mix(in_srgb,var(--ui-highlight)_11%,var(--ui-card))]"
              loading={
                unassignMutation.isPending &&
                String(unassignMutation.variables ?? "") === String(order.id)
              }
              onClick={(event) => {
                event.stopPropagation();
                handleUnassign(order.id);
              }}
            >
              Devolver
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <PageLayout title="Asignación de trabajo" searchConfig={searchConfig}>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--ui-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ui-card)_95%,transparent),color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card)))] px-4 py-4 shadow-[var(--ui-shadow-soft)]">
          <div className="flex flex-wrap gap-2">
            <Tag color="purple">{counts.pending} sin asignar</Tag>
            <Tag color="green">{counts.available} libres</Tag>
            <Tag color="gold">{counts.busy} con carga</Tag>
          </div>
          <div className="min-w-0 text-sm ui-text-muted">
            {selectedOrder
              ? `Seleccionada: ${selectedOrder.customer_name || "Sin cliente"}`
              : "Arrastra una orden a un técnico o toca una tarjeta para moverla con el botón del lane."}
          </div>
        </div>

        <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]">
          <Card
            className={`rounded-[28px] border ${
              String(dragOverLaneId ?? "") === "pending"
                ? "border-[color:color-mix(in_srgb,var(--ui-highlight)_28%,var(--ui-border))]"
                : "border-[var(--ui-border)]"
            }`}
            loading={loadingOrders && !openOrders.length}
          >
            <div
              onDragOver={(event) => {
                if (!canReturnDraggedOrder) {
                  return;
                }

                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverLaneId("pending");
              }}
              onDragLeave={() => {
                if (String(dragOverLaneId ?? "") === "pending") {
                  setDragOverLaneId(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const droppedOrderId =
                  event.dataTransfer.getData("text/plain") || draggedOrderId;
                if (findOrderById(droppedOrderId)?.technician) {
                  handleUnassign(droppedOrderId);
                }
                setDragOverLaneId(null);
              }}
              className="grid gap-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Sin asignar
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Órdenes listas para mandar a campo.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedOrder?.technician ? (
                    <Button
                      size="small"
                      type="default"
                      className="border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_7%,var(--ui-card))] text-[var(--ui-foreground)] hover:border-[color:color-mix(in_srgb,var(--ui-highlight)_28%,var(--ui-border))] hover:bg-[color:color-mix(in_srgb,var(--ui-highlight)_11%,var(--ui-card))]"
                      loading={
                        unassignMutation.isPending &&
                        String(unassignMutation.variables ?? "") === String(selectedOrder.id)
                      }
                      onClick={() => handleUnassign(selectedOrder.id)}
                    >
                      Devolver seleccionada
                    </Button>
                  ) : null}
                  <Tag color="purple">{unassignedOrders.length}</Tag>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {!unassignedOrders.length ? (
                  <div className="rounded-[22px] border border-dashed border-[var(--ui-border)] px-4 py-6 text-sm ui-text-muted">
                    No hay órdenes pendientes de asignación.
                  </div>
                ) : null}
                {unassignedOrders.map(renderOrderCard)}
              </div>
            </div>
          </Card>

          {technicianLanes.map((technician) => {
            const laneId = String(technician.id);
            const laneOrders = ordersByTechnician.get(laneId) || [];
            const isHovered = String(dragOverLaneId ?? "") === laneId;
            const isCurrentForSelection =
              String(selectedOrder?.technician ?? "") === laneId;
            const canAssignSelected =
              selectedOrder && String(selectedOrder.technician ?? "") !== laneId;

            return (
              <Card
                key={technician.id}
                className={`rounded-[28px] border ${
                  isHovered
                    ? "border-[color:color-mix(in_srgb,var(--ui-highlight)_28%,var(--ui-border))]"
                    : "border-[var(--ui-border)]"
                }`}
              >
                <div
                  onDragOver={(event) => {
                    if (!draggedOrderId) {
                      return;
                    }

                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverLaneId(laneId);
                  }}
                  onDragLeave={() => {
                    if (String(dragOverLaneId ?? "") === laneId) {
                      setDragOverLaneId(null);
                    }
                  }}
                  onDrop={(event) => handleDropOnLane(event, technician.id)}
                  className="grid gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      size="large"
                      style={{
                        background:
                          "linear-gradient(135deg, #E879F9 0%, #8B5CF6 55%, #5B21B6 100%)",
                        color: "#FFFFFF",
                      }}
                    >
                      {getInitials(technician.name)}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold text-[var(--ui-foreground)]">
                          {technician.name}
                        </div>
                        {isCurrentForSelection ? <Tag color="blue">Actual</Tag> : null}
                        {canAssignSelected && laneOrders.length === 0 ? (
                          <Tag color="purple">Libre para soltar</Tag>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm ui-text-muted">
                        <PiEnvelope size={15} />
                        <span className="min-w-0 truncate">
                          {technician.email || "Sin correo"}
                        </span>
                      </div>
                    </div>
                    <Tag color={getAvailabilityColor(technician.activeOrders)}>
                      {getAvailabilityLabel(technician.activeOrders)}
                    </Tag>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[22px] ui-bg-soft px-3 py-3">
                    <div className="text-sm text-[var(--ui-foreground)]">
                      {laneOrders.length} orden{laneOrders.length === 1 ? "" : "es"} en este lane
                    </div>
                    <Button
                      size="small"
                      type={canAssignSelected ? "primary" : "default"}
                      disabled={!canAssignSelected}
                      loading={
                        assignMutation.isPending &&
                        String(assignMutation.variables?.orderId ?? "") === String(selectedOrder?.id ?? "") &&
                        String(assignMutation.variables?.technicianId ?? "") === laneId
                      }
                      onClick={() => handleAssign(selectedOrder?.id, technician.id)}
                    >
                      {canAssignSelected ? "Mover aquí" : "Técnico actual"}
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {!laneOrders.length ? (
                      <div className="rounded-[22px] border border-dashed border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] px-4 py-6 text-sm ui-text-muted">
                        {draggedOrderId
                          ? "Suelta aquí la orden arrastrada."
                          : "Este técnico no tiene órdenes visibles con el filtro actual."}
                      </div>
                    ) : null}
                    {laneOrders.map(renderOrderCard)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {!technicianLanes.length && !loadingTechnicians ? (
          <Card className="rounded-[28px]">
            <Empty description="No hay técnicos que coincidan con el filtro actual." />
          </Card>
        ) : null}
      </div>
    </PageLayout>
  );
};

export default Assignments;
