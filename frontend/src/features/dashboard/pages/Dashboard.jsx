import { useMemo, useState } from "react";
import { Button, Card, Empty, Tag } from "@/lib/antd-compat";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import PageLayout from "@layouts/page-layout/PageLayout";
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
            subtitle: fallbackOrder.service_location_address || "Ubicacion estimada",
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
            <Button type="primary">Gestionar ordenes</Button>
          </Link>
        ) : (
          <Link to="/users">
            <Button type="primary">Ver equipo</Button>
          </Link>
        )
      }
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="rounded-[28px]">
            <div className="text-sm ui-text-muted">Ordenes abiertas</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.openOrders}</div>
          </Card>
          <Card className="rounded-[28px]">
            <div className="text-sm ui-text-muted">Pendientes de asignar</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.pendingDispatch}</div>
          </Card>
          <Card className="rounded-[28px]">
            <div className="text-sm ui-text-muted">En ruta</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.inTransit}</div>
          </Card>
          <Card className="rounded-[28px]">
            <div className="text-sm ui-text-muted">En servicio</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.inService}</div>
          </Card>
          <Card className="rounded-[28px]">
            <div className="text-sm ui-text-muted">Tecnicos ubicados</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.tracked}</div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)] xl:items-start">
          <Card className="self-start rounded-[28px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Mapa operativo en vivo</div>
                <div className="text-xs ui-text-muted">
                  Posicion real de tecnicos y ubicacion estimada cuando aun no han reportado GPS.
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Tag color="blue">GPS en vivo</Tag>
                <Tag color="gold">Ubicacion estimada</Tag>
              </div>
            </div>
            {mapPoints.length ? (
              <div className="overflow-hidden rounded-[24px] border border-[var(--ui-border)]">
                <OperationsLiveMap points={mapPoints} className="h-[240px] lg:h-[270px]" />
              </div>
            ) : (
              <Empty description="Todavia no hay posiciones o coordenadas disponibles para mostrar en el mapa." />
            )}
          </Card>

          <Card className="self-start rounded-[28px]">
            <div className="mb-4">
              <div className="font-semibold">Rastreo del equipo</div>
              <div className="text-xs ui-text-muted">
                Tecnicos visibles en mapa con su ultimo reporte y carga actual.
              </div>
            </div>
            <div className="grid gap-3">
              {!trackedTechnicians.length && !loadingTechnicians ? (
                <Empty description="Sin tecnicos con posicion disponible." />
              ) : null}
              {trackedTechnicians.map((technician) => (
                <div
                  key={technician.id}
                  className="rounded-2xl border ui-border-subtle ui-bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{technician.name}</div>
                      <div className="text-xs ui-text-muted">
                        {technician.activeOrders[0]?.service_location_address || "Sin orden activa"}
                      </div>
                    </div>
                    <Tag color={technician.activeOrders.length ? "gold" : "green"}>
                      {technician.activeOrders.length ? "Ocupado" : "Disponible"}
                    </Tag>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm ui-text-muted">
                    <span>Ordenes activas: {technician.activeOrders.length}</span>
                    <span>
                      Ultimo reporte: {formatReportTime(technician.latestLocation?.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="rounded-[28px]">
            <div className="mb-4">
              <div className="font-semibold">Ordenes que requieren atencion</div>
              <div className="text-xs ui-text-muted">
                Prioriza pendientes, urgencias y servicios abiertos del dia.
              </div>
            </div>
            <div className="grid gap-3">
              {!attentionOrders.length && !loadingOrders ? (
                <Empty description="No hay ordenes abiertas con los filtros actuales." />
              ) : null}
              {attentionOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border ui-border-subtle ui-bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{order.customer_name}</div>
                      <div className="text-xs ui-text-muted">
                        {order.service_location_address || "Sin direccion"}
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
                    <span>Tecnico: {order.technician_name || "Sin asignar"}</span>
                    <span>Telefono: {order.customer_phone || "Sin dato"}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[28px]">
            <div className="mb-4">
              <div className="font-semibold">Carga por tecnico</div>
              <div className="text-xs ui-text-muted">
                Quien esta libre, quien esta saturado y quien necesita seguimiento.
              </div>
            </div>
            <div className="grid gap-3">
              {!technicianBoard.length && !loadingTechnicians ? (
                <Empty description="Sin tecnicos registrados." />
              ) : null}
              {technicianBoard.map((technician) => (
                <div
                  key={technician.id}
                  className="rounded-2xl border ui-border-subtle ui-bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{technician.name}</div>
                      <div className="text-xs ui-text-muted">{technician.email}</div>
                    </div>
                    <Tag color={technician.activeOrders.length > 1 ? "red" : technician.activeOrders.length ? "gold" : "green"}>
                      {technician.activeOrders.length > 1
                        ? "Alta carga"
                        : technician.activeOrders.length
                          ? "En campo"
                          : "Libre"}
                    </Tag>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm ui-text-muted">
                    <span>Ordenes activas: {technician.activeOrders.length}</span>
                    <span>
                      Visibilidad: {technician.latestLocation ? "GPS en vivo" : "Sin GPS en vivo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
