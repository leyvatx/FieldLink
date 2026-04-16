import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { cn } from "@/lib/utils";
import { normalizeCoordinates } from "@/lib/locationCoordinates";

const DEFAULT_CENTER = [22.5, -102.0];
const DEFAULT_ZOOM = 4;

function FitToPoints({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, {
        animate: true,
        duration: 0.35,
      });
      return;
    }

    if (points.length === 1) {
      map.flyTo([points[0].latitude, points[0].longitude], 13, {
        duration: 0.35,
      });
      return;
    }

    map.fitBounds(
      points.map((point) => [point.latitude, point.longitude]),
      {
        animate: true,
        duration: 0.35,
        padding: [42, 42],
      }
    );
  }, [map, points]);

  return null;
}

const pointStyles = {
  technician: {
    color: "#2563eb",
    fillColor: "#60a5fa",
    radius: 10,
    fillOpacity: 0.92,
    weight: 3,
  },
  destination: {
    color: "#d97706",
    fillColor: "#facc15",
    radius: 8,
    fillOpacity: 0.9,
    weight: 3,
  },
};

const connectionStyles = {
  ASSIGNED: {
    color: "#a855f7",
    dashArray: "6 10",
  },
  IN_TRANSIT: {
    color: "#0891b2",
    dashArray: "10 10",
  },
  IN_SERVICE: {
    color: "#16a34a",
    dashArray: "3 10",
  },
  default: {
    color: "#64748b",
    dashArray: "8 10",
  },
};

const OperationsLiveMap = ({
  points = [],
  connections = [],
  className,
}) => {
  const safePoints = points.flatMap((point) => {
    const coordinates = normalizeCoordinates(point.latitude, point.longitude);

    if (!coordinates) {
      return [];
    }

    return [
      {
        ...point,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
    ];
  });
  const safeConnections = connections.flatMap((connection) => {
    if (!Array.isArray(connection.from) || !Array.isArray(connection.to)) {
      return [];
    }

    const from = normalizeCoordinates(connection.from[0], connection.from[1]);
    const to = normalizeCoordinates(connection.to[0], connection.to[1]);

    if (!from || !to) {
      return [];
    }

    return [
      {
        ...connection,
        from: [from.latitude, from.longitude],
        to: [to.latitude, to.longitude],
      },
    ];
  });

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className={cn("location-picker-map h-[420px] w-full", className)}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToPoints points={safePoints} />

      {safeConnections.map((connection) => {
        const tone = connectionStyles[connection.status] || connectionStyles.default;

        return (
          <Polyline
            key={connection.id}
            positions={[connection.from, connection.to]}
            pathOptions={{
              color: tone.color,
              dashArray: tone.dashArray,
              opacity: 0.72,
              weight: 4,
            }}
          />
        );
      })}

      {safePoints.map((point) => {
        const tone = pointStyles[point.type] || pointStyles.technician;

        return (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={point.radius ?? tone.radius}
            pathOptions={{
              color: tone.color,
              fillColor: tone.fillColor,
              fillOpacity: tone.fillOpacity,
              weight: tone.weight,
            }}
          >
            <Popup>
              <div className="grid gap-1">
                <div className="font-semibold">{point.title}</div>
                {point.subtitle ? (
                  <div className="text-sm text-[var(--ui-muted-foreground)]">
                    {point.subtitle}
                  </div>
                ) : null}
                {point.meta?.map((entry) => (
                  <div key={entry.label} className="text-xs text-[var(--ui-muted-foreground)]">
                    <strong className="text-[var(--ui-foreground)]">{entry.label}:</strong>{" "}
                    {entry.value}
                  </div>
                ))}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default OperationsLiveMap;
