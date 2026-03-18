const toArray = (value) =>
  Array.isArray(value) ? value.map(String) : [String(value)];

const toField = (name, value) => ({
  name,
  errors: toArray(value),
});

const GLOBAL_ERROR_KEYS = ["detail", "error", "message", "non_field_errors"];

const formatErrors = (error) => {
  const data = error?.response?.data ?? error ?? {};

  if (typeof data === "string") {
    return [toField("non_field_errors", data)];
  }

  if (Array.isArray(data)) {
    return [toField("non_field_errors", data)];
  }

  if (data && typeof data === "object") {
    const globalMessages = GLOBAL_ERROR_KEYS.flatMap((key) =>
      key in data ? toArray(data[key]) : []
    );

    const fieldErrors = Object.entries(data)
      .filter(([key]) => !GLOBAL_ERROR_KEYS.includes(key))
      .map(([key, value]) => toField(key, value));

    if (globalMessages.length > 0) {
      fieldErrors.unshift(toField("non_field_errors", globalMessages));
    }

    if (fieldErrors.length > 0) {
      return fieldErrors;
    }
  }

  return [toField("non_field_errors", "Ocurrio un error inesperado.")];
};

export { formatErrors };
export default formatErrors;
