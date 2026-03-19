const normalize = (value) => (value || "").toString().toLowerCase();

const onSelectFilter = (input, option) => {
  const label =
    option?.label ??
    option?.children ??
    option?.value ??
    "";

  return normalize(label).includes(normalize(input));
};

export default onSelectFilter;
