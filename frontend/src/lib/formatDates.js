import dayjs from "dayjs";

export const dayjsToStrings = (value, format = "YYYY-MM-DD") => {
  if (!value) {
    return "";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(format) : "";
};

export const stringsToDayjs = (value) => {
  if (!value) {
    return null;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};
