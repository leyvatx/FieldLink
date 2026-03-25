import { useMemo, useState } from "react";
import { Button, Card, Empty, Tag } from "@/lib/antd-compat";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  PiArrowsClockwiseBold,
  PiCheckCircleBold,
  PiPackageBold,
  PiUsersThreeBold,
  PiWarningCircleBold,
} from "react-icons/pi";
import ModuleStatStrip from "@components/ModuleStatStrip";
import PageLayout from "@layouts/page-layout/PageLayout";
import { useAuth } from "@context/AuthProvider";
import { getWorkOrders } from "@api/workOrderService";
import { getTechnicians } from "@api/userService";
import { getTechnicianLocations } from "@api/trackingService";
import { getServiceRequests } from "@api/serviceRequestService";
import { getUsedMaterials } from "@api/materialApprovalService";
import { isSupervisor } from "@utils/constants/roles";
import { matchesText } from "@/lib/filtering";
import OperationsLiveMap from "@/common/components/location/OperationsLiveMap";

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
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const FIELD_STATUSES = ["ASSIGNED", "IN_TRANSIT", "IN_SERVICE"];
const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED"];

function formatReportTime(value) {
  if (!value) {
    return "Sin reporte";
  }

  return dayjs(value).format("DD/MM HH:mm");
}

function comparePriority(left, right) {
  return (PRIORITY_RANK[right.priority] || 0) - (PRIORITY_RANK[left.priority] || 0);
}

function sortByPriorityAndCustomer(left, right) {
  const priorityDiff = comparePriority(left, right);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return String(left.customer_name || "").localeCompare(String(right.customer_name || ""));
}

function buildLatestLocationMap(locations) {
  const locationMap = new Map();

  locations.forEach((location) => {
    const currentValue = locationMap.get(location.technician);
    if (!currentValue) {
      locationMap.set(location.technician, location);
      return;
    }

    if (dayjs(location.timestamp).isAfter(currentValue.timestamp)) {
      locationMap.set(location.technician, location);
    }
  });

  return locationMap;
}

