import { useMemo, useState } from "react";
import { Button, Card, Empty, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import PageLayout from "@layouts/page-layout/PageLayout";
import { useAuth } from "@context/AuthProvider";
import { getWorkOrders } from "@api/workOrderService";
import { getTechnicians } from "@api/userService";
import { getTechnicianLocations } from "@api/trackingService";
import queryClient from "@lib/queryClient";

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

const normalizePoints = (points) => {
  if (!points.length) {
    return [];
  }

  const lats = points.map((point) => point.lat);
  const lons = points.map((point) => point.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latRange = maxLat - minLat || 1;
  const lonRange = maxLon - minLon || 1;

  return points.map((point) => ({
    ...point,
    x: ((point.lon - minLon) / lonRange) * 100,
    y: 100 - ((point.lat - minLat) / latRange) * 100,
  }));
};

const Dashboard = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    priority: null,
  });
  const isDispatcher = user?.role === "DISPATCHER";

  const { data: workOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const { data: technicians = [] } = useQuery({
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

      const search = filters.search.trim().toLowerCase();
      if (!search) {
        return true;
      }

      return [
        order.customer_name,
        order.service_location_address,
        order.customer_phone,
        order.technician_name,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [filters, workOrders]);

  const openOrders = useMemo(
    () => filteredOrders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status)),
    [filteredOrders]
  );

  const urgentOrders = useMemo(
    () =>
      [...openOrders]
        .sort((left, right) => {
          const priorityDiff = PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority];
          if (priorityDiff !== 0) {
            return priorityDiff;
          }
          return left.customer_name.localeCompare(right.customer_name);
        })
        .slice(0, 6),
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
        .sort((left, right) => left.activeOrders.length - right.activeOrders.length),
    [latestLocations, openOrders, technicians]
  );

  const mapPoints = useMemo(() => {
    const points = [];

    technicianBoard.forEach((technician) => {
      if (
        technician.latestLocation?.latitude &&
        technician.latestLocation?.longitude
      ) {
        points.push({
          id: `tech-${technician.id}`,
          lat: Number(technician.latestLocation.latitude),
          lon: Number(technician.latestLocation.longitude),
          type: "tech",
        });
      }
    });

    urgentOrders.slice(0, 3).forEach((order) => {
      if (order.customer_latitude && order.customer_longitude) {
        points.push({
          id: `order-${order.id}`,
          lat: Number(order.customer_latitude),
          lon: Number(order.customer_longitude),
          type: "order",
        });
      }
    });

    return normalizePoints(points);
  }, [technicianBoard, urgentOrders]);

  const metrics = useMemo(
    () => ({
      pending: openOrders.filter((order) => order.status === "PENDING").length,
      inTransit: openOrders.filter((order) => order.status === "IN_TRANSIT").length,
      inService: openOrders.filter((order) => order.status === "IN_SERVICE").length,
      availableTechnicians: technicianBoard.filter(
        (technician) => technician.availability === "Disponible"
      ).length,
    }),
    [openOrders, technicianBoard]
  );

  const searchConfig = useMemo(
    () => ({
      title: "Buscar y filtrar tablero",
      values: filters,
      fields: [
        {
          key: "search",
          label: "Buscar",
          placeholder: "Cliente, dirección, teléfono o técnico",
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
      onChange: (nextFilters) => setFilters((prev) => ({ ...prev, ...nextFilters })),
      onReset: () =>
        setFilters({
          search: "",
          priority: null,
        }),
      onRefresh: () => {
        queryClient.invalidateQueries({ queryKey: ["work-orders"] });
        queryClient.invalidateQueries({ queryKey: ["technician-locations"] });
      },
    }),
    [filters]
  );

  return (
    <PageLayout
      title={isDispatcher ? "Centro de despacho" : "Resumen operativo"}
      searchConfig={searchConfig}
      topbarOptions={
        isDispatcher ? (
          <Link to="/work-orders">
            <Button type="primary">Gestionar órdenes</Button>
          </Link>
        ) : (
          <Link to="/users">
            <Button type="primary">Ver equipo</Button>
          </Link>
        )
      }
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">Pendientes</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.pending}</div>
          </Card>
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">En ruta</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.inTransit}</div>
          </Card>
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">En servicio</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.inService}</div>
          </Card>
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">Técnicos libres</div>
            <div className="mt-2 text-3xl font-semibold">
              {metrics.availableTechnicians}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Mapa general</div>
                <div className="text-xs ui-text-muted">
                  Técnicos y órdenes críticas con actualización cada 20 segundos.
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Tag color="blue">Técnicos</Tag>
                <Tag color="gold">Órdenes críticas</Tag>
              </div>
            </div>
            <div className="dashboard-map h-[360px] rounded-2xl">
              {mapPoints.map((point) => (
                <span
                  key={point.id}
                  className={`absolute h-3 w-3 rounded-full ${
                    point.type === "tech"
                      ? "dashboard-map-marker-tech"
                      : "dashboard-map-marker-order"
                  }`}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                />
              ))}
              {!mapPoints.length && (
                <div className="absolute inset-0 grid place-items-center text-sm ui-text-soft">
                  Sin coordenadas activas para mostrar
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl">
            <div className="mb-4 font-semibold">Órdenes que requieren atención</div>
            <div className="grid gap-3">
              {!urgentOrders.length && !loadingOrders && (
                <Empty description="Sin órdenes abiertas" />
              )}
              {urgentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border ui-border-subtle ui-bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
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
                    <span>Técnico: {order.technician_name || "Sin asignar"}</span>
                    <span>Teléfono: {order.customer_phone || "Sin dato"}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Estado de cuadrillas</div>
              <div className="text-xs ui-text-muted">
                Vista resumida de disponibilidad y carga por técnico.
              </div>
            </div>
            <Button
              loading={loadingOrders}
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["work-orders"] });
                queryClient.invalidateQueries({ queryKey: ["technician-locations"] });
              }}
            >
              Refrescar
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {technicianBoard.map((technician) => (
              <div
                key={technician.id}
                className="rounded-2xl border ui-border-subtle ui-bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{technician.name}</div>
                    <div className="text-xs ui-text-muted">{technician.email}</div>
                  </div>
                  <Tag color={technician.availability === "Disponible" ? "green" : "gold"}>
                    {technician.availability}
                  </Tag>
                </div>
                <div className="mt-4 grid gap-2 text-sm ui-text-muted">
                  <span>Órdenes activas: {technician.activeOrders.length}</span>
                  <span>
                    Último reporte: {technician.latestLocation ? "Con ubicación" : "Sin ubicación"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
