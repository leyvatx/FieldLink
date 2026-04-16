import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, Spin, Tag } from "@/lib/antd-compat";
import { useQuery } from "@tanstack/react-query";
import { getPublicTracking } from "@api/trackingService";
import OperationsLiveMap from "@/common/components/location/OperationsLiveMap";
import PublicLayout from "@layouts/public-layout/PublicLayout";
import useDocumentTitle from "@hooks/useDocumentTitle";
import { normalizeCoordinates } from "@/lib/locationCoordinates";

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
  const safeServiceLocation = normalizeCoordinates(
    serviceLocation?.latitude,
    serviceLocation?.longitude
  );
  const safeTechnicianLocation = normalizeCoordinates(
    technicianLocation?.latitude,
    technicianLocation?.longitude
  );

  const eta = useMemo(() => {
    if (!safeTechnicianLocation || !safeServiceLocation) {
      return null;
    }

    const distanceKm = haversineKm(
      { lat: safeTechnicianLocation.latitude, lon: safeTechnicianLocation.longitude },
      { lat: safeServiceLocation.latitude, lon: safeServiceLocation.longitude }
    );
    return estimateEtaMinutes(distanceKm);
  }, [safeServiceLocation, safeTechnicianLocation]);

  const mapPoints = useMemo(() => {
    const points = [];

    if (safeServiceLocation) {
      points.push({
        id: "service",
        latitude: safeServiceLocation.latitude,
        longitude: safeServiceLocation.longitude,
        type: "destination",
        title: "Destino del servicio",
        subtitle: serviceLocation?.address || "Ubicación confirmada",
        meta: [
          { label: "Cliente", value: data?.customer_name || "Sin cliente" },
          { label: "Estado", value: data?.status_display || data?.status || "Sin estado" },
        ],
      });
    }

    if (trackingActive && safeTechnicianLocation) {
      points.push({
        id: "tech",
        latitude: safeTechnicianLocation.latitude,
        longitude: safeTechnicianLocation.longitude,
        type: "technician",
        title: data?.technician_name || "Técnico",
        subtitle: "Posición GPS más reciente",
        meta: technicianLocation?.timestamp
          ? [{ label: "Actualizado", value: new Date(technicianLocation.timestamp).toLocaleString() }]
          : [],
      });
    }

    return points;
  }, [
    data?.customer_name,
    data?.status,
    data?.status_display,
    data?.technician_name,
    safeServiceLocation,
    safeTechnicianLocation,
    serviceLocation?.address,
    technicianLocation?.timestamp,
    trackingActive,
  ]);

  const mapConnections = useMemo(() => {
    if (!trackingActive || !safeServiceLocation || !safeTechnicianLocation) {
      return [];
    }

    return [
      {
        id: "tracking-route",
        status: data?.status || "IN_TRANSIT",
        from: [safeTechnicianLocation.latitude, safeTechnicianLocation.longitude],
        to: [safeServiceLocation.latitude, safeServiceLocation.longitude],
      },
    ];
  }, [data?.status, safeServiceLocation, safeTechnicianLocation, trackingActive]);

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
              <div className="portal-map-shell">
                {mapPoints.length ? (
                  <OperationsLiveMap
                    points={mapPoints}
                    connections={mapConnections}
                    className="portal-live-map"
                  />
                ) : (
                  <div className="portal-map-fallback">
                    No hay coordenadas válidas para esta orden.
                  </div>
                )}
              </div>
              {trackingActive && !safeTechnicianLocation ? (
                <div className="text-sm portal-muted mt-3">
                  La orden ya tiene rastreo público, pero aún no llega una posición GPS del técnico.
                </div>
              ) : null}
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
