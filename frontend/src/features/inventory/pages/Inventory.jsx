import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tabs,
  Tag,
} from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  PiArrowDownBold,
  PiCheckCircleBold,
  PiClockCountdownBold,
  PiPackageBold,
  PiPlusBold,
  PiUsersThreeBold,
} from "react-icons/pi";
import ModuleStatStrip from "@components/ModuleStatStrip";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  assignTechnicianInventory,
  createMaterial,
  getCentralWarehouse,
  getMaterials,
  getRestockHistory,
  getTechnicianInventory,
  receiveWarehouseStock,
} from "@api/inventoryService";
import { getTechnicians } from "@api/userService";
import queryClient from "@lib/queryClient";
import { useMessage } from "@context/MessageProvider";
import { useDialog } from "@context/DialogProvider";
import { matchesText } from "@/lib/filtering";

const MOVEMENT_LABELS = {
  PURCHASE: "Entrada",
  ADJUSTMENT: "Salida",
  CONSUMPTION: "Consumo",
  RETURN: "Devolución",
};

const getShortage = (record) =>
  Math.max(Number(record.minimum_threshold || 0) - Number(record.quantity_usable || 0), 0);

const getWarehouseState = (record) => {
  const usable = Number(record.quantity_usable || 0);

  if (usable <= 0) {
    return { label: "Sin stock", color: "red" };
  }

  if (record.needs_restock) {
    return { label: "Bajo", color: "gold" };
  }

  return { label: "OK", color: "green" };
};

const getTechnicianState = (units) => {
  if (units <= 0) {
    return { label: "Sin stock", color: "red" };
  }

  if (units < 5) {
    return { label: "Bajo", color: "gold" };
  }

  return { label: "Con stock", color: "green" };
};

