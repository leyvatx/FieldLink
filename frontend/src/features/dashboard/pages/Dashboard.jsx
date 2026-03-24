import { useMemo, useState } from "react";
import { Button, Card, Empty, Tag } from "@/lib/antd-compat";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  PiArrowDownBold,
  PiCheckCircleBold,
  PiClockCountdownBold,
  PiMapPinBold,
  PiPackageBold,
  PiUsersThreeBold,
} from "react-icons/pi";
import PageLayout from "@layouts/page-layout/PageLayout";
import AppLogo from "@components/AppLogo";
import { useAuth } from "@context/AuthProvider";
import { getWorkOrders } from "@api/workOrderService";
import { getTechnicians } from "@api/userService";
import { getTechnicianLocations } from "@api/trackingService";
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

const PRIORITY_RANK = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function formatReportTime(value) {
  if (!value) {
    return "Sin reporte";
  }

  return dayjs(value).format("DD/MM HH:mm");
}

const Dashboard = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    customer: "",
    address: "",
    technician: "",
    priority: null,
  });
  const supervisorView = isSupervisor(user);

  const { data: workOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const { data: technicians = [], isLoading: loadingTechnicians } = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["technician-locations"],
    queryFn: () => getTechnicianLocations(),
    refetchInterval: 20000,
    refetchOnWindowFocus: false,
  });

  const latestLocations = useMemo(() => {
    const map = new Map();

    locations.forEach((location) => {
      if (!map.has(location.technician)) {
        map.set(location.technician, location);
      }
    });

    return map;
  }, [locations]);

  const filteredOrders = useMemo(() => {
    return workOrders.filter((order) => {
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
    });
  }, [filters, workOrders]);

  const openOrders = useMemo(
    () => filteredOrders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status)),
    [filteredOrders]
  );

  const attentionOrders = useMemo(
    () =>
      [...openOrders]
        .sort((left, right) => {
          const statusWeight = (status) =>
            status === "PENDING" ? 3 : status === "IN_SERVICE" ? 2 : status === "IN_TRANSIT" ? 1 : 0;
          const statusDiff = statusWeight(right.status) - statusWeight(left.status);
          if (statusDiff !== 0) {
            return statusDiff;
          }

          const priorityDiff =
            (PRIORITY_RANK[right.priority] || 0) - (PRIORITY_RANK[left.priority] || 0);
          if (priorityDiff !== 0) {
            return priorityDiff;
          }

          return (left.customer_name || "").localeCompare(right.customer_name || "");
        })
        .slice(0, 8),
    [openOrders]
  );

  const technicianBoard = useMemo(
    () =>
      technicians
        .map((technician) => {
          const activeOrders = openOrders.filter(
            (order) =>
              order.technician === technician.id &&
              ["ASSIGNED", "IN_TRANSIT", "IN_SERVICE"].includes(order.status)
          );

          return {
            ...technician,
            activeOrders,
            availability: activeOrders.length ? "Ocupado" : "Disponible",
            latestLocation: latestLocations.get(technician.id) || null,
          };
        })
        .sort((left, right) => {
          const loadDiff = right.activeOrders.length - left.activeOrders.length;
          if (loadDiff !== 0) {
            return loadDiff;
          }

          return (left.name || "").localeCompare(right.name || "");
        }),
    [latestLocations, openOrders, technicians]
  );

  const mapPoints = useMemo(
    () =>
      technicianBoard
        .map((technician) => {
          const locationPoint =
            technician.latestLocation?.latitude != null &&
            technician.latestLocation?.longitude != null
              ? {
                  id: `technician-${technician.id}`,
                  type: "technician",
                  latitude: Number(technician.latestLocation.latitude),
                  longitude: Number(technician.latestLocation.longitude),
                  title: technician.name,
                  subtitle:
                    technician.activeOrders[0]?.service_location_address || "Sin orden activa",
                  meta: [
                    {
                      label: "Estado",
                      value:
                        technician.activeOrders[0]?.status
                          ? STATUS_LABELS[technician.activeOrders[0].status]
                          : technician.availability,
                    },
                    {
                      label: "Ordenes",
                      value: String(technician.activeOrders.length),
                    },
                    {
                      label: "Ultimo reporte",
                      value: formatReportTime(technician.latestLocation.timestamp),
                    },
                  ],
                }
              : null;

          if (locationPoint) {
            return locationPoint;
          }

          const fallbackOrder = technician.activeOrders.find(
            (order) =>
              order.customer_latitude != null && order.customer_longitude != null
          );

          if (!fallbackOrder) {
            return null;
          }

          return {
            id: `assignment-${technician.id}-${fallbackOrder.id}`,
            type: "assignment",
            latitude: Number(fallbackOrder.customer_latitude),
            longitude: Number(fallbackOrder.customer_longitude),
            title: technician.name,
            subtitle: fallbackOrder.service_location_address || "Ubicación estimada",
            meta: [
              {
                label: "Estado",
                value: STATUS_LABELS[fallbackOrder.status] || fallbackOrder.status,
              },
              {
                label: "Orden",
                value: fallbackOrder.customer_name || "Sin cliente",
              },
              {
                label: "Reporte",
                value: "Sin GPS en vivo",
              },
            ],
          };
        })
        .filter(Boolean),
    [technicianBoard]
  );

  const trackedTechnicians = useMemo(
    () =>
      technicianBoard.filter(
        (technician) =>
          technician.latestLocation ||
          technician.activeOrders.some(
            (order) =>
              order.customer_latitude != null && order.customer_longitude != null
          )
      ),
    [technicianBoard]
  );

  const metrics = useMemo(
    () => ({
      openOrders: openOrders.length,
      pendingDispatch: openOrders.filter((order) => !order.technician).length,
      inTransit: openOrders.filter((order) => order.status === "IN_TRANSIT").length,
      inService: openOrders.filter((order) => order.status === "IN_SERVICE").length,
      tracked: trackedTechnicians.length,
    }),
    [openOrders, trackedTechnicians]
  );

  const coverageRate = technicians.length
    ? Math.round((trackedTechnicians.length / technicians.length) * 100)
    : 0;

  const priorityHotspots = attentionOrders.slice(0, 3);
  const lastSnapshot = dayjs().format("HH:mm");

  const dashboardMetrics = useMemo(
    () => [
      {
        key: "open",
        label: "Ordenes abiertas",
        value: metrics.openOrders,
        icon: PiPackageBold,
        tone: "from-[#E879F9]/16 via-[#8B5CF6]/10 to-transparent",
      },
      {
        key: "pending",
        label: "Pendientes de asignar",
        value: metrics.pendingDispatch,
        icon: PiClockCountdownBold,
        tone: "from-[#F59E0B]/16 via-[#8B5CF6]/8 to-transparent",
      },
      {
        key: "transit",
        label: "En ruta",
        value: metrics.inTransit,
        icon: PiMapPinBold,
        tone: "from-[#60A5FA]/16 via-[#8B5CF6]/8 to-transparent",
      },
      {
        key: "service",
        label: "En servicio",
        value: metrics.inService,
        icon: PiCheckCircleBold,
        tone: "from-[#34D399]/16 via-[#8B5CF6]/8 to-transparent",
      },
      {
        key: "tracked",
        label: "Tecnicos ubicados",
        value: metrics.tracked,
        icon: PiUsersThreeBold,
        tone: "from-[#A78BFA]/18 via-[#7C3AED]/10 to-transparent",
      },
    ],
    [metrics]
  );

  const searchConfig = useMemo(
    () => ({
      title: supervisorView ? "Filtros de supervision" : "Filtros operativos",
      description:
        "Filtra por cliente, direccion, tecnico o prioridad sin mezclar todo en una sola busqueda.",
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
          options: [
            { value: "LOW", label: "Baja" },
            { value: "MEDIUM", label: "Media" },
            { value: "HIGH", label: "Alta" },
            { value: "URGENT", label: "Urgente" },
          ],
        },
      ],
      onChange: (nextFilters) => setFilters((previous) => ({ ...previous, ...nextFilters })),
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
      title={supervisorView ? "Centro de supervision" : "Control operativo"}
      searchConfig={searchConfig}
      topbarOptions={
        supervisorView ? (
          <Link to="/work-orders">
            <Button type="primary" icon={<PiPackageBold size={16} />}>
              Gestionar ordenes
            </Button>
          </Link>
        ) : (
          <Link to="/users">
            <Button type="primary" icon={<PiUsersThreeBold size={16} />}>
              Ver equipo
            </Button>
          </Link>
        )
      }
    >
      <div className="grid gap-6">
        <Card className="relative overflow-hidden rounded-[36px] border-[color:color-mix(in_srgb,var(--ui-highlight)_26%,var(--ui-border))] bg-[linear-gradient(140deg,color-mix(in_srgb,var(--ui-card)_72%,transparent),color-mix(in_srgb,var(--ui-highlight)_12%,var(--ui-card)))]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--ui-highlight)_20%,transparent),transparent_36%)]" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[color:color-mix(in_srgb,var(--ui-highlight)_14%,transparent)] blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-full bg-[linear-gradient(120deg,transparent_0%,transparent_52%,rgba(255,255,255,0.05)_100%)]" />

          <div className="relative grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="grid gap-6">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[color:color-mix(in_srgb,var(--ui-highlight)_24%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-card)_82%,transparent)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ui-muted-foreground)] shadow-[var(--ui-shadow-soft)]">
                <AppLogo compact showWordmark={false} iconSize={28} />
                Operacion
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  {supervisorView ? "Vista de supervision" : "Vista operativa"}
                </div>
                <h2 className="mt-3 max-w-4xl text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-[var(--ui-foreground)]">
                  Operacion en tiempo real
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ui-muted-foreground)] md:text-base">
                  Ordenes abiertas, cobertura GPS y carga del equipo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Tag color="purple">Cobertura GPS {coverageRate}%</Tag>
                <Tag color={metrics.pendingDispatch ? "gold" : "green"}>
                  {metrics.pendingDispatch ? "Pendientes por asignar" : "Despacho al corriente"}
                </Tag>
                <Tag color={priorityHotspots.length ? "red" : "blue"}>
                  {priorityHotspots.length ? `${priorityHotspots.length} focos inmediatos` : "Sin focos críticos"}
                </Tag>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[26px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                    Radar activo
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-[var(--ui-foreground)]">
                    {metrics.openOrders}
                  </div>
                  <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                    órdenes vivas en el tablero
                  </div>
                </div>

                <div className="rounded-[26px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_90%,transparent)] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                    Snapshot
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-[var(--ui-foreground)]">
                    {lastSnapshot}
                  </div>
                  <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                    lectura local del panel
                  </div>
                </div>

                <div className="rounded-[26px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_90%,transparent)] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                    Cobertura
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-[var(--ui-foreground)]">
                    {coverageRate}%
                  </div>
                  <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                    del equipo con visibilidad
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[30px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-highlight)_10%,var(--ui-card)),color-mix(in_srgb,var(--ui-card)_96%,transparent))] p-5 shadow-[var(--ui-shadow-soft)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  Salud de despacho
                </div>
                <div className="mt-3 text-2xl font-semibold text-[var(--ui-foreground)]">
                  {coverageRate > 70 ? "Cobertura alta" : coverageRate > 40 ? "Cobertura media" : "Cobertura limitada"}
                </div>
                <div className="mt-2 text-sm text-[var(--ui-muted-foreground)]">
                  {metrics.pendingDispatch} pendientes sin técnico y {metrics.inTransit} servicios viajando ahora mismo.
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--ui-secondary)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#E879F9_0%,#8B5CF6_55%,#5B21B6_100%)]"
                    style={{ width: `${coverageRate}%` }}
                  />
                </div>
              </div>

              <div className="rounded-[30px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-5 shadow-[var(--ui-shadow-soft)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                      Hotspots
                    </div>
                    <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                      Lo más urgente del momento
                    </div>
                  </div>
                  <span className="rounded-full border border-[var(--ui-border)] px-3 py-1 text-xs text-[var(--ui-muted-foreground)]">
                    {priorityHotspots.length || 0} activos
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {!priorityHotspots.length && !loadingOrders ? (
                    <Empty description="Sin focos de atención inmediatos." />
                  ) : null}
                  {priorityHotspots.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_90%,transparent)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--ui-foreground)]">
                            {order.customer_name}
                          </div>
                          <div className="mt-1 text-xs text-[var(--ui-muted-foreground)]">
                            {order.service_location_address || "Sin dirección"}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Tag color={STATUS_COLORS[order.status] || "default"}>
                            {STATUS_LABELS[order.status] || order.status}
                          </Tag>
                          <Tag color={order.priority === "URGENT" ? "red" : "purple"}>
                            {order.priority}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {dashboardMetrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <Card
                key={metric.key}
                className={`overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_right,transparent_0%,transparent_34%),linear-gradient(160deg,color-mix(in_srgb,var(--ui-card)_94%,transparent),transparent)]`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${metric.tone}`} />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-[var(--ui-muted-foreground)]">{metric.label}</div>
                    <div className="mt-3 text-3xl font-semibold text-[var(--ui-foreground)]">
                      {metric.value}
                    </div>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-card)_86%,transparent)] text-[var(--ui-highlight)]">
                    <Icon size={22} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="grid gap-6">
            <Card className="rounded-[32px]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                    Visibilidad territorial
                  </div>
                  <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                    Mapa operativo en vivo
                  </div>
                  <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                    Posición real de técnicos y ubicación estimada cuando todavía no reportan GPS.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Tag color="blue">GPS en vivo</Tag>
                  <Tag color="gold">Ubicación estimada</Tag>
                </div>
              </div>

              {mapPoints.length ? (
                <div className="overflow-hidden rounded-[28px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_16%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)]">
                  <OperationsLiveMap points={mapPoints} className="h-[300px] lg:h-[360px]" />
                </div>
              ) : (
                <Empty description="Todavía no hay posiciones o coordenadas disponibles para mostrar en el mapa." />
              )}
            </Card>

            <Card className="rounded-[32px]">
              <div className="mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  Bandeja priorizada
                </div>
                <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                  Órdenes que requieren atención
                </div>
                <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                  Pendientes, urgencias y servicios abiertos con mayor presión operativa.
                </div>
              </div>

              <div className="grid gap-3">
                {!attentionOrders.length && !loadingOrders ? (
                  <Empty description="No hay órdenes abiertas con los filtros actuales." />
                ) : null}
                {attentionOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-[26px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-4 shadow-[var(--ui-shadow-soft)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ui-foreground)]">
                          {order.customer_name}
                        </div>
                        <div className="mt-1 text-xs text-[var(--ui-muted-foreground)]">
                          {order.service_location_address || "Sin dirección"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Tag color={STATUS_COLORS[order.status] || "default"}>
                          {STATUS_LABELS[order.status] || order.status}
                        </Tag>
                        <Tag color={order.priority === "URGENT" ? "red" : "purple"}>
                          {order.priority}
                        </Tag>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--ui-muted-foreground)]">
                      <span>Técnico: {order.technician_name || "Sin asignar"}</span>
                      <span>Teléfono: {order.customer_phone || "Sin dato"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className="rounded-[32px]">
              <div className="mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  Rastreo visible
                </div>
                <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                  Técnicos con señal o referencia
                </div>
                <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                  Un resumen legible de quién está visible, ocupado y con qué contexto.
                </div>
              </div>

              <div className="grid gap-3">
                {!trackedTechnicians.length && !loadingTechnicians ? (
                  <Empty description="Sin técnicos con posición disponible." />
                ) : null}
                {trackedTechnicians.map((technician) => (
                  <div
                    key={technician.id}
                    className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ui-foreground)]">
                          {technician.name}
                        </div>
                        <div className="mt-1 text-xs text-[var(--ui-muted-foreground)]">
                          {technician.activeOrders[0]?.service_location_address || "Sin orden activa"}
                        </div>
                      </div>
                      <Tag color={technician.activeOrders.length ? "gold" : "green"}>
                        {technician.activeOrders.length ? "Ocupado" : "Disponible"}
                      </Tag>
                    </div>
                    <div className="mt-3 grid gap-1 text-sm text-[var(--ui-muted-foreground)]">
                      <span>Ordenes activas: {technician.activeOrders.length}</span>
                      <span>Último reporte: {formatReportTime(technician.latestLocation?.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[32px]">
              <div className="mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  Balance de equipo
                </div>
                <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                  Carga por técnico
                </div>
                <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                  Quién está libre, quién está saturado y dónde conviene enfocar seguimiento.
                </div>
              </div>

              <div className="grid gap-3">
                {!technicianBoard.length && !loadingTechnicians ? (
                  <Empty description="Sin técnicos registrados." />
                ) : null}
                {technicianBoard.map((technician) => (
                  <div
                    key={technician.id}
                    className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ui-foreground)]">
                          {technician.name}
                        </div>
                        <div className="mt-1 text-xs text-[var(--ui-muted-foreground)]">
                          {technician.email}
                        </div>
                      </div>
                      <Tag color={technician.activeOrders.length > 1 ? "red" : technician.activeOrders.length ? "gold" : "green"}>
                        {technician.activeOrders.length > 1
                          ? "Alta carga"
                          : technician.activeOrders.length
                            ? "En campo"
                            : "Libre"}
                      </Tag>
                    </div>
                    <div className="mt-3 grid gap-1 text-sm text-[var(--ui-muted-foreground)]">
                      <span>Ordenes activas: {technician.activeOrders.length}</span>
                      <span>Visibilidad: {technician.latestLocation ? "GPS en vivo" : "Sin GPS en vivo"}</span>
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
