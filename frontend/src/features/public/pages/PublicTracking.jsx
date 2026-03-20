import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, Spin, Tag } from "@/lib/antd-compat";
import { useQuery } from "@tanstack/react-query";
import { getPublicTracking } from "@api/trackingService";
import PublicLayout from "@layouts/public-layout/PublicLayout";
import useDocumentTitle from "@hooks/useDocumentTitle";

const toRad = (value) => (value * Math.PI) / 180;

const haversineKm = (start, end) => {
  const radius = 6371;
  const dLat = toRad(end.lat - start.lat);
  const dLon = toRad(end.lon - start.lon);
  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const estimateEtaMinutes = (distanceKm, speedKmh = 32) =>
  Math.max(3, Math.round((distanceKm / speedKmh) * 60));

const normalizePoints = (points) => {
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

const PublicTracking = () => {
  const { trackingToken } = useParams();
  useDocumentTitle("Rastreo en tiempo real");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-tracking", trackingToken],
    queryFn: () => getPublicTracking(trackingToken),
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
    enabled: !!trackingToken,
  });

  const trackingActive = data?.tracking_active;
  const serviceLocation = data?.service_location;
  const technicianLocation = data?.technician_location;

  const eta = useMemo(() => {
    if (
      !technicianLocation ||
      serviceLocation?.latitude == null ||
      serviceLocation?.longitude == null
    ) {
      return null;
    }
    const distanceKm = haversineKm(
      { lat: Number(technicianLocation.latitude), lon: Number(technicianLocation.longitude) },
      { lat: Number(serviceLocation.latitude), lon: Number(serviceLocation.longitude) }
    );
    return estimateEtaMinutes(distanceKm);
  }, [technicianLocation, serviceLocation]);

  const mapPoints = useMemo(() => {
    const points = [];
    if (serviceLocation?.latitude != null && serviceLocation?.longitude != null) {
      points.push({
        id: "service",
        lat: Number(serviceLocation.latitude),
        lon: Number(serviceLocation.longitude),
        type: "service",
      });
    }
    if (
      trackingActive &&
      technicianLocation?.latitude != null &&
      technicianLocation?.longitude != null
    ) {
      points.push({
        id: "tech",
        lat: Number(technicianLocation.latitude),
        lon: Number(technicianLocation.longitude),
        type: "tech",
      });
    }
    if (points.length === 0) {
      return [];
    }
    return normalizePoints(points);
  }, [serviceLocation, technicianLocation, trackingActive]);

  const header = (
    <div className="portal-hero">
      <span className="portal-kicker">Rastreo en tiempo real</span>
      <h1 className="portal-title">Tu técnico está en camino</h1>
      <p className="portal-subtitle">
        Sigue el recorrido en vivo y revisa el tiempo estimado de llegada.
      </p>
    </div>
  );

  return (
    <PublicLayout header={header}>
      <div className="portal-grid">
        <Card className="portal-card" bordered={false}>
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Spin />
            </div>
          ) : isError || !data ? (
            <div className="text-sm portal-muted">
              No encontramos la orden. Revisa el enlace enviado por WhatsApp.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Tag color={trackingActive ? "blue" : "default"}>
                  {trackingActive ? "En ruta" : "Seguimiento finalizado"}
                </Tag>
                <span className="text-sm portal-muted">
                  Técnico: {data.technician_name}
                </span>
              </div>
              <div className="portal-divider" />
              <div className="portal-map">
                {mapPoints.map((point) => (
                  <span
                    key={point.id}
                    className={`map-marker ${point.type === "tech" ? "tech" : ""}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  />
                ))}
              </div>
            </>
          )}
        </Card>
        <Card className="portal-card" bordered={false}>
          {data && (
            <>
              <div className="portal-pill">Actualización cada 15 segundos</div>
              <h2 className="text-xl font-semibold mt-4">Estado del servicio</h2>
              <div className="portal-divider" />
              <div className="grid gap-4">
                <div className="portal-stat">
                  <span>Estado actual</span>
                  <strong>{data.status_display}</strong>
                </div>
                <div className="portal-stat">
                  <span>ETA estimado</span>
                  <strong>{eta ? `${eta} min` : "Por confirmar"}</strong>
                </div>
                <div className="portal-stat">
                  <span>Dirección</span>
                  <strong>{serviceLocation?.address || "No registrada"}</strong>
                </div>
                {!trackingActive && (
                  <div className="text-sm portal-muted">
                    El rastreo se detuvo automáticamente al llegar el técnico.
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PublicTracking;
