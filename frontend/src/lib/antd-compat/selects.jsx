import { isValidElement, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import SelectBase, { components as ReactSelectComponents } from "react-select";
import { PiCalendarBlank, PiMagnifyingGlassBold, PiX } from "react-icons/pi";
import { cn, isObject, toArray } from "@/lib/utils";
import { Button, Input } from "@/lib/antd-compat/base";
import UIButton from "@/components/ui/button";
import Calendar from "@/components/ui/calendar";
import {
  Popover as UIPopover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function flattenOptions(options = []) {
  const flat = [];
  options.forEach((option) => {
    if (option?.options) {
      option.options.forEach((nested) => flat.push(nested));
      return;
    }
    flat.push(option);
  });
  return flat;
}

function mapSelectOptions(options = []) {
  return options.map((option) => {
    if (option?.options) {
      return {
        ...option,
        options: option.options.map((nested) => ({
          ...nested,
          label: nested.label ?? nested.value,
        })),
      };
    }

    return {
      ...option,
      label: option.label ?? option.value,
    };
  });
}

function resolveOptionValue(option, labelInValue) {
  if (!option) return undefined;
  if (labelInValue) {
    return {
      ...option,
      value: option.value,
      label: option.label,
      key: option.value,
    };
  }
  return option.value;
}

function resolveSelectValue(value, options, isMulti) {
  if (value == null) return isMulti ? [] : null;

  const flat = flattenOptions(options);
  const map = new Map(flat.map((option) => [String(option.value), option]));
  const source = isMulti ? toArray(value) : [value];

  const resolved = source
    .map((item) => {
      if (item == null) return null;
      const rawValue = isObject(item) && "value" in item ? item.value : item;
      return map.get(String(rawValue)) || (isObject(item) ? item : { value: rawValue, label: String(rawValue) });
    })
    .filter(Boolean);

  return isMulti ? resolved : resolved[0] ?? null;
}

const SelectOption = (props) => {
  const { children, data, selectProps } = props;
  const custom = selectProps.optionRender?.({
    ...data,
    data,
    label: data.label,
    value: data.value,
    className: data.className,
  });

  return <ReactSelectComponents.Option {...props}>{custom ?? children}</ReactSelectComponents.Option>;
};

const SelectMenuList = (props) => {
  const menu = <ReactSelectComponents.MenuList {...props}>{props.children}</ReactSelectComponents.MenuList>;
  return props.selectProps.popupRender ? props.selectProps.popupRender(menu) : menu;
};

const SelectMultiValue = (props) => {
  const tagRender = props.selectProps.tagRender;
  if (!tagRender) return <ReactSelectComponents.MultiValue {...props} />;

  const rendered = tagRender({
    label: props.data.label,
    value: props.data.value,
    closable: true,
    onClose: () => props.removeProps.onClick?.(),
  });

  if (
    rendered == null ||
    rendered === false ||
    (isValidElement(rendered) && rendered.type === Symbol.for("react.fragment") && !rendered.props.children)
  ) {
    return null;
  }

  return <div className="inline-flex">{rendered}</div>;
};

export function Select({
  mode,
  options = [],
  value,
  onChange,
  onSelect,
  onSearch,
  allowClear = false,
  placeholder,
  className,
  style,
  disabled,
  filterOption,
  showSearch = true,
  labelInValue = false,
  loading = false,
  notFoundContent,
  optionRender,
  popupRender,
  tagRender,
  open,
  onDropdownVisibleChange,
  menuPortalTarget,
  menuPosition,
  closeMenuOnSelect,
  ...props
}) {
  const isMulti = mode === "multiple";
  const mappedOptions = useMemo(() => mapSelectOptions(options), [options]);
  const selectedValue = useMemo(() => resolveSelectValue(value, mappedOptions, isMulti), [isMulti, mappedOptions, value]);

  return (
    <SelectBase
      unstyled
      isMulti={isMulti}
      isDisabled={disabled}
      isClearable={allowClear}
      isSearchable={showSearch}
      isLoading={loading}
      menuIsOpen={typeof open === "boolean" ? open : undefined}
      closeMenuOnSelect={closeMenuOnSelect ?? !isMulti}
      blurInputOnSelect={!isMulti}
      value={selectedValue}
      options={mappedOptions}
      placeholder={placeholder}
      classNamePrefix="fd-select"
      className={className}
      styles={{
        container: (base) => ({ ...base, width: "100%", ...style }),
        menuPortal: (base) => ({ ...base, zIndex: 1200 }),
      }}
      menuPortalTarget={menuPortalTarget}
      menuPosition={menuPosition ?? (menuPortalTarget ? "fixed" : "absolute")}
      menuShouldScrollIntoView={false}
      filterOption={
        filterOption === false
          ? null
          : typeof filterOption === "function"
            ? (candidate, inputValue) => filterOption(inputValue, candidate.data)
            : undefined
      }
      noOptionsMessage={() =>
        typeof notFoundContent === "string"
          ? notFoundContent
          : loading
            ? "Cargando..."
            : "Sin opciones"
      }
      onMenuOpen={() => onDropdownVisibleChange?.(true)}
      onMenuClose={() => onDropdownVisibleChange?.(false)}
      onInputChange={(inputValue, actionMeta) => {
        if (actionMeta.action === "input-change") onSearch?.(inputValue);
        return inputValue;
      }}
      onChange={(next, actionMeta) => {
        const nextValue = isMulti
          ? (next ?? []).map((item) => resolveOptionValue(item, labelInValue))
          : resolveOptionValue(next, labelInValue);

        onChange?.(nextValue, next);

        if (actionMeta.action === "select-option") {
          const selected = actionMeta.option;
          onSelect?.(selected?.value, selected);
        }
      }}
      components={{
        Option: SelectOption,
        MenuList: SelectMenuList,
        MultiValue: SelectMultiValue,
      }}
      optionRender={optionRender}
      popupRender={popupRender}
      tagRender={tagRender}
      {...props}
    />
  );
}

export function AutoComplete({ value = "", onChange, onSelect, options = [], placeholder, disabled, filterOption, className, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredOptions = options.filter((option) => {
    if (typeof filterOption === "function") return filterOption(value, option);
    return option.label?.toLowerCase().includes(String(value).toLowerCase());
  });

  return (
    <div className={cn("relative", className)} style={style} ref={ref}>
      <Input
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange?.(event.target.value);
          setOpen(true);
        }}
      />
      {open && filteredOptions.length > 0 ? (
        <div className="absolute z-[1200] mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-[color:var(--sk-color-border-secondary)] bg-[color:var(--sk-color-bg-elevated)] p-2 shadow-[var(--sk-box-shadow-card)]">
          {filteredOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className="flex w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[color:var(--sk-control-item-bg-hover)]"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange?.(option.value);
                onSelect?.(option.value, option);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function toDate(value) {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : undefined;
}

function buildTimeOptions(values) {
  return values.map((value) => ({
    value: String(value).padStart(2, "0"),
    label: String(value).padStart(2, "0"),
  }));
}

const HOUR_OPTIONS = buildTimeOptions(Array.from({ length: 24 }, (_, index) => index));
const MINUTE_OPTIONS = buildTimeOptions(Array.from({ length: 12 }, (_, index) => index * 5));

function DatePickerBase({
  value,
  onChange,
  className,
  style,
  disabled,
  allowClear = true,
  format = "YYYY-MM-DD",
  placeholder,
  showTime = false,
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = toDate(value);
  const [draftValue, setDraftValue] = useState(null);
  const [draftTime, setDraftTime] = useState({ hour: "09", minute: "00" });
  const resolvedPlaceholder = placeholder ?? (showTime ? "Seleccionar fecha y hora" : "Seleccionar fecha");
  const label = selectedDate ? dayjs(selectedDate).format(format) : resolvedPlaceholder;

  const syncDraftValue = () => {
    if (selectedDate) {
      const nextDraft = dayjs(selectedDate);
      setDraftValue(nextDraft);
      setDraftTime({
        hour: String(nextDraft.hour()).padStart(2, "0"),
        minute: String(nextDraft.minute()).padStart(2, "0"),
      });
      return;
    }

    const now = dayjs().minute(Math.floor(dayjs().minute() / 5) * 5).second(0).millisecond(0);
    setDraftValue(null);
    setDraftTime({
      hour: String(now.hour()).padStart(2, "0"),
      minute: String(now.minute()).padStart(2, "0"),
    });
  };

  const applyValue = (nextValue) => {
    const normalized = nextValue ? dayjs(nextValue).second(0).millisecond(0) : null;
    onChange?.(normalized, normalized ? normalized.format(format) : "");
  };

  const draftHour = draftTime.hour;
  const draftMinute = draftTime.minute;

  return (
    <div className="relative" style={style}>
      <UIPopover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) syncDraftValue();
        }}
      >
        <PopoverTrigger asChild>
          <UIButton
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-between rounded-xl border-[var(--ui-border)] bg-[var(--ui-input)] pr-10 text-left font-normal text-[var(--ui-foreground)] shadow-[var(--ui-shadow-soft)] hover:bg-[var(--ui-input)]",
              !selectedDate && "text-[var(--ui-muted-foreground)]",
              className
            )}
          >
            <span className="truncate">{label}</span>
            <PiCalendarBlank size={16} className="shrink-0 text-[var(--ui-muted-foreground)]" />
          </UIButton>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="space-y-3 p-3">
            <Calendar
              mode="single"
              selected={showTime ? toDate(draftValue) : selectedDate}
              onSelect={(nextDate) => {
                if (!nextDate) {
                  setDraftValue(null);
                  applyValue(null);
                  return;
                }

                const baseValue = showTime ? draftValue ?? dayjs() : dayjs(nextDate);
                const next = dayjs(nextDate)
                  .hour(showTime ? Number(draftTime.hour) : baseValue.hour())
                  .minute(showTime ? Number(draftTime.minute) : 0)
                  .second(0)
                  .millisecond(0);

                if (showTime) {
                  setDraftValue(next);
                  return;
                }

                applyValue(next);
                setOpen(false);
              }}
              initialFocus
            />
            {showTime ? (
              <div className="space-y-3 border-t border-[var(--ui-border)] pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ui-muted-foreground)]">
                      Hora
                    </div>
                    <Select
                      options={HOUR_OPTIONS}
                      value={draftHour}
                      onChange={(nextHour) => {
                        const hour = Number(nextHour ?? "0");
                        const hourValue = String(hour).padStart(2, "0");
                        setDraftTime((current) => ({ ...current, hour: hourValue }));
                        setDraftValue((current) => current?.hour(hour).second(0).millisecond(0) ?? null);
                      }}
                      placeholder="Hora"
                      showSearch={false}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ui-muted-foreground)]">
                      Minutos
                    </div>
                    <Select
                      options={MINUTE_OPTIONS}
                      value={draftMinute}
                      onChange={(nextMinute) => {
                        const minute = Number(nextMinute ?? "0");
                        const minuteValue = String(minute).padStart(2, "0");
                        setDraftTime((current) => ({ ...current, minute: minuteValue }));
                        setDraftValue((current) => current?.minute(minute).second(0).millisecond(0) ?? null);
                      }}
                      placeholder="Minutos"
                      showSearch={false}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <UIButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      syncDraftValue();
                      setOpen(false);
                    }}
                  >
                    Cancelar
                  </UIButton>
                  <UIButton
                    type="button"
                    size="sm"
                    onClick={() => {
                      applyValue(draftValue);
                      setOpen(false);
                    }}
                    disabled={!draftValue}
                  >
                    Aplicar
                  </UIButton>
                </div>
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </UIPopover>
      {allowClear && selectedDate ? (
        <button
          type="button"
          className="absolute right-9 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-[var(--ui-muted-foreground)] transition hover:bg-[var(--ui-accent)] hover:text-[var(--ui-foreground)]"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onChange?.(null, "");
          }}
        >
          <PiX size={12} />
        </button>
      ) : null}
    </div>
  );
}

