import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_ZOOM = 15;

function MapViewport({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (latitude == null || longitude == null) {
      return;
    }

    map.flyTo([latitude, longitude], DEFAULT_ZOOM, {
      duration: 0.35,
    });
  }, [latitude, longitude, map]);

  return null;
}

const StaticLocationMap = ({
  latitude,
  longitude,
  address,
  className,
}) => {
  if (latitude == null || longitude == null) {
    return null;
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={DEFAULT_ZOOM}
      className={cn("location-picker-map h-[320px] w-full", className)}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport latitude={latitude} longitude={longitude} />
      <CircleMarker
        center={[latitude, longitude]}
        radius={10}
        pathOptions={{
          color: "var(--ui-ring-strong)",
          fillColor: "var(--ui-primary)",
          fillOpacity: 0.92,
          weight: 3,
        }}
      >
        {address ? <Popup>{address}</Popup> : null}
      </CircleMarker>
    </MapContainer>
  );
};

export default StaticLocationMap;
