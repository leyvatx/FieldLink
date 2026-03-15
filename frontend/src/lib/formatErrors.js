const toArray = (v) => (Array.isArray(v) ? v.map(String) : [String(v)]);

const formatErrors = (error) => {
  const data = error?.response?.data ?? error ?? {};

  if (typeof data === "string") return { non_field_errors: [data] };
  if (Array.isArray(data)) return { non_field_errors: data.map(String) };
  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, toArray(value)])
    );
  }
  return { non_field_errors: ["Unexpected error"] };
};

export { formatErrors };
export default formatErrors;
