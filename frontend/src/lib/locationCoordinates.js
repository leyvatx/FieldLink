const ZERO_PAIR_EPSILON = 0.000001;

function isWithinRange(value, axis) {
  if (axis === "latitude") {
    return value >= -90 && value <= 90;
  }

  return value >= -180 && value <= 180;
}

export function toCoordinateOrNull(value, axis) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return isWithinRange(numericValue, axis) ? numericValue : null;
}

export function normalizeCoordinates(latitude, longitude) {
  const safeLatitude = toCoordinateOrNull(latitude, "latitude");
  const safeLongitude = toCoordinateOrNull(longitude, "longitude");

  if (safeLatitude == null || safeLongitude == null) {
    return null;
  }

  if (
    Math.abs(safeLatitude) < ZERO_PAIR_EPSILON &&
    Math.abs(safeLongitude) < ZERO_PAIR_EPSILON
  ) {
    return null;
  }

  return {
    latitude: safeLatitude,
    longitude: safeLongitude,
  };
}

export function hasValidCoordinates(latitude, longitude) {
  return normalizeCoordinates(latitude, longitude) != null;
}
