import { useMemo, useState } from "react";
import { Card, Select, Tag, Button } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import PageLayout from "@layouts/page-layout/PageLayout";
import { getWorkOrders, assignWorkOrder } from "@api/workOrderService";
import { getTechnicians } from "@api/userService";
import { getTechnicianLocations } from "@api/trackingService";
import { useMessage } from "@context/MessageProvider";
import queryClient from "@lib/queryClient";

const STATUS_LABELS = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignada",
  IN_TRANSIT: "En ruta",
  IN_SERVICE: "En sitio",
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

const normalizePoints = (points) => {
  if (points.length === 0) {
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
  const { success, error } = useMessage();
  const [filters, setFilters] = useState({
    zone: "",
    priority: null,
    techStatus: null,
  });

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
    return Array.from(map.values());
  }, [locations]);

  const { mutate: assignMutate, isPending: assigning } = useMutation({
    mutationFn: ({ orderId, technicianId }) =>
      assignWorkOrder(orderId, technicianId),
    onSuccess: () => {
      success("Orden asignada correctamente");
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
    onError: () => {
      error("No se pudo asignar la orden");
    },
  });

  const filteredOrders = useMemo(() => {
    return workOrders.filter((order) => {
      if (filters.priority && order.priority !== filters.priority) {
        return false;
      }
      if (
        filters.zone &&
        !order.service_location_address?.toLowerCase().includes(filters.zone.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [workOrders, filters]);

  const kanban = useMemo(() => {
    const columns = {
      PENDING: [],
      ASSIGNED: [],
      IN_TRANSIT: [],
      IN_SERVICE: [],
    };
    filteredOrders.forEach((order) => {
      if (columns[order.status]) {
        columns[order.status].push(order);
      }
    });
    return columns;
  }, [filteredOrders]);

  const pendingOrders = filteredOrders.filter((order) => order.status === "PENDING");

  const mapPoints = useMemo(() => {
    const points = [];
    latestLocations.forEach((location) => {
      if (location.latitude && location.longitude) {
        points.push({
          id: `tech-${location.technician}`,
          lat: Number(location.latitude),
          lon: Number(location.longitude),
          type: "tech",
          label: location.technician_name,
        });
      }
    });
    filteredOrders.forEach((order) => {
      if (order.customer_latitude && order.customer_longitude) {
        points.push({
          id: `order-${order.id}`,
          lat: Number(order.customer_latitude),
          lon: Number(order.customer_longitude),
          type: "order",
          label: order.customer_name,
        });
      }
    });
    return normalizePoints(points);
  }, [latestLocations, filteredOrders]);

  const handleDrop = (event, technicianId) => {
    event.preventDefault();
    const orderId = event.dataTransfer.getData("text/plain");
    if (orderId && technicianId) {
      assignMutate({ orderId, technicianId });
    }
  };

  return (
    <PageLayout title="Dashboard operativo">
      <div className="grid gap-6">
        <Card className="rounded-2xl">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="text-sm font-semibold">Filtros</div>
            <InputFilter
              value={filters.zone}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, zone: value }))
              }
              placeholder="Zona o dirección"
            />
            <Select
              allowClear
              placeholder="Urgencia"
              options={PRIORITY_OPTIONS}
              className="min-w-[160px]"
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, priority: value }))
              }
            />
            <Select
              allowClear
              placeholder="Estado técnico"
              options={[
                { value: "available", label: "Disponible" },
                { value: "busy", label: "En servicio" },
              ]}
              className="min-w-[170px]"
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, techStatus: value }))
              }
            />
          </div>
        </Card>

        <div className="grid xl:grid-cols-[1.3fr_1fr] gap-6">
          <Card className="rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Mapa en vivo</div>
              <span className="text-xs ui-text-muted">
                Actualiza cada 20s
              </span>
            </div>
            <div className="dashboard-map h-[360px] rounded-2xl">
              {mapPoints.map((point) => (
                <span
                  key={point.id}
                  className={`absolute w-3 h-3 rounded-full ${
                    point.type === "tech"
                      ? "dashboard-map-marker-tech"
                      : "dashboard-map-marker-order"
                  }`}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                />
              ))}
              {mapPoints.length === 0 && (
                <div className="absolute inset-0 grid place-items-center text-sm ui-text-soft">
                  Sin coordenadas activas
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl">
            <div className="font-semibold mb-4">Asignación drag & drop</div>
            <div className="grid gap-3">
              {pendingOrders.length === 0 && (
                <span className="text-sm ui-text-muted">
                  No hay incidentes pendientes
                </span>
              )}
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-dashed ui-border-subtle rounded-xl p-3 ui-bg-surface cursor-grab"
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData("text/plain", order.id)
                  }>
                  <div className="text-sm font-semibold">
                    {order.customer_name}
                  </div>
                  <div className="text-xs ui-text-muted">
                    {order.service_location_address || "Sin dirección"}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              {technicians
                .filter((tech) => {
                  if (!filters.techStatus) return true;
                  const hasActive = filteredOrders.some(
                    (order) =>
                      order.technician === tech.id &&
                      ["ASSIGNED", "IN_TRANSIT", "IN_SERVICE"].includes(order.status)
                  );
                  return filters.techStatus === "busy" ? hasActive : !hasActive;
                })
                .map((tech) => {
                  const hasActive = filteredOrders.some(
                    (order) =>
                      order.technician === tech.id &&
                      ["ASSIGNED", "IN_TRANSIT", "IN_SERVICE"].includes(order.status)
                  );
                  return (
                    <div
                      key={tech.id}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDrop(event, tech.id)}
                      className="rounded-xl border ui-border-subtle p-3 ui-bg-elevated">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">{tech.name}</div>
                          <div className="text-xs ui-text-muted">{tech.email}</div>
                        </div>
                        <Tag color={hasActive ? "gold" : "green"}>
                          {hasActive ? "En servicio" : "Disponible"}
                        </Tag>
                      </div>
                    </div>
                  );
                })}
            </div>
            {assigning && (
              <div className="text-xs ui-text-muted mt-3">
                Asignando orden...
              </div>
            )}
          </Card>
        </div>

        <Card className="rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Cockpit operativo</div>
            <Button
              type="primary"
              size="small"
              loading={loadingOrders}
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["work-orders"] })
              }>
              Refrescar
            </Button>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {Object.entries(kanban).map(([status, items]) => (
              <div key={status} className="ui-bg-soft rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">
                    {STATUS_LABELS[status]}
                  </span>
                  <Tag color={STATUS_COLORS[status]}>{items.length}</Tag>
                </div>
                <div className="grid gap-2">
                  {items.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg ui-bg-surface border ui-border-subtle p-2">
                      <div className="text-sm font-semibold">
                        {order.customer_name}
                      </div>
                      <div className="text-xs ui-text-muted">
                        {order.service_location_address || "Sin dirección"}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <span className="text-xs ui-text-faint">
                      Sin incidencias
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

const InputFilter = ({ value, onChange, placeholder }) => (
  <input
    className="min-w-[220px] rounded-lg border ui-border-subtle px-3 py-2 text-sm ui-bg-surface"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
  />
);

export default Dashboard;