const Dashboard = () => {
  const { user } = useAuth();
  const supervisorView = isSupervisor(user);
  const [filters, setFilters] = useState({
    customer: "",
    address: "",
    technician: "",
    priority: null,
  });

  const { data: workOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["dashboard-work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const { data: technicians = [], isLoading: loadingTechnicians } = useQuery({
    queryKey: ["dashboard-technicians"],
    queryFn: getTechnicians,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["dashboard-technician-locations"],
    queryFn: () => getTechnicianLocations(),
    refetchInterval: 20000,
    refetchOnWindowFocus: false,
  });

  const { data: serviceRequests = [] } = useQuery({
    queryKey: ["dashboard-service-requests"],
    queryFn: () => getServiceRequests({ status: "PENDING" }),
  });

  const { data: usedMaterials = [] } = useQuery({
    queryKey: ["dashboard-used-materials"],
    queryFn: () => getUsedMaterials(),
  });

  const latestLocations = useMemo(
    () => buildLatestLocationMap(locations),
    [locations]
  );

  const filteredOrders = useMemo(
    () =>
      workOrders.filter((order) => {
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
      }),
    [filters, workOrders]
  );

  const openOrders = useMemo(
    () => filteredOrders.filter((order) => !TERMINAL_STATUSES.includes(order.status)),
    [filteredOrders]
  );

  const dispatchQueue = useMemo(
    () =>
      [...openOrders.filter((order) => !order.technician)]
        .sort(sortByPriorityAndCustomer)
        .slice(0, 6),
    [openOrders]
  );

  const fieldOrders = useMemo(
    () =>
      [...openOrders.filter((order) => order.technician && FIELD_STATUSES.includes(order.status))]
        .sort((left, right) => {
          const leftWeight =
            left.status === "IN_SERVICE" ? 3 : left.status === "IN_TRANSIT" ? 2 : 1;
          const rightWeight =
            right.status === "IN_SERVICE" ? 3 : right.status === "IN_TRANSIT" ? 2 : 1;
          if (rightWeight !== leftWeight) {
            return rightWeight - leftWeight;
          }

          return sortByPriorityAndCustomer(left, right);
        })
        .slice(0, 6),
    [openOrders]
  );

  const technicianBoard = useMemo(
    () =>
      technicians
        .map((technician) => {
          const activeOrders = openOrders.filter(
            (order) => order.technician === technician.id && FIELD_STATUSES.includes(order.status)
          );

          return {
            ...technician,
            activeOrders,
            lastLocation: latestLocations.get(technician.id) || null,
          };
        })
        .sort((left, right) => {
          if (left.activeOrders.length !== right.activeOrders.length) {
            return right.activeOrders.length - left.activeOrders.length;
          }

          return String(left.name || "").localeCompare(String(right.name || ""));
        }),
    [latestLocations, openOrders, technicians]
  );

  const trackedTechnicians = useMemo(
    () => technicianBoard.filter((technician) => technician.lastLocation),
    [technicianBoard]
  );

  const pendingRequests = useMemo(
    () =>
      [...serviceRequests]
        .sort((left, right) => {
          const suspiciousDiff = Number(Boolean(right.is_suspicious)) - Number(Boolean(left.is_suspicious));
          if (suspiciousDiff !== 0) {
            return suspiciousDiff;
          }

          return String(left.customer_name || "").localeCompare(String(right.customer_name || ""));
        })
        .slice(0, 5),
    [serviceRequests]
  );

  const pendingMaterialReviews = useMemo(
    () =>
      usedMaterials
        .filter((item) => !item.approval_status || item.approval_status === "PENDING")
        .sort((left, right) => String(left.material_name || "").localeCompare(String(right.material_name || "")))
        .slice(0, 5),
    [usedMaterials]
  );

  const mapPoints = useMemo(
    () =>
      technicianBoard
        .map((technician) => {
          if (
            technician.lastLocation?.latitude == null ||
            technician.lastLocation?.longitude == null
          ) {
            return null;
          }

          return {
            id: `technician-${technician.id}`,
            type: "technician",
            latitude: Number(technician.lastLocation.latitude),
            longitude: Number(technician.lastLocation.longitude),
            title: technician.name,
            subtitle: technician.activeOrders[0]?.service_location_address || "Sin orden activa",
            meta: [
              {
                label: "Carga",
                value: String(technician.activeOrders.length),
              },
              {
                label: "Último reporte",
                value: formatReportTime(technician.lastLocation.timestamp),
              },
            ],
          };
        })
        .filter(Boolean),
    [technicianBoard]
  );

  const fieldTechnicians = technicianBoard.filter(
    (technician) => technician.activeOrders.length > 0
  ).length;
  const coverageRate = technicians.length
    ? Math.round((trackedTechnicians.length / technicians.length) * 100)
    : 0;

  const summaryStats = supervisorView
    ? [
        {
          label: "Por asignar",
          value: dispatchQueue.length,
          help: "órdenes sin técnico",
        },
        {
          label: "En campo",
          value: fieldTechnicians,
          help: "técnicos con carga",
        },
        {
          label: "Solicitudes",
          value: pendingRequests.length,
          help: "pendientes",
        },
        {
          label: "Material",
          value: pendingMaterialReviews.length,
          help: "por revisar",
        },
      ]
    : [
        {
          label: "Abiertas",
          value: openOrders.length,
          help: "órdenes activas",
        },
        {
          label: "En ruta",
          value: openOrders.filter((order) => order.status === "IN_TRANSIT").length,
          help: "traslados activos",
        },
        {
          label: "En servicio",
          value: openOrders.filter((order) => order.status === "IN_SERVICE").length,
          help: "trabajos en sitio",
        },
        {
          label: "Cobertura",
          value: `${coverageRate}%`,
          help: "equipo con reporte",
        },
      ];

  const searchConfig = useMemo(
    () => ({
      title: supervisorView ? "Filtros de supervisión" : "Filtros operativos",
      values: filters,
      fields: [
        {
          key: "customer",
          label: "Cliente",
          placeholder: "Nombre del cliente",
        },
        {
          key: "address",
          label: "Dirección",
          placeholder: "Zona o dirección del servicio",
        },
        {
          key: "technician",
          label: "Técnico",
          placeholder: "Nombre del técnico",
        },
        {
          key: "priority",
          label: "Prioridad",
          type: "select",
          options: PRIORITY_OPTIONS,
        },
      ],
      onChange: (nextFilters) =>
        setFilters((previous) => ({ ...previous, ...nextFilters })),
      onReset: () =>
        setFilters({
          customer: "",
          address: "",
          technician: "",
          priority: null,
        }),
    }),
    [filters, supervisorView]
  );

  return (
    <PageLayout
      title={supervisorView ? "Centro de supervisión" : "Control operativo"}
      searchConfig={searchConfig}
      topbarOptions={
        <Link to={supervisorView ? "/assignments" : "/work-orders"}>
          <Button
            type="primary"
            icon={supervisorView ? <PiUsersThreeBold size={16} /> : <PiPackageBold size={16} />}
          >
            {supervisorView ? "Asignaciones" : "Órdenes"}
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4">
        <ModuleStatStrip
          badge={supervisorView ? "Supervisor" : "Operación"}
          description={
            supervisorView
              ? "Despacho, seguimiento y revisión del equipo en una sola vista."
              : "Órdenes abiertas, técnicos en campo y pendientes visibles."
          }
          stats={summaryStats}
        />

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.92fr)]">
          <div className="grid gap-4">
            <Card className="rounded-[28px]" loading={loadingOrders}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Despacho inmediato
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Órdenes sin técnico listas para mover a campo.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color={dispatchQueue.length ? "gold" : "green"}>
                    {dispatchQueue.length} pendientes
                  </Tag>
                  <Link to="/assignments">
                    <Button size="small" icon={<PiArrowsClockwiseBold size={14} />}>
                      Despachar
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                {!dispatchQueue.length && !loadingOrders ? (
                  <Empty description="No hay órdenes pendientes de asignación." />
                ) : null}

                {dispatchQueue.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ui-foreground)]">
                          {order.customer_name}
                        </div>
                        <div className="mt-1 text-sm ui-text-muted">
                          {order.service_location_address || "Sin dirección"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Tag color={STATUS_COLORS[order.status] || "default"}>
                          {STATUS_LABELS[order.status] || order.status}
                        </Tag>
                        <Tag color={PRIORITY_COLORS[order.priority] || "default"}>
                          {PRIORITY_LABELS[order.priority] || order.priority}
                        </Tag>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[28px]" loading={loadingOrders}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Seguimiento en campo
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Servicios activos que conviene vigilar primero.
                  </div>
                </div>
                <Tag color="purple">{fieldOrders.length} visibles</Tag>
              </div>

              <div className="grid gap-3">
                {!fieldOrders.length && !loadingOrders ? (
                  <Empty description="No hay órdenes activas con los filtros actuales." />
                ) : null}

                {fieldOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ui-foreground)]">
                          {order.customer_name}
                        </div>
                        <div className="mt-1 text-sm ui-text-muted">
                          {order.service_location_address || "Sin dirección"}
                        </div>
                        <div className="mt-2 text-sm ui-text-muted">
                          Técnico: {order.technician_name || "Sin asignar"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Tag color={STATUS_COLORS[order.status] || "default"}>
                          {STATUS_LABELS[order.status] || order.status}
                        </Tag>
                        <Tag color={PRIORITY_COLORS[order.priority] || "default"}>
                          {PRIORITY_LABELS[order.priority] || order.priority}
                        </Tag>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[28px]">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Mapa de seguimiento
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Últimos reportes del equipo visible.
                  </div>
                </div>
                <Tag color={coverageRate > 50 ? "green" : "gold"}>
                  Cobertura {coverageRate}%
                </Tag>
              </div>

              {mapPoints.length ? (
                <div className="overflow-hidden rounded-[24px] border border-[var(--ui-border)]">
                  <OperationsLiveMap points={mapPoints} className="h-[320px]" />
                </div>
              ) : (
                <Empty description="Todavía no hay posiciones disponibles para mostrar en el mapa." />
              )}
            </Card>
          </div>

          <div className="grid gap-4">
            <Card className="rounded-[28px]" loading={loadingTechnicians}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Cuadrilla
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Carga, disponibilidad y último reporte de cada técnico.
                  </div>
                </div>
                <Link to="/users">
                  <Button size="small">Ver técnicos</Button>
                </Link>
              </div>

              <div className="grid gap-3">
                {!technicianBoard.length && !loadingTechnicians ? (
                  <Empty description="No hay técnicos registrados." />
                ) : null}

                {technicianBoard.slice(0, 6).map((technician) => (
                  <div
                    key={technician.id}
                    className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ui-foreground)]">
                          {technician.name}
                        </div>
                        <div className="mt-1 text-sm ui-text-muted">
                          {technician.email || "Sin correo"}
                        </div>
                      </div>
                      <Tag
                        color={
                          technician.activeOrders.length > 1
                            ? "red"
                            : technician.activeOrders.length
                              ? "gold"
                              : "green"
                        }
                      >
                        {technician.activeOrders.length > 1
                          ? "Alta carga"
                          : technician.activeOrders.length
                            ? "En campo"
                            : "Libre"}
                      </Tag>
                    </div>
                    <div className="mt-3 grid gap-1 text-sm ui-text-muted">
                      <span>Órdenes activas: {technician.activeOrders.length}</span>
                      <span>Último reporte: {formatReportTime(technician.lastLocation?.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[28px]">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Solicitudes por revisar
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Pendientes de validar antes de volverlas orden.
                  </div>
                </div>
                <Link to="/service-requests">
                  <Button size="small" icon={<PiWarningCircleBold size={14} />}>
                    Revisar
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3">
                {!pendingRequests.length ? (
                  <Empty description="No hay solicitudes pendientes." />
                ) : null}

                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ui-foreground)]">
                          {request.customer_name}
                        </div>
                        <div className="mt-1 text-sm ui-text-muted">
                          {request.address || "Sin dirección"}
                        </div>
                      </div>
                      {request.is_suspicious ? (
                        <Tag color="gold">Con alerta</Tag>
                      ) : (
                        <Tag color="default">Pendiente</Tag>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[28px]">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Material por validar
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Consumos pendientes antes de cerrar revisión.
                  </div>
                </div>
                <Link to="/materials-approval">
                  <Button size="small" icon={<PiCheckCircleBold size={14} />}>
                    Validar
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3">
                {!pendingMaterialReviews.length ? (
                  <Empty description="No hay consumos pendientes." />
                ) : null}

                {pendingMaterialReviews.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ui-foreground)]">
                          {item.material_name}
                        </div>
                        <div className="mt-1 text-sm ui-text-muted">
                          Orden {String(item.work_order_id || "").slice(0, 8)}
                        </div>
                      </div>
                      <Tag color="gold">{item.quantity_used}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