const formatDateTime = (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-");

const Inventory = () => {
  const { success, error } = useMessage();
  const { openContextMenu } = useDialog();
  const [filters, setFilters] = useState({
    material: "",
    sku: "",
    unit: "",
    technician: "",
    movement: "",
    actor: "",
    notes: "",
    warehouseState: null,
  });
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [warehousePreset, setWarehousePreset] = useState(null);
  const [assignPreset, setAssignPreset] = useState(null);
  const [materialForm] = Form.useForm();
  const [warehouseForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const watchedWarehouseMaterial = Form.useWatch("material", warehouseForm);
  const watchedAssignMaterial = Form.useWatch("material", assignForm);
  const watchedAssignTechnician = Form.useWatch("technician", assignForm);

  const refreshInventoryData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["materials"] });
    queryClient.invalidateQueries({ queryKey: ["central-warehouse"] });
    queryClient.invalidateQueries({ queryKey: ["technician-inventory"] });
    queryClient.invalidateQueries({ queryKey: ["restock-history"] });
  }, []);

  const { data: materials = [], isLoading: loadingMaterials } = useQuery({
    queryKey: ["materials"],
    queryFn: () => getMaterials(),
  });

  const { data: warehouse = [], isLoading: loadingWarehouse } = useQuery({
    queryKey: ["central-warehouse"],
    queryFn: getCentralWarehouse,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });

  const { data: technicianInventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["technician-inventory"],
    queryFn: () => getTechnicianInventory(),
  });

  const { data: restockHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["restock-history"],
    queryFn: () => getRestockHistory(),
  });

  const createMaterialMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      success("Material creado");
      setMaterialModalOpen(false);
      materialForm.resetFields();
      refreshInventoryData();
    },
    onError: (requestError) =>
      error(
        requestError.response?.data?.sku?.[0] ||
          requestError.response?.data?.name?.[0] ||
          "No se pudo crear el material"
      ),
  });

  const receiveStockMutation = useMutation({
    mutationFn: receiveWarehouseStock,
    onSuccess: () => {
      success("Entrada de almacén registrada");
      setWarehouseModalOpen(false);
      setWarehousePreset(null);
      warehouseForm.resetFields();
      refreshInventoryData();
    },
    onError: (requestError) =>
      error(
        requestError.response?.data?.error ||
          "No se pudo registrar la entrada al almacén"
      ),
  });

  const assignStockMutation = useMutation({
    mutationFn: assignTechnicianInventory,
    onSuccess: () => {
      success("Material entregado al técnico");
      setAssignModalOpen(false);
      setAssignPreset(null);
      assignForm.resetFields();
      refreshInventoryData();
    },
    onError: (requestError) =>
      error(
        requestError.response?.data?.error ||
          "No se pudo asignar material al técnico"
      ),
  });

  const materialOptions = useMemo(
    () =>
      materials
        .filter((item) => item.is_active)
        .map((item) => ({
          value: item.id,
          label: `${item.name}${item.sku ? ` (${item.sku})` : ""}`,
        })),
    [materials]
  );

  const technicianOptions = useMemo(
    () =>
      technicians.map((technician) => ({
        value: technician.id,
        label: technician.name,
      })),
    [technicians]
  );

  const filteredMaterials = useMemo(
    () =>
      materials.filter((record) => {
        if (
          !matchesText(
            `${record.name} ${record.description || ""} ${record.sku || ""} ${record.unit || ""}`,
            filters.material
          )
        ) {
          return false;
        }
        if (!matchesText(record.sku, filters.sku)) {
          return false;
        }
        return matchesText(record.unit, filters.unit);
      }),
    [filters.material, filters.sku, filters.unit, materials]
  );

  const filteredWarehouse = useMemo(
    () =>
      warehouse.filter((record) => {
        if (!matchesText(`${record.material_name} ${record.material_unit || ""}`, filters.material)) {
          return false;
        }
        if (!matchesText(record.material_unit, filters.unit)) {
          return false;
        }
        if (filters.warehouseState === "LOW" && !record.needs_restock) {
          return false;
        }
        if (filters.warehouseState === "OK" && record.needs_restock) {
          return false;
        }
        return true;
      }),
    [filters.material, filters.unit, filters.warehouseState, warehouse]
  );

  const filteredTechnicianInventory = useMemo(
    () =>
      technicianInventory.filter((record) => {
        if (!matchesText(record.technician_name, filters.technician)) {
          return false;
        }
        if (!matchesText(`${record.material_name} ${record.material_unit || ""}`, filters.material)) {
          return false;
        }
        return matchesText(record.material_unit, filters.unit);
      }),
    [filters.material, filters.technician, filters.unit, technicianInventory]
  );

  const filteredHistory = useMemo(
    () =>
      restockHistory.filter((record) => {
        if (!matchesText(`${record.warehouse_material} ${record.notes || ""}`, filters.material)) {
          return false;
        }
        if (!matchesText(record.restock_type, filters.movement)) {
          return false;
        }
        if (!matchesText(record.performed_by_name, filters.actor)) {
          return false;
        }
        return matchesText(record.notes, filters.notes);
      }),
    [filters.actor, filters.material, filters.movement, filters.notes, restockHistory]
  );

  const inventoryMetrics = useMemo(
    () => ({
      activeMaterials: materials.filter((item) => item.is_active).length,
      warehouseAlerts: warehouse.filter((record) => record.needs_restock).length,
      usableUnits: warehouse.reduce(
        (total, record) => total + Number(record.quantity_usable || 0),
        0
      ),
      techniciansCovered: new Set(
        technicianInventory
          .filter((record) => Number(record.current_quantity || 0) > 0)
          .map((record) => record.technician || record.technician_name)
          .filter(Boolean)
      ).size,
      movementsLogged: restockHistory.length,
    }),
    [materials, restockHistory, technicianInventory, warehouse]
  );

  const lowStockItems = useMemo(
    () =>
      [...warehouse]
        .filter((record) => record.needs_restock)
        .sort((left, right) => getShortage(right) - getShortage(left))
        .slice(0, 6),
    [warehouse]
  );

  const technicianStockSummary = useMemo(() => {
    const grouped = new Map(
      technicians.map((technician) => [
        String(technician.id),
        {
          technician: technician.id,
          technician_name: technician.name,
          totalUnits: 0,
          materialLines: 0,
        },
      ])
    );

    technicianInventory.forEach((record) => {
      const key = String(record.technician);
      const current = grouped.get(key) || {
        technician: record.technician,
        technician_name: record.technician_name,
        totalUnits: 0,
        materialLines: 0,
      };

      const quantity = Number(record.current_quantity || 0);
      current.totalUnits += quantity;
      if (quantity > 0) {
        current.materialLines += 1;
      }
      grouped.set(key, current);
    });

    return [...grouped.values()]
      .sort((left, right) => {
        if (left.totalUnits !== right.totalUnits) {
          return left.totalUnits - right.totalUnits;
        }

        return String(left.technician_name || "").localeCompare(
          String(right.technician_name || "")
        );
      })
      .slice(0, 6);
  }, [technicianInventory, technicians]);

  const selectedWarehouseRecord = useMemo(() => {
    const materialId = warehousePreset?.material ?? watchedWarehouseMaterial;
    return (
      warehouse.find((record) => String(record.material) === String(materialId ?? "")) || null
    );
  }, [warehouse, warehousePreset, watchedWarehouseMaterial]);

  const selectedAssignWarehouseRecord = useMemo(() => {
    const materialId = assignPreset?.material ?? watchedAssignMaterial;
    return (
      warehouse.find((record) => String(record.material) === String(materialId ?? "")) || null
    );
  }, [assignPreset, warehouse, watchedAssignMaterial]);

  const selectedAssignInventoryRecord = useMemo(() => {
    const materialId = assignPreset?.material ?? watchedAssignMaterial;
    const technicianId = assignPreset?.technician ?? watchedAssignTechnician;

    return (
      technicianInventory.find(
        (record) =>
          String(record.material) === String(materialId ?? "") &&
          String(record.technician) === String(technicianId ?? "")
      ) || null
    );
  }, [assignPreset, technicianInventory, watchedAssignMaterial, watchedAssignTechnician]);

  const selectedAssignTechnician = useMemo(() => {
    const technicianId = assignPreset?.technician ?? watchedAssignTechnician;
    return (
      technicians.find((record) => String(record.id) === String(technicianId ?? "")) || null
    );
  }, [assignPreset, technicians, watchedAssignTechnician]);

  const openWarehouseEntry = useCallback(
    (record = null) => {
      setWarehousePreset(record);
      warehouseForm.setFieldsValue({
        material: record?.material || undefined,
        quantity: undefined,
        minimum_threshold: record?.minimum_threshold ?? 10,
        reorder_quantity: record?.reorder_quantity ?? 50,
        notes: "",
      });
      setWarehouseModalOpen(true);
    },
    [warehouseForm]
  );

  const openAssignStock = useCallback(
    (record = null) => {
      setAssignPreset(record);
      assignForm.setFieldsValue({
        technician: record?.technician || undefined,
        material: record?.material || undefined,
        quantity: undefined,
        notes: "",
      });
      setAssignModalOpen(true);
    },
    [assignForm]
  );

  const openWarehouseContextMenu = useCallback(
    (event, record) => {
      openContextMenu({
        event,
        items: [
          {
            key: "receive-stock",
            label: "Registrar entrada a almacén",
            onClick: () => openWarehouseEntry(record),
          },
        ],
      });
    },
    [openContextMenu, openWarehouseEntry]
  );

  const openTechnicianContextMenu = useCallback(
    (event, record) => {
      openContextMenu({
        event,
        items: [
          {
            key: "assign-stock",
            label: "Entregar más material",
            onClick: () => openAssignStock(record),
          },
        ],
      });
    },
    [openAssignStock, openContextMenu]
  );

  const materialColumns = [
    {
      title: "Material",
      key: "name",
      width: 300,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="font-semibold text-[var(--ui-foreground)]">{record.name}</div>
          <div className="line-clamp-2 text-sm ui-text-muted">
            {record.description || "Sin descripción"}
          </div>
        </div>
      ),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 160,
      render: (value) => value || "-",
    },
    {
      title: "Unidad",
      dataIndex: "unit",
      key: "unit",
      width: 140,
    },
    {
      title: "Estado",
      dataIndex: "is_active",
      key: "is_active",
      width: 130,
      render: (value) =>
        value ? <Tag color="green">Activo</Tag> : <Tag color="red">Inactivo</Tag>,
    },
  ];

  const warehouseColumns = [
    {
      title: "Material",
      key: "material_name",
      width: 280,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="font-semibold text-[var(--ui-foreground)]">{record.material_name}</div>
          <div className="text-sm ui-text-muted">{record.material_unit}</div>
        </div>
      ),
    },
    {
      title: "Stock",
      key: "stock",
      width: 220,
      render: (_, record) => (
        <div className="grid gap-1 text-sm">
          <div>Disponible: {record.quantity_available}</div>
          <div className="ui-text-muted">Reservado: {record.quantity_reserved}</div>
          <div className="ui-text-muted">Dañado: {record.quantity_damaged}</div>
        </div>
      ),
    },
    {
      title: "Usable",
      dataIndex: "quantity_usable",
      key: "quantity_usable",
      width: 120,
    },
    {
      title: "Min / recompra",
      key: "thresholds",
      width: 170,
      render: (_, record) => (
        <div className="grid gap-1 text-sm">
          <div>Min: {record.minimum_threshold}</div>
          <div className="ui-text-muted">Recompra: {record.reorder_quantity}</div>
        </div>
      ),
    },
    {
      title: "Estado",
      key: "needs_restock",
      width: 140,
      render: (_, record) => {
        const state = getWarehouseState(record);
        return <Tag color={state.color}>{state.label}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 120,
      align: "right",
      render: (_, record) => (
        <Button
          size="small"
          type={record.needs_restock ? "primary" : "default"}
          onClick={() => openWarehouseEntry(record)}
        >
          Entrada
        </Button>
      ),
    },
  ];

  const technicianColumns = [
    {
      title: "Técnico",
      key: "technician_name",
      width: 240,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="font-semibold text-[var(--ui-foreground)]">
            {record.technician_name}
          </div>
          <div className="text-sm ui-text-muted">
            Actualizado: {formatDateTime(record.updated_at)}
          </div>
        </div>
      ),
    },
    {
      title: "Material",
      key: "material_name",
      width: 240,
      render: (_, record) => (
        <div className="grid gap-1">
          <div>{record.material_name}</div>
          <div className="text-sm ui-text-muted">{record.material_unit}</div>
        </div>
      ),
    },
    {
      title: "Cantidad",
      dataIndex: "current_quantity",
      key: "current_quantity",
      width: 120,
    },
    {
      title: "",
      key: "actions",
      width: 120,
      align: "right",
      render: (_, record) => (
        <Button size="small" onClick={() => openAssignStock(record)}>
          Entregar
        </Button>
      ),
    },
  ];

  const historyColumns = [
    {
      title: "Fecha",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (value) => formatDateTime(value),
    },
    {
      title: "Material",
      dataIndex: "warehouse_material",
      key: "warehouse_material",
      width: 220,
    },
    {
      title: "Tipo",
      dataIndex: "restock_type",
      key: "restock_type",
      width: 140,
      render: (value) => MOVEMENT_LABELS[value] || value,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity_change",
      key: "quantity_change",
      width: 120,
      render: (value) => (
        <span
          className={
            Number(value) >= 0 ? "text-[var(--sk-color-green)]" : "text-[var(--sk-color-yellow)]"
          }
        >
          {Number(value) > 0 ? `+${value}` : value}
        </span>
      ),
    },
    {
      title: "Hecho por",
      dataIndex: "performed_by_name",
      key: "performed_by_name",
      width: 190,
      render: (value) => value || "-",
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
      width: 260,
      render: (value) => <span className="whitespace-normal break-words">{value || "-"}</span>,
    },
  ];

  const searchConfig = useMemo(
    () => ({
      title: "Filtros de almacén",
      values: filters,
      fields: [
        {
          key: "material",
          label: "Material o SKU",
          placeholder: "Nombre, SKU o unidad",
        },
        {
          key: "technician",
          label: "Técnico",
          placeholder: "Nombre del técnico",
        },
        {
          key: "movement",
          label: "Movimiento",
          placeholder: "Compra, ajuste o consumo",
        },
        {
          key: "actor",
          label: "Responsable",
          placeholder: "Quien hizo el movimiento",
        },
        {
          key: "warehouseState",
          label: "Estado de stock",
          type: "select",
          options: [
            { value: "LOW", label: "Bajo o sin stock" },
            { value: "OK", label: "Stock sano" },
          ],
        },
      ],
      onChange: (nextFilters) => setFilters((prev) => ({ ...prev, ...nextFilters })),
      onReset: () =>
        setFilters({
          material: "",
          sku: "",
          unit: "",
          technician: "",
          movement: "",
          actor: "",
          notes: "",
          warehouseState: null,
        }),
      onRefresh: refreshInventoryData,
    }),
    [filters, refreshInventoryData]
  );

  return (
    <PageLayout
      title="Almacén"
      searchConfig={searchConfig}
      topbarOptions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            icon={<PiPlusBold size={16} />}
            onClick={() => {
              materialForm.resetFields();
              setMaterialModalOpen(true);
            }}
          >
            Nuevo material
          </Button>
          <Button icon={<PiArrowDownBold size={16} />} onClick={() => openWarehouseEntry()}>
            Recibir stock
          </Button>
          <Button
            type="primary"
            icon={<PiUsersThreeBold size={16} />}
            onClick={() => openAssignStock()}
          >
            Entregar stock
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <ModuleStatStrip
          badge="Almacén"
          description="Recibe material, detecta faltantes y entrega a técnicos desde una misma mesa de trabajo."
          stats={[
            {
              label: "Alertas",
              value: inventoryMetrics.warehouseAlerts,
              help: inventoryMetrics.warehouseAlerts ? "requieren entrada" : "sin urgencias",
            },
            {
              label: "Usables",
              value: inventoryMetrics.usableUnits,
              help: "unidades listas",
            },
            {
              label: "Técnicos",
              value: inventoryMetrics.techniciansCovered,
              help: "con stock",
            },
            {
              label: "Movimientos",
              value: inventoryMetrics.movementsLogged,
              help: "registrados",
            },
          ]}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Card className="rounded-[28px]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-[var(--ui-foreground)]">
                  Prioridad de reabastecimiento
                </div>
                <div className="mt-1 text-sm ui-text-muted">
                  Lo urgente queda arriba y puedes registrar la entrada desde la misma lista.
                </div>
              </div>
              <Tag color={lowStockItems.length ? "red" : "green"}>
                {lowStockItems.length ? `${lowStockItems.length} urgentes` : "Sin urgencias"}
              </Tag>
            </div>

            <div className="grid gap-3">
              {lowStockItems.length ? (
                lowStockItems.map((record) => {
                  const state = getWarehouseState(record);
                  return (
                    <div
                      key={record.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[var(--ui-foreground)]">
                          {record.material_name}
                        </div>
                        <div className="mt-1 text-sm ui-text-muted">
                          Usable: {record.quantity_usable} - Min: {record.minimum_threshold} -
                          Recompra: {record.reorder_quantity}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag color={state.color}>{state.label}</Tag>
                        <Button size="small" type="primary" onClick={() => openWarehouseEntry(record)}>
                          Entrada
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[22px] border border-dashed border-[var(--ui-border)] px-4 py-6 text-sm ui-text-muted">
                  No hay materiales por debajo del mínimo.
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-[28px]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-[var(--ui-foreground)]">
                  Técnicos a surtir
                </div>
                <div className="mt-1 text-sm ui-text-muted">
                  Los técnicos con menos unidades quedan primero para reponer más rápido.
                </div>
              </div>
              <Tag color="purple">{technicianStockSummary.length} visibles</Tag>
            </div>

            <div className="grid gap-3">
              {technicianStockSummary.length ? (
                technicianStockSummary.map((record) => {
                  const state = getTechnicianState(record.totalUnits);
                  return (
                    <div
                      key={record.technician}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[var(--ui-foreground)]">
                          {record.technician_name}
                        </div>
                        <div className="mt-1 text-sm ui-text-muted">
                          {record.totalUnits} unidades - {record.materialLines} materiales
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag color={state.color}>{state.label}</Tag>
                        <Button
                          size="small"
                          type={record.totalUnits <= 0 ? "primary" : "default"}
                          onClick={() => openAssignStock(record)}
                        >
                          Entregar
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[22px] border border-dashed border-[var(--ui-border)] px-4 py-6 text-sm ui-text-muted">
                  No hay técnicos para revisar en este momento.
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="min-w-0 rounded-[32px] border-[color:color-mix(in_srgb,var(--ui-highlight)_16%,var(--ui-border))]">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                Mesa de almacén
              </div>
              <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                Stock central, entregas y trazabilidad
              </div>
              <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                Primero revisas stock, luego surtido y después movimientos.
              </div>

            </div>
            <Tag color="purple">Operación</Tag>
          </div>

          <Tabs
            defaultActiveKey="warehouse"
            items={[
              {
                key: "catalog",
                label: (
                  <span className="inline-flex items-center gap-2">
                    <PiPackageBold size={16} />
                    <span>Catálogo</span>
                  </span>
                ),
                children: (
                  <div className="grid min-w-0 gap-4">
                    <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                        Base de materiales
                      </div>
                      <div className="mt-2 text-lg font-semibold text-[var(--ui-foreground)]">
                        Todo el catálogo en una tabla compacta
                      </div>
                      <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                        Revisa nombre, SKU, unidad y estado sin perder legibilidad en
                        anchos medios o móviles.
                      </div>
                    </div>

                    <Table
                      rowKey="id"
                      dataSource={filteredMaterials}
                      columns={materialColumns}
                      loading={loadingMaterials}
                      size="small"
                      scroll={{ x: 720 }}
                      pagination={{ pageSize: 8 }}
                    />
                  </div>
                ),
              },
              {
                key: "warehouse",
                label: (
                  <span className="inline-flex items-center gap-2">
                    <PiArrowDownBold size={16} />
                    <span>Almacén</span>
                  </span>
                ),
                children: (
                  <div className="grid min-w-0 gap-4">
                    <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_7%,var(--ui-card))] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                            Stock central
                          </div>
                          <div className="mt-2 text-lg font-semibold text-[var(--ui-foreground)]">
                            Entrada visible y estado por referencia
                          </div>
                          <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                            Cada fila deja clara la acción para recibir stock sin depender del clic derecho.
                          </div>
                        </div>
                        <Tag color={inventoryMetrics.warehouseAlerts ? "red" : "green"}>
                          {inventoryMetrics.warehouseAlerts
                            ? `${inventoryMetrics.warehouseAlerts} por surtir`
                            : "Todo estable"}
                        </Tag>
                      </div>
                    </div>

                    <Table
                      rowKey="id"
                      dataSource={filteredWarehouse}
                      columns={warehouseColumns}
                      loading={loadingWarehouse}
                      size="small"
                      scroll={{ x: 1080 }}
                      onRow={(record) => ({
                        onContextMenu: (event) => openWarehouseContextMenu(event, record),
                        className: record.needs_restock
                          ? "bg-[color:color-mix(in_srgb,var(--ui-highlight)_6%,var(--ui-card))]"
                          : undefined,
                      })}
                      pagination={{ pageSize: 8 }}
                    />
                  </div>
                ),
              },
              {
                key: "technicians",
                label: (
                  <span className="inline-flex items-center gap-2">
                    <PiUsersThreeBold size={16} />
                    <span>Técnicos</span>
                  </span>
                ),
                children: (
                  <div className="grid min-w-0 gap-4">
                    <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                            Inventario en campo
                          </div>
                          <div className="mt-2 text-lg font-semibold text-[var(--ui-foreground)]">
                            Material por técnico
                          </div>
                          <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                            También puedes entregar más material desde el botón de cada fila.
                          </div>
                        </div>
                        <Tag color="purple">{inventoryMetrics.techniciansCovered} con stock</Tag>
                      </div>
                    </div>

                    <Table
                      rowKey="id"
                      dataSource={filteredTechnicianInventory}
                      columns={technicianColumns}
                      loading={loadingInventory}
                      size="small"
                      scroll={{ x: 900 }}
                      onRow={(record) => ({
                        onContextMenu: (event) => openTechnicianContextMenu(event, record),
                      })}
                      pagination={{ pageSize: 8 }}
                    />
                  </div>
                ),
              },
              {
                key: "history",
                label: (
                  <span className="inline-flex items-center gap-2">
                    <PiCheckCircleBold size={16} />
                    <span>Movimientos</span>
                  </span>
                ),
                children: (
                  <div className="grid min-w-0 gap-4">
                    <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                        Trazabilidad
                      </div>
                      <div className="mt-2 text-lg font-semibold text-[var(--ui-foreground)]">
                        Historial de entradas y salidas
                      </div>
                      <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                        Fecha, responsable y notas quedan en una sola vista para revisar rápido.
                      </div>
                    </div>

                    <Table
                      rowKey="id"
                      dataSource={filteredHistory}
                      columns={historyColumns}
                      loading={loadingHistory}
                      size="small"
                      scroll={{ x: 1100 }}
                      pagination={{ pageSize: 8 }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <Modal
        open={materialModalOpen}
        title="Crear material"
        onCancel={() => setMaterialModalOpen(false)}
        onOk={() => materialForm.submit()}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={createMaterialMutation.isPending}
        width={680}
      >
        <Form
          form={materialForm}
          layout="vertical"
          className="grid gap-5"
          onFinish={(values) => createMaterialMutation.mutate(values)}
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Form.Item
              label="Nombre"
              name="name"
              rules={[{ required: true, message: "Ingresa el nombre del material" }]}
            >
              <Input placeholder="Ej. Conector SC/APC" />
            </Form.Item>
            <Form.Item label="SKU" name="sku">
              <Input placeholder="Ej. MAT-019" />
            </Form.Item>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              label="Unidad"
              name="unit"
              rules={[{ required: true, message: "Ingresa la unidad" }]}
            >
              <Input placeholder="Ej. pieza, metro, paquete" />
            </Form.Item>
            <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
              <div className="text-sm font-medium text-[var(--ui-foreground)]">Consejo</div>
              <div className="mt-1 text-sm ui-text-muted">
                Usa nombres cortos y un SKU consistente para buscar rápido en almacén.
              </div>
            </div>
          </div>
          <Form.Item label="Descripción" name="description">
            <Input.TextArea rows={3} placeholder="Descripción opcional" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={warehouseModalOpen}
        title="Registrar entrada a almacén"
        onCancel={() => {
          setWarehouseModalOpen(false);
          setWarehousePreset(null);
        }}
        onOk={() => warehouseForm.submit()}
        okText="Registrar"
        cancelText="Cancelar"
        confirmLoading={receiveStockMutation.isPending}
        width={720}
      >
        <div className="grid gap-4">
          {selectedWarehouseRecord ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Material</div>
                <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                  {selectedWarehouseRecord.material_name}
                </div>
              </div>
              <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Usable</div>
                <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                  {selectedWarehouseRecord.quantity_usable}
                </div>
              </div>
              <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Min / recompra</div>
                <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                  {selectedWarehouseRecord.minimum_threshold} / {selectedWarehouseRecord.reorder_quantity}
                </div>
              </div>
            </div>
          ) : null}

          <Form
            form={warehouseForm}
            layout="vertical"
            className="grid gap-5"
            onFinish={(values) =>
              receiveStockMutation.mutate({
                ...values,
                quantity: Number(values.quantity),
                minimum_threshold: Number(values.minimum_threshold),
                reorder_quantity: Number(values.reorder_quantity),
              })
            }
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
              <Form.Item
                label="Material"
                name="material"
                rules={[{ required: true, message: "Selecciona un material" }]}
              >
                <Select
                  options={materialOptions}
                  placeholder="Selecciona un material"
                  disabled={!!warehousePreset}
                />
              </Form.Item>
              <Form.Item
                label="Cantidad"
                name="quantity"
                rules={[{ required: true, message: "Ingresa la cantidad" }]}
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item
                label="Mínimo"
                name="minimum_threshold"
                rules={[{ required: true, message: "Ingresa el mínimo" }]}
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
              <Form.Item
                label="Punto de recompra"
                name="reorder_quantity"
                rules={[{ required: true, message: "Ingresa la recompra sugerida" }]}
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>
            </div>
            <Form.Item label="Notas" name="notes">
              <Input.TextArea rows={3} placeholder="Compra, entrada manual o ajuste" />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Modal
        open={assignModalOpen}
        title="Entregar material a técnico"
        onCancel={() => {
          setAssignModalOpen(false);
          setAssignPreset(null);
        }}
        onOk={() => assignForm.submit()}
        okText="Entregar"
        cancelText="Cancelar"
        confirmLoading={assignStockMutation.isPending}
        width={760}
      >
        <div className="grid gap-4">
          {(selectedAssignWarehouseRecord || selectedAssignTechnician || selectedAssignInventoryRecord) ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Técnico</div>
                <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                  {selectedAssignTechnician?.name || "Selecciona técnico"}
                </div>
              </div>
              <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Disponible en almacén</div>
                <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                  {selectedAssignWarehouseRecord?.quantity_usable ?? 0}
                </div>
              </div>
              <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Actual del técnico</div>
                <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                  {selectedAssignInventoryRecord?.current_quantity ?? 0}
                </div>
              </div>
            </div>
          ) : null}

          <Form
            form={assignForm}
            layout="vertical"
            className="grid gap-5"
            onFinish={(values) =>
              assignStockMutation.mutate({
                ...values,
                quantity: Number(values.quantity),
              })
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item
                label="Técnico"
                name="technician"
                rules={[{ required: true, message: "Selecciona un técnico" }]}
              >
                <Select
                  options={technicianOptions}
                  placeholder="Selecciona un técnico"
                  disabled={!!assignPreset?.technician}
                />
              </Form.Item>
              <Form.Item
                label="Material"
                name="material"
                rules={[{ required: true, message: "Selecciona un material" }]}
              >
                <Select
                  options={materialOptions}
                  placeholder="Selecciona un material"
                  disabled={!!assignPreset?.material}
                />
              </Form.Item>
            </div>
            <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
              <Form.Item
                label="Cantidad"
                name="quantity"
                rules={[{ required: true, message: "Ingresa la cantidad" }]}
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>
              <Form.Item label="Notas" name="notes">
                <Input.TextArea rows={3} placeholder="Entrega para ruta, reposición o ajuste" />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default Inventory;
