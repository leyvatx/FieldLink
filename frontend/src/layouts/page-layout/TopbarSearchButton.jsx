import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Drawer, Input, Select } from "antd";
import {
  PiArrowClockwiseBold,
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
        <div key={field.key} className="grid gap-2">
          <label className="text-sm font-medium">{field.label}</label>
          <Select
            allowClear={field.allowClear ?? true}
            placeholder={field.placeholder || field.label}
            options={field.options || []}
            value={draftValues?.[field.key] ?? undefined}
            onChange={(value) => handleFieldChange(field, value)}
          />
        </div>
      );
    }

    return (
      <div key={field.key} className="grid gap-2">
        <label className="text-sm font-medium">{field.label}</label>
        <Input
          allowClear
          placeholder={field.placeholder || field.label}
          value={draftValues?.[field.key] ?? ""}
          onChange={(event) => handleFieldChange(field, event.target.value)}
          onPressEnter={handleApply}
        />
      </div>
    );
  };

  return (
    <>
      <Badge count={activeCount} size="small" offset={[-4, 4]}>
        <Button
          aria-label="Abrir filtros"
          icon={<PiMagnifyingGlassBold size={18} />}
          onClick={() => setOpen(true)}
        />
      </Badge>
      <Drawer
        title={config.title || "Buscar y filtrar"}
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        width={380}
        destroyOnHidden
      >
        <div className="grid gap-4">
          {(config.fields || []).map(renderField)}
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          {config.onRefresh && (
            <Button
              icon={<PiArrowClockwiseBold size={16} />}
              onClick={() => config.onRefresh?.()}
            >
              Refrescar
            </Button>
          )}
          {config.onReset && (
            <Button
              icon={<PiXBold size={16} />}
              onClick={handleReset}
            >
              Limpiar
            </Button>
          )}
          <Button
            type="primary"
            icon={<PiMagnifyingGlassBold size={16} />}
            onClick={handleApply}
          >
            Buscar
          </Button>
        </div>
      </Drawer>
    </>
  );
};

export default TopbarSearchButton;
