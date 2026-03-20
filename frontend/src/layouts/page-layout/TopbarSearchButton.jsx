import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Input, Select } from "@/lib/antd-compat";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PiMagnifyingGlassBold,
  PiXBold,
} from "react-icons/pi";

const isFilled = (value) => {
  if (value == null) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
};

const TopbarSearchButton = ({ config }) => {
  const [open, setOpen] = useState(false);
  const [draftValues, setDraftValues] = useState({});

  useEffect(() => {
    if (open) {
      setDraftValues(config?.values || {});
    }
  }, [config?.values, open]);

  const activeCount = useMemo(() => {
    if (!config) {
      return 0;
    }
    if (typeof config.activeCount === "number") {
      return config.activeCount;
    }
    return (config.fields || []).filter((field) =>
      isFilled(config.values?.[field.key])
    ).length;
  }, [config]);

  if (!config) {
    return null;
  }

  const handleFieldChange = (field, value) => {
    setDraftValues((prev) => ({
      ...prev,
      [field.key]: value,
    }));
  };

  const handleApply = () => {
    if (config.onApply) {
      config.onApply(draftValues);
    } else if (config.onChange) {
      config.onChange(draftValues);
    }
    setOpen(false);
  };

  const handleReset = () => {
    config.onReset?.();
    setDraftValues({});
  };

  const renderField = (field) => {
    if (field.type === "select") {
      return (
        <div key={field.key} className={cn("grid gap-2", field.fullWidth && "md:col-span-2")}>
          <label className="text-sm font-medium text-[var(--ui-foreground)]">{field.label}</label>
          <Select
            allowClear={field.allowClear ?? true}
            placeholder={field.placeholder || field.label}
            options={field.options || []}
            value={draftValues?.[field.key] ?? undefined}
            onChange={(value) => handleFieldChange(field, value)}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            menuPosition="fixed"
          />
          {field.description ? (
            <span className="text-xs text-[var(--ui-muted-foreground)]">{field.description}</span>
          ) : null}
        </div>
      );
    }

    return (
      <div key={field.key} className={cn("grid gap-2", field.fullWidth && "md:col-span-2")}>
        <label className="text-sm font-medium text-[var(--ui-foreground)]">{field.label}</label>
        <Input
          allowClear
          placeholder={field.placeholder || field.label}
          value={draftValues?.[field.key] ?? ""}
          onChange={(event) => handleFieldChange(field, event.target.value)}
          onPressEnter={handleApply}
        />
        {field.description ? (
          <span className="text-xs text-[var(--ui-muted-foreground)]">{field.description}</span>
        ) : null}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span>
          <Badge count={activeCount} size="small" offset={[-4, 4]}>
            <Button
              aria-label="Abrir filtros"
              icon={<PiMagnifyingGlassBold size={18} />}
              className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-card)] px-3 shadow-[var(--ui-shadow-soft)] hover:bg-[var(--ui-accent)]"
            >
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </Badge>
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[min(92vw,38rem)] overflow-visible rounded-[28px] border border-[var(--ui-border)] bg-[var(--ui-popover)] p-0 text-[var(--ui-popover-foreground)] shadow-[var(--ui-shadow-card)]"
      >
        <div className="border-b border-[var(--ui-border)] px-5 pb-4 pt-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
            {activeCount ? `${activeCount} activos` : "Busqueda avanzada"}
          </div>
          <div className="mt-2 text-lg font-semibold text-[var(--ui-foreground)]">
            {config.title || "Buscar y filtrar"}
          </div>
          {config.description ? (
            <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
              {config.description}
            </div>
          ) : null}
        </div>
        <div className="px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            {(config.fields || []).map(renderField)}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--ui-border)] px-5 py-4">
          {config.onReset ? (
            <Button
              icon={<PiXBold size={16} />}
              onClick={handleReset}
            >
              Limpiar
            </Button>
          ) : null}
          <Button
            type="primary"
            icon={<PiMagnifyingGlassBold size={16} />}
            onClick={handleApply}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TopbarSearchButton;
