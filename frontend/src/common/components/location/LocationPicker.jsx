import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { PiMagnifyingGlassBold, PiMapPinAreaBold, PiSpinnerGapBold, PiTrashBold } from "react-icons/pi";
import { Button, Input, Tag } from "@/lib/antd-compat";
import { searchLocations, reverseGeocode } from "@/api/locationService";
import { cn } from "@/lib/utils";
import { normalizeCoordinates } from "@/lib/locationCoordinates";

const DEFAULT_CENTER = [37.0902, -95.7129];
const DEFAULT_ZOOM = 4;
const LOCATION_ZOOM = 16;

function normalizeLocation(address, latitude, longitude) {
  const coordinates = normalizeCoordinates(latitude, longitude);

  if (!coordinates) {
    return address
      ? {
          address,
          latitude: null,
          longitude: null,
        }
      : null;
  }

  return {
    address: address || "",
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

function MapViewport({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location?.latitude == null || location?.longitude == null) {
      return;
    }

    map.flyTo([location.latitude, location.longitude], LOCATION_ZOOM, {
      duration: 0.45,
    });
  }, [location, map]);

  return null;
}

function MapClickHandler({ disabled, onPick }) {
  useMapEvents({
    click(event) {
      if (disabled) {
        return;
      }

      onPick?.(event.latlng);
    },
  });

  return null;
}

const LocationPicker = ({
  value,
  onChange,
  onLocationSelect,
  latitude,
  longitude,
  disabled = false,
  className,
}) => {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const selectedLocation = useMemo(
    () => normalizeLocation(value, latitude, longitude),
    [latitude, longitude, value]
  );

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const mapCenter =
    selectedLocation?.latitude != null && selectedLocation?.longitude != null
      ? [selectedLocation.latitude, selectedLocation.longitude]
      : DEFAULT_CENTER;

  const applyLocation = (location) => {
    onChange?.(location?.address || "");
    onLocationSelect?.(location || null);
    setQuery(location?.address || "");
    setFeedback("");
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setFeedback("Escribe una dirección para buscarla en el mapa.");
      return;
    }

    setSearching(true);
    setFeedback("");

    try {
      const matches = await searchLocations(query);
      setResults(matches);

      if (!matches.length) {
        setFeedback("No encontramos coincidencias para esa búsqueda.");
      }
    } catch {
      setResults([]);
      setFeedback("No se pudo consultar el buscador de direcciones.");
    } finally {
      setSearching(false);
    }
  };

  const handleMapPick = async ({ lat, lng }) => {
    setResolving(true);
    setFeedback("");

    try {
      const location = await reverseGeocode({
        latitude: lat,
        longitude: lng,
      });

      applyLocation(location);
    } catch {
      setFeedback("No se pudo leer la dirección de ese punto del mapa.");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          value={query}
          disabled={disabled}
          placeholder="Busca una dirección y luego ajústala en el mapa"
          prefix={<PiMagnifyingGlassBold size={16} />}
          onChange={(event) => setQuery(event.target.value)}
          onPressEnter={handleSearch}
        />
        <div className="flex gap-2">
          <Button
            type="primary"
            disabled={disabled || searching}
            loading={searching}
            onClick={handleSearch}
          >
            Buscar
          </Button>
          <Button
            disabled={disabled || (!value && latitude == null && longitude == null)}
            icon={<PiTrashBold size={16} />}
            onClick={() => {
              setResults([]);
              applyLocation(null);
            }}
          >
            Limpiar
          </Button>
        </div>
      </div>

      <div className="rounded-[24px] border border-[var(--ui-border)] bg-[var(--ui-card)] p-3 shadow-[var(--ui-shadow-soft)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-medium text-[var(--ui-foreground)]">
            Ubicación del servicio
          </div>
          <Tag color={selectedLocation?.latitude != null ? "green" : "default"}>
            {selectedLocation?.latitude != null ? "Punto confirmado" : "Pendiente"}
          </Tag>
        </div>

        <div className="relative overflow-hidden rounded-[20px] border border-[var(--ui-border)]">
          <MapContainer
            center={mapCenter}
            zoom={selectedLocation?.latitude != null ? LOCATION_ZOOM : DEFAULT_ZOOM}
            className="location-picker-map h-[320px] w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewport location={selectedLocation} />
            <MapClickHandler disabled={disabled || resolving} onPick={handleMapPick} />
            {selectedLocation?.latitude != null && selectedLocation?.longitude != null ? (
              <CircleMarker
                center={[selectedLocation.latitude, selectedLocation.longitude]}
                radius={10}
                pathOptions={{
                  color: "var(--ui-ring-strong)",
                  fillColor: "var(--ui-primary)",
                  fillOpacity: 0.92,
                  weight: 3,
                }}
              />
            ) : null}
          </MapContainer>

          {resolving ? (
            <div className="absolute inset-x-3 top-3 z-[500] inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-popover)_92%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--ui-popover-foreground)] shadow-[var(--ui-shadow-soft)] backdrop-blur">
              <PiSpinnerGapBold className="ui-spinner" size={14} />
              Resolviendo dirección del punto seleccionado...
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-secondary)] px-3 py-2 text-sm text-[var(--ui-muted-foreground)]">
          <PiMapPinAreaBold size={16} className="mt-0.5 shrink-0" />
          <div>
            {selectedLocation?.address || "Busca una dirección y haz clic en el mapa para fijar el punto exacto."}
          </div>
        </div>

        {feedback ? (
          <div className="mt-3 text-sm text-[var(--ui-muted-foreground)]">{feedback}</div>
        ) : null}

        {results.length ? (
          <div className="mt-3 grid gap-2">
            {results.map((result) => {
              const isActive =
                selectedLocation?.latitude === result.latitude &&
                selectedLocation?.longitude === result.longitude;

              return (
                <button
                  key={result.id}
                  type="button"
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-left transition",
                    isActive
                      ? "border-[var(--ui-ring-strong)] bg-[var(--ui-accent)] text-[var(--ui-foreground)]"
                      : "border-[var(--ui-border)] bg-[var(--ui-card)] text-[var(--ui-muted-foreground)] hover:bg-[var(--ui-accent)] hover:text-[var(--ui-foreground)]"
                  )}
                  onClick={() => applyLocation(result)}
                >
                  {result.address}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LocationPicker;