function RangePicker({
  value = [],
  onChange,
  className,
  style,
  format = "YYYY-MM-DD",
  allowClear = true,
  placeholder = "Seleccionar rango",
}) {
  const [open, setOpen] = useState(false);
  const startValue = value?.[0];
  const endValue = value?.[1];
  const selectedRange = {
    from: toDate(startValue),
    to: toDate(endValue),
  };
  const label =
    selectedRange.from || selectedRange.to
      ? `${selectedRange.from ? dayjs(selectedRange.from).format(format) : "Inicio"} - ${
          selectedRange.to ? dayjs(selectedRange.to).format(format) : "Fin"
        }`
      : placeholder;

  const emit = (nextStart, nextEnd) => {
    const output = [nextStart, nextEnd];
    const strings = [nextStart ? dayjs(nextStart).format(format) : "", nextEnd ? dayjs(nextEnd).format(format) : ""];
    onChange?.(output, strings);
  };

  return (
    <div className="relative" style={style}>
      <UIPopover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <UIButton
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between rounded-xl border-[var(--ui-border)] bg-[var(--ui-input)] pr-10 text-left font-normal text-[var(--ui-foreground)] shadow-[var(--ui-shadow-soft)] hover:bg-[var(--ui-input)]",
              !(selectedRange.from || selectedRange.to) && "text-[var(--ui-muted-foreground)]",
              className
            )}
          >
            <span className="truncate">{label}</span>
            <PiCalendarBlank size={16} className="shrink-0 text-[var(--ui-muted-foreground)]" />
          </UIButton>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={selectedRange}
            onSelect={(range) => {
              const nextStart = range?.from ? dayjs(range.from) : null;
              const nextEnd = range?.to ? dayjs(range.to) : null;
              emit(nextStart, nextEnd);
              if (range?.from && range?.to) setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </UIPopover>
      {allowClear && (selectedRange.from || selectedRange.to) ? (
        <button
          type="button"
          className="absolute right-9 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-[var(--ui-muted-foreground)] transition hover:bg-[var(--ui-accent)] hover:text-[var(--ui-foreground)]"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            emit(null, null);
          }}
        >
          <PiX size={12} />
        </button>
      ) : null}
    </div>
  );
}

export const DatePicker = Object.assign(DatePickerBase, {
  RangePicker,
});

export function SearchInput({ onSearch, enterButton, ...props }) {
  const buttonLabel = enterButton === true || enterButton == null ? <PiMagnifyingGlassBold size={16} /> : enterButton;

  return (
    <div className="flex items-center gap-2">
      <Input
        {...props}
        prefix={<PiMagnifyingGlassBold size={16} />}
        onPressEnter={(event) => onSearch?.(event.target.value, event)}
      />
      <Button type="primary" icon={typeof buttonLabel === "string" ? null : buttonLabel} onClick={() => onSearch?.(props.value ?? "")}>
        {typeof buttonLabel === "string" ? buttonLabel : null}
      </Button>
    </div>
  );
}
