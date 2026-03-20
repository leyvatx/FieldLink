import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER = [22.5, -102.0];
const DEFAULT_ZOOM = 4;

function FitToPoints({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true, duration: 0.35 });
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
    color: "var(--sk-color-blue)",
    fillColor: "var(--sk-color-blue)",
  },
  assignment: {
    color: "var(--sk-color-yellow)",
    fillColor: "var(--sk-color-yellow)",
  },
};

const OperationsLiveMap = ({ points = [], className }) => {
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
      <FitToPoints points={points} />
      {points.map((point) => {
        const tone = pointStyles[point.type] || pointStyles.technician;

        return (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={10}
            pathOptions={{
              color: tone.color,
              fillColor: tone.fillColor,
              fillOpacity: 0.9,
              weight: 3,
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
