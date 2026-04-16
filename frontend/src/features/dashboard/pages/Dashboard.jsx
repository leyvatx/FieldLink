import { useCallback, useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Tag } from "@/lib/antd-compat";
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
import { normalizeCoordinates } from "@/lib/locationCoordinates";
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

const EMPTY_ITEMS = [];
const FIELD_STATUSES = ["ASSIGNED", "IN_TRANSIT", "IN_SERVICE"];
const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED"];

function formatReportTime(value) {
  if (!value) {
    return "Sin reporte";
  }

  return dayjs(value).format("DD/MM HH:mm");
}

function getStatusWeight(status) {
  if (status === "IN_SERVICE") return 3;
  if (status === "IN_TRANSIT") return 2;
  if (status === "ASSIGNED") return 1;
  return 0;
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

function sortFieldOrders(left, right) {
  const leftWeight = getStatusWeight(left.status);
  const rightWeight = getStatusWeight(right.status);

  if (rightWeight !== leftWeight) {
    return rightWeight - leftWeight;
  }

  return sortByPriorityAndCustomer(left, right);
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

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineKm(start, end) {
  const radius = 6371;
  const dLat = toRad(end.lat - start.lat);
  const dLon = toRad(end.lon - start.lon);
  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateEtaMinutes(distanceKm, speedKmh = 32) {
  return Math.max(3, Math.round((distanceKm / speedKmh) * 60));
}

function formatDistance(distanceKm) {
  if (distanceKm == null) {
    return "Sin calcular";
  }

  if (distanceKm < 1) {
    return `${Math.max(50, Math.round(distanceKm * 1000))} m`;
  }

  return `${distanceKm >= 10 ? distanceKm.toFixed(0) : distanceKm.toFixed(1)} km`;
}

function getLocationFreshness(timestamp) {
  if (!timestamp) {
    return {
      state: "missing",
      label: "Sin reporte",
      color: "default",
      sortRank: 3,
    };
  }

  const minutes = Math.max(0, dayjs().diff(timestamp, "minute"));

  if (minutes <= 10) {
    return {
      state: "live",
      label: "En linea",
      color: "green",
      minutes,
      sortRank: 0,
    };
  }

  if (minutes <= 45) {
    return {
      state: "recent",
      label: `Hace ${minutes} min`,
      color: "gold",
      minutes,
      sortRank: 1,
    };
  }

  return {
    state: "stale",
    label: `Hace ${minutes} min`,
    color: "red",
    minutes,
    sortRank: 2,
  };
}

function getPrimaryOrder(activeOrders) {
  if (!activeOrders.length) {
    return null;
  }

  return [...activeOrders].sort(sortFieldOrders)[0];
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

  const workOrdersQuery = useQuery({
    queryKey: ["dashboard-work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const techniciansQuery = useQuery({
    queryKey: ["dashboard-technicians"],
    queryFn: getTechnicians,
  });

  const locationsQuery = useQuery({
    queryKey: ["dashboard-technician-locations"],
    queryFn: () => getTechnicianLocations({ latest: true }),
    refetchInterval: 20000,
    refetchOnWindowFocus: false,
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ["dashboard-service-requests"],
    queryFn: () => getServiceRequests({ status: "PENDING" }),
  });

  const usedMaterialsQuery = useQuery({
    queryKey: ["dashboard-used-materials"],
    queryFn: () => getUsedMaterials(),
  });

  const workOrders = workOrdersQuery.data ?? EMPTY_ITEMS;
  const technicians = techniciansQuery.data ?? EMPTY_ITEMS;
  const locations = locationsQuery.data ?? EMPTY_ITEMS;
  const serviceRequests = serviceRequestsQuery.data ?? EMPTY_ITEMS;
  const usedMaterials = usedMaterialsQuery.data ?? EMPTY_ITEMS;

  const refreshDashboard = useCallback(() => {
    void Promise.allSettled([
      workOrdersQuery.refetch(),
      techniciansQuery.refetch(),
      locationsQuery.refetch(),
      serviceRequestsQuery.refetch(),
      usedMaterialsQuery.refetch(),
    ]);
  }, [locationsQuery, serviceRequestsQuery, techniciansQuery, usedMaterialsQuery, workOrdersQuery]);

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
        .sort(sortFieldOrders)
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
          const primaryOrder = getPrimaryOrder(activeOrders);
          const lastLocation = latestLocations.get(technician.id) || null;
          const technicianCoordinates = normalizeCoordinates(
            lastLocation?.latitude,
            lastLocation?.longitude
          );
          const destination = normalizeCoordinates(
            primaryOrder?.customer_latitude,
            primaryOrder?.customer_longitude
          );
          const freshness = technicianCoordinates
            ? getLocationFreshness(lastLocation?.timestamp)
            : {
                state: "missing",
                label: "Sin GPS",
                color: "default",
                sortRank: 3,
              };
          const technicianLatitude = technicianCoordinates?.latitude ?? null;
          const technicianLongitude = technicianCoordinates?.longitude ?? null;

          const routeDistanceKm =
            technicianCoordinates && destination
              ? haversineKm(
                  {
                    lat: technicianCoordinates.latitude,
                    lon: technicianCoordinates.longitude,
                  },
                  { lat: destination.latitude, lon: destination.longitude }
                )
              : null;

          return {
            ...technician,
            activeOrders,
            primaryOrder,
            lastLocation,
            freshness,
            technicianCoordinates,
            technicianLatitude,
            technicianLongitude,
            destination,
            routeDistanceKm,
            etaMinutes:
              primaryOrder?.status === "IN_TRANSIT" && routeDistanceKm != null
                ? estimateEtaMinutes(routeDistanceKm)
                : null,
          };
        })
        .sort((left, right) => {
          const activeRouteDiff =
            Number(Boolean(right.primaryOrder)) - Number(Boolean(left.primaryOrder));
          if (activeRouteDiff !== 0) {
            return activeRouteDiff;
          }

          if (left.activeOrders.length !== right.activeOrders.length) {
            return right.activeOrders.length - left.activeOrders.length;
          }

          if (left.freshness.sortRank !== right.freshness.sortRank) {
            return left.freshness.sortRank - right.freshness.sortRank;
          }

          return String(left.name || "").localeCompare(String(right.name || ""));
        }),
    [latestLocations, openOrders, technicians]
  );

  const trackedTechnicians = useMemo(
    () => technicianBoard.filter((technician) => technician.technicianCoordinates),
    [technicianBoard]
  );

  const activeRoutes = useMemo(
    () => technicianBoard.filter((technician) => technician.primaryOrder),
    [technicianBoard]
  );

  const routesWithGps = activeRoutes.filter((route) => route.technicianCoordinates).length;
  const routesWithoutGps = activeRoutes.length - routesWithGps;
  const routesWithoutDestination = activeRoutes.filter((route) => !route.destination).length;
  const trackedCoverageRate = technicians.length
    ? Math.round((trackedTechnicians.length / technicians.length) * 100)
    : 0;
  const routeCoverageRate = activeRoutes.length
    ? Math.round((routesWithGps / activeRoutes.length) * 100)
    : trackedCoverageRate;
  const staleTrackedTechnicians = trackedTechnicians.filter(
    (technician) => technician.freshness.state === "stale"
  ).length;

  const pendingRequests = useMemo(
    () =>
      [...serviceRequests]
        .sort((left, right) => {
          const suspiciousDiff =
            Number(Boolean(right.is_suspicious)) - Number(Boolean(left.is_suspicious));
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
        .sort((left, right) =>
          String(left.material_name || "").localeCompare(String(right.material_name || ""))
        )
        .slice(0, 5),
    [usedMaterials]
  );

  const mapConnections = useMemo(
    () =>
      activeRoutes
        .filter(
          (route) =>
            route.technicianLatitude != null &&
            route.technicianLongitude != null &&
            route.destination
        )
        .map((route) => ({
          id: `route-line-${route.id}`,
          status: route.primaryOrder.status,
          from: [route.technicianLatitude, route.technicianLongitude],
          to: [route.destination.latitude, route.destination.longitude],
        })),
    [activeRoutes]
  );

  const mapPoints = useMemo(() => {
    const points = [];
    const seenTechnicians = new Set();

    activeRoutes.forEach((route) => {
      seenTechnicians.add(String(route.id));

      if (route.technicianLatitude != null && route.technicianLongitude != null) {
        points.push({
          id: `technician-${route.id}`,
          type: "technician",
          latitude: route.technicianLatitude,
          longitude: route.technicianLongitude,
          title: route.name,
          subtitle: route.primaryOrder
            ? `${STATUS_LABELS[route.primaryOrder.status] || route.primaryOrder.status} - ${route.primaryOrder.customer_name || "Servicio activo"}`
            : "Sin ruta activa",
          meta: [
            {
              label: "Destino",
              value: route.primaryOrder?.service_location_address || "Sin direccion",
            },
            {
              label: "Ultimo reporte",
              value: formatReportTime(route.lastLocation?.timestamp),
            },
            {
              label: "ETA",
              value:
                route.etaMinutes != null
                  ? `${route.etaMinutes} min`
                  : route.primaryOrder?.status === "IN_SERVICE"
                    ? "En sitio"
                    : route.routeDistanceKm != null
                      ? formatDistance(route.routeDistanceKm)
                      : "Pendiente",
            },
          ],
        });
      }

      if (route.destination) {
        points.push({
          id: `destination-${route.primaryOrder.id}`,
          type: "destination",
          latitude: route.destination.latitude,
          longitude: route.destination.longitude,
          title: route.primaryOrder.customer_name || "Destino del servicio",
          subtitle: route.primaryOrder.service_location_address || "Sin direccion registrada",
          meta: [
            {
              label: "Tecnico",
              value: route.name || "Sin tecnico",
            },
            {
              label: "Estado",
              value: STATUS_LABELS[route.primaryOrder.status] || route.primaryOrder.status,
            },
            {
              label: "Prioridad",
              value: PRIORITY_LABELS[route.primaryOrder.priority] || route.primaryOrder.priority,
            },
          ],
        });
      }
    });

    trackedTechnicians.forEach((technician) => {
      if (seenTechnicians.has(String(technician.id))) {
        return;
      }

      if (technician.technicianLatitude == null || technician.technicianLongitude == null) {
        return;
      }

      points.push({
        id: `idle-technician-${technician.id}`,
        type: "technician",
        latitude: technician.technicianLatitude,
        longitude: technician.technicianLongitude,
        title: technician.name,
        subtitle: "Sin ruta activa",
        meta: [
          {
            label: "Ultimo reporte",
            value: formatReportTime(technician.lastLocation?.timestamp),
          },
          {
            label: "Carga",
            value: String(technician.activeOrders.length),
          },
        ],
      });
    });

    return points;
  }, [activeRoutes, trackedTechnicians]);

  const fieldTechnicians = activeRoutes.length;

  const summaryStats = supervisorView
    ? [
        {
          label: "Por asignar",
          value: dispatchQueue.length,
          help: "ordenes sin tecnico",
        },
        {
          label: "Rutas activas",
          value: activeRoutes.length,
          help: "seguimiento visible",
        },
        {
          label: "Cobertura GPS",
          value: `${routeCoverageRate}%`,
          help: routesWithoutGps ? `${routesWithoutGps} sin reporte` : "equipo visible",
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
          help: "ordenes activas",
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
          label: "Cobertura GPS",
          value: `${routeCoverageRate}%`,
          help: staleTrackedTechnicians ? `${staleTrackedTechnicians} desactualizados` : "equipo reportando",
        },
      ];

  const searchConfig = useMemo(
    () => ({
      title: supervisorView ? "Filtros de supervision" : "Filtros operativos",
      description: "Ajusta clientes, direccion, tecnico o prioridad y refresca el tablero en vivo.",
      values: filters,
      fields: [
        {
          key: "customer",
          label: "Cliente",
          placeholder: "Nombre del cliente",
        },
        {
          key: "address",
          label: "Direccion",
          placeholder: "Zona o direccion del servicio",
        },
        {
          key: "technician",
          label: "Tecnico",
          placeholder: "Nombre del tecnico",
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
      onRefresh: refreshDashboard,
    }),
    [filters, refreshDashboard, supervisorView]
  );

  const dashboardErrors = [
    workOrdersQuery.isError ? "ordenes" : null,
    techniciansQuery.isError ? "tecnicos" : null,
    locationsQuery.isError ? "ubicaciones" : null,
    serviceRequestsQuery.isError ? "solicitudes" : null,
    usedMaterialsQuery.isError ? "materiales" : null,
  ].filter(Boolean);

  return (
    <PageLayout
      title={supervisorView ? "Centro de supervision" : "Control operativo"}
      searchConfig={searchConfig}
      topbarOptions={
        <Link to={supervisorView ? "/assignments" : "/work-orders"}>
          <Button
            type="primary"
            icon={supervisorView ? <PiUsersThreeBold size={16} /> : <PiPackageBold size={16} />}
          >
            {supervisorView ? "Asignaciones" : "Ordenes"}
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4">
        {dashboardErrors.length ? (
          <Alert
            showIcon
            type="warning"
            message="El tablero no pudo actualizar todos los modulos"
            description={`Se detectaron fallas al cargar: ${dashboardErrors.join(", ")}. Usa Actualizar para reintentar antes de la presentacion.`}
          />
        ) : null}

        <ModuleStatStrip
          badge={supervisorView ? "Supervisor" : "Operacion"}
          description={
            supervisorView
              ? "Despacho, seguimiento de rutas y revisiones clave en una sola vista."
              : "Ordenes abiertas, rutas activas y cobertura GPS listas para presentar."
          }
          stats={summaryStats}
        />

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.92fr)]">
          <div className="grid gap-4">
            <Card className="rounded-[28px]" loading={workOrdersQuery.isLoading}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Despacho inmediato
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Ordenes sin tecnico listas para mover a campo.
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
                {!dispatchQueue.length && !workOrdersQuery.isLoading ? (
                  <Empty description="No hay ordenes pendientes de asignacion." />
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
                          {order.service_location_address || "Sin direccion"}
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

            <Card className="rounded-[28px]" loading={workOrdersQuery.isLoading}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Seguimiento en campo
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Servicios activos priorizados por estado y urgencia.
                  </div>
                </div>
                <Tag color="purple">{fieldOrders.length} visibles</Tag>
              </div>

              <div className="grid gap-3">
                {!fieldOrders.length && !workOrdersQuery.isLoading ? (
                  <Empty description="No hay ordenes activas con los filtros actuales." />
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
                          {order.service_location_address || "Sin direccion"}
                        </div>
                        <div className="mt-2 text-sm ui-text-muted">
                          Tecnico: {order.technician_name || "Sin asignar"}
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
                    Mapa de rutas
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Tecnicos, destinos del servicio y trazos de seguimiento en una sola vista.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Tag color={routeCoverageRate > 70 ? "green" : routeCoverageRate > 0 ? "gold" : "default"}>
                    Cobertura GPS {routeCoverageRate}%
                  </Tag>
                  {routesWithoutGps ? <Tag color="red">{routesWithoutGps} sin GPS</Tag> : null}
                </div>
              </div>

              {mapPoints.length ? (
                <div className="overflow-hidden rounded-[24px] border border-[var(--ui-border)]">
                  <OperationsLiveMap
                    points={mapPoints}
                    connections={mapConnections}
                    className="h-[360px]"
                  />
                </div>
              ) : (
                <Empty
                  description={
                    activeRoutes.length
                      ? "Hay rutas activas, pero faltan coordenadas para mostrarlas en el mapa."
                      : "Todavia no hay rutas o posiciones disponibles para mostrar."
                  }
                />
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] ui-bg-soft px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] ui-text-muted">
                    Rutas activas
                  </div>
                  <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                    {activeRoutes.length}
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    {fieldTechnicians} tecnicos con trabajo en curso
                  </div>
                </div>
                <div className="rounded-[22px] ui-bg-soft px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] ui-text-muted">
                    Sin coordenadas
                  </div>
                  <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                    {routesWithoutDestination}
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    destinos por corregir antes de demo
                  </div>
                </div>
                <div className="rounded-[22px] ui-bg-soft px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] ui-text-muted">
                    Tecnicos reportando
                  </div>
                  <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                    {trackedTechnicians.length}
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    {staleTrackedTechnicians ? `${staleTrackedTechnicians} con reporte viejo` : "sin rezago visible"}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card className="rounded-[28px]" loading={techniciansQuery.isLoading}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Cuadrilla y cobertura
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Carga del tecnico, destino actual y frescura del ultimo reporte.
                  </div>
                </div>
                <Link to="/users">
                  <Button size="small">Ver tecnicos</Button>
                </Link>
              </div>

              <div className="grid gap-3">
                {!technicianBoard.length && !techniciansQuery.isLoading ? (
                  <Empty description="No hay tecnicos registrados." />
                ) : null}

                {technicianBoard.slice(0, 6).map((technician) => {
                  const loadColor =
                    technician.activeOrders.length > 1
                      ? "red"
                      : technician.activeOrders.length
                        ? "gold"
                        : "green";

                  const etaLabel =
                    technician.etaMinutes != null
                      ? `${technician.etaMinutes} min`
                      : technician.primaryOrder?.status === "IN_SERVICE"
                        ? "En sitio"
                        : technician.routeDistanceKm != null
                          ? formatDistance(technician.routeDistanceKm)
                          : "Pendiente";

                  return (
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
                        <div className="flex flex-wrap gap-2">
                          <Tag color={loadColor}>
                            {technician.activeOrders.length > 1
                              ? "Alta carga"
                              : technician.activeOrders.length
                                ? "En campo"
                                : "Libre"}
                          </Tag>
                          <Tag color={technician.freshness.color}>
                            {technician.freshness.label}
                          </Tag>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-1 text-sm ui-text-muted">
                        <span>Ordenes activas: {technician.activeOrders.length}</span>
                        <span>
                          Ruta actual:{" "}
                          {technician.primaryOrder?.service_location_address || "Sin ruta activa"}
                        </span>
                        <span>
                          Estado:{" "}
                          {technician.primaryOrder
                            ? STATUS_LABELS[technician.primaryOrder.status] || technician.primaryOrder.status
                            : "Disponible"}
                        </span>
                        <span>Avance: {etaLabel}</span>
                        <span>
                          Ultimo reporte: {formatReportTime(technician.lastLocation?.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="rounded-[28px]">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--ui-foreground)]">
                    Solicitudes por revisar
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    Pendientes de validar antes de convertirlas en orden.
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
                          {request.address || "Sin direccion"}
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
                    Consumos pendientes antes de cerrar la revision.
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
