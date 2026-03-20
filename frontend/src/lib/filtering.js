export function normalizeFilterText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function matchesText(value, query) {
  const normalizedQuery = normalizeFilterText(query);
  if (!normalizedQuery) {
    return true;
  }

  return normalizeFilterText(value).includes(normalizedQuery);
}

export function matchesAnyText(values, query) {
  const normalizedQuery = normalizeFilterText(query);
  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => normalizeFilterText(value).includes(normalizedQuery));
}
