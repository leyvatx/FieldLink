const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

function getLanguage() {
  if (typeof navigator === "undefined") {
    return "es";
  }

  return navigator.language || "es";
}

function mapLocationResult(item) {
  return {
    id: String(item.place_id),
    address: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    raw: item,
  };
}

async function requestNominatim(path, params) {
  const query = new URLSearchParams({
    format: "jsonv2",
    "accept-language": getLanguage(),
    addressdetails: "1",
    ...params,
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}${path}?${query.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo consultar el servicio de mapas.");
  }

  return response.json();
}

export async function searchLocations(query) {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) {
    return [];
  }

  const data = await requestNominatim("/search", {
    q: normalizedQuery,
    limit: "5",
  });

  return data.map(mapLocationResult);
}

export async function reverseGeocode({ latitude, longitude }) {
  const data = await requestNominatim("/reverse", {
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
  });

  return mapLocationResult(data);
}
