import { useEffect, useMemo, useState } from "react";
import { Input, Select } from "@/lib/antd-compat";
import { COUNTRY_CODES, joinE164, splitE164 } from "./phoneUtils";

const PhoneInput = ({ value, onChange, disabled, placeholder, maxLength = 15 }) => {
  const initial = useMemo(() => splitE164(value), [value]);
  const [dialCode, setDialCode] = useState(initial.dialCode);
  const [national, setNational] = useState(initial.national);

  useEffect(() => {
    const next = splitE164(value);
    setDialCode(next.dialCode);
    setNational(next.national);
  }, [value]);

  const emit = (nextDial, nextNational) => {
    onChange?.(joinE164(nextDial, nextNational));
  };

  const handleDialChange = (next) => {
    setDialCode(next);
    emit(next, national);
  };

  const handleNationalChange = (event) => {
    const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
    setNational(digitsOnly);
    emit(dialCode, digitsOnly);
  };

  const dialOptions = useMemo(
    () =>
      COUNTRY_CODES.map((country) => ({
        value: country.code,
        label: country.code,
        flag: country.flag,
        country: country.country,
        countryLabel: country.label,
      })),
    []
  );

  const selectBefore = (
    <Select
      value={dialCode}
      options={dialOptions}
      onChange={handleDialChange}
      disabled={disabled}
      className="phone-prefix-select"
      style={{ width: 72 }}
      styles={{
        menu: (base) => ({
          ...base,
          minWidth: 260,
        }),
      }}
      openMenuOnClick
      openMenuOnFocus
      menuPlacement="auto"
      showSearch
      filterOption={(input, option) => {
        const needle = input.toLowerCase();
        return (
          String(option.value || "").toLowerCase().includes(needle) ||
          String(option.country || "").toLowerCase().includes(needle) ||
          String(option.countryLabel || "").toLowerCase().includes(needle)
        );
      }}
      optionRender={(option) => (
        <span className="inline-flex items-center gap-2">
          <span>{option.flag}</span>
          <span className="tabular-nums">{option.value}</span>
          <span className="text-[color:var(--ui-muted-foreground)]">{option.countryLabel}</span>
        </span>
      )}
      placeholder="+52"
    />
  );

  return (
    <Input
      addonBefore={selectBefore}
      value={national}
      onChange={handleNationalChange}
      disabled={disabled}
      placeholder={placeholder || "10 dígitos"}
      inputMode="tel"
      autoComplete="tel-national"
      maxLength={maxLength}
    />
  );
};

export default PhoneInput;
