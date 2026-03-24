import { useCallback, useMemo, useState } from "react";
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
import AppLogo from "@components/AppLogo";
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
      success("Entrada de almacen registrada");
      setWarehouseModalOpen(false);
      setWarehousePreset(null);
      warehouseForm.resetFields();
      refreshInventoryData();
    },
    onError: (requestError) =>
      error(
        requestError.response?.data?.error ||
          "No se pudo registrar la entrada al almacen"
      ),
  });

  const assignStockMutation = useMutation({
    mutationFn: assignTechnicianInventory,
    onSuccess: () => {
      success("Material entregado al tecnico");
      setAssignModalOpen(false);
      setAssignPreset(null);
      assignForm.resetFields();
      refreshInventoryData();
    },
    onError: (requestError) =>
      error(
        requestError.response?.data?.error ||
          "No se pudo asignar material al tecnico"
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
        if (!matchesText(`${record.name} ${record.description || ""}`, filters.material)) {
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
        if (!matchesText(record.material_name, filters.material)) {
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
        if (!matchesText(record.material_name, filters.material)) {
          return false;
        }
        return matchesText(record.material_unit, filters.unit);
      }),
    [filters.material, filters.technician, filters.unit, technicianInventory]
  );

  const filteredHistory = useMemo(
    () =>
      restockHistory.filter((record) => {
        if (!matchesText(record.warehouse_material, filters.material)) {
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
            label: "Registrar entrada a almacen",
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
            label: "Entregar mas material",
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
      dataIndex: "name",
      key: "name",
      width: 240,
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
      dataIndex: "material_name",
      key: "material_name",
      width: 240,
    },
    {
      title: "Disponible",
      dataIndex: "quantity_available",
      key: "quantity_available",
      width: 120,
    },
    {
      title: "Reservado",
      dataIndex: "quantity_reserved",
      key: "quantity_reserved",
      width: 120,
    },
    {
      title: "Usable",
      dataIndex: "quantity_usable",
      key: "quantity_usable",
      width: 120,
    },
    {
      title: "Minimo",
      dataIndex: "minimum_threshold",
      key: "minimum_threshold",
      width: 120,
    },
    {
      title: "Estado",
      key: "needs_restock",
      width: 140,
      render: (_, record) =>
        record.needs_restock ? (
          <Tag color="red">Reabastecer</Tag>
        ) : (
          <Tag color="green">OK</Tag>
        ),
    },
  ];

  const technicianColumns = [
    {
      title: "Tecnico",
      dataIndex: "technician_name",
      key: "technician_name",
      width: 220,
    },
    {
      title: "Material",
      dataIndex: "material_name",
      key: "material_name",
      width: 220,
    },
    {
      title: "Cantidad",
      dataIndex: "current_quantity",
      key: "current_quantity",
      width: 120,
    },
  ];

  const historyColumns = [
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
    },
    {
      title: "Cantidad",
      dataIndex: "quantity_change",
      key: "quantity_change",
      width: 120,
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
      title: "Filtros de inventario",
      description: "Usa un campo por dato en lugar de una busqueda general.",
      values: filters,
      fields: [
        {
          key: "sku",
          label: "SKU",
          placeholder: "Codigo del material",
        },
        {
          key: "unit",
          label: "Unidad",
          placeholder: "Unidad de medida",
        },
        {
          key: "technician",
          label: "Tecnico",
          placeholder: "Nombre del tecnico",
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
          key: "notes",
          label: "Notas",
          placeholder: "Comentario o detalle",
          fullWidth: true,
        },
        {
          key: "warehouseState",
          label: "Estado de almacen",
          type: "select",
          options: [
            { value: "LOW", label: "Reabastecer" },
            { value: "OK", label: "Stock saludable" },
          ],
        },
        {
          key: "material",
          label: "Material",
          placeholder: "Material, tecnico, movimiento o nota",
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
      title="Inventario y abastecimiento"
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
            Entrada a almacen
          </Button>
          <Button
            type="primary"
            icon={<PiUsersThreeBold size={16} />}
            onClick={() => openAssignStock()}
          >
            Asignar a tecnico
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        <Card className="relative min-w-0 overflow-hidden rounded-[36px] border-[color:color-mix(in_srgb,var(--ui-highlight)_24%,var(--ui-border))] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--ui-card)_74%,transparent),color-mix(in_srgb,var(--ui-highlight)_12%,var(--ui-card)))]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--ui-highlight)_20%,transparent),transparent_36%)]" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[color:color-mix(in_srgb,var(--ui-highlight)_16%,transparent)] blur-3xl" />

          <div className="relative grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
            <div className="min-w-0">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[color:color-mix(in_srgb,var(--ui-highlight)_24%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-card)_84%,transparent)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ui-muted-foreground)] shadow-[var(--ui-shadow-soft)]">
                <AppLogo compact showWordmark={false} iconSize={28} />
                Inventario
              </div>

              <h2 className="mt-5 max-w-4xl text-[clamp(2rem,4.8vw,4rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[var(--ui-foreground)]">
                Inventario y abastecimiento
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ui-muted-foreground)] md:text-base">
                Catalogo, stock central, entregas y movimientos.
              </p>



              <div className="mt-5 flex flex-wrap gap-2">
                <Tag color="purple">{inventoryMetrics.activeMaterials} materiales activos</Tag>
                <Tag color={inventoryMetrics.warehouseAlerts ? "red" : "green"}>
                  {inventoryMetrics.warehouseAlerts
                    ? `${inventoryMetrics.warehouseAlerts} alertas de stock`
                    : "Stock saludable"}
                </Tag>
                <Tag color="blue">{inventoryMetrics.movementsLogged} movimientos registrados</Tag>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[28px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_22%,var(--ui-border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-highlight)_10%,var(--ui-card)),color-mix(in_srgb,var(--ui-card)_96%,transparent))] p-5 shadow-[var(--ui-shadow-soft)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  Pulso de almacen
                </div>
                <div className="mt-3 text-2xl font-semibold text-[var(--ui-foreground)]">
                  {inventoryMetrics.usableUnits} unidades utilizables
                </div>
                <div className="mt-2 text-sm text-[var(--ui-muted-foreground)]">
                  {inventoryMetrics.techniciansCovered} tecnicos tienen material asignado y{" "}
                  {inventoryMetrics.warehouseAlerts} referencias exigen revision.
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--ui-secondary)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#E879F9_0%,#8B5CF6_55%,#5B21B6_100%)]"
                    style={{
                      width: `${Math.max(
                        14,
                        Math.min(
                          100,
                          inventoryMetrics.activeMaterials
                            ? ((inventoryMetrics.activeMaterials - inventoryMetrics.warehouseAlerts) /
                                inventoryMetrics.activeMaterials) *
                              100
                            : 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="min-w-0 rounded-[28px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  Catalogo
                </div>
                <div className="mt-3 text-3xl font-semibold text-[var(--ui-foreground)]">
                  {filteredMaterials.length}
                </div>
                <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                  materiales visibles
                </div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-highlight)_20%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] text-[var(--ui-highlight)]">
                <PiPackageBold size={22} />
              </div>
            </div>
          </Card>

          <Card className="min-w-0 rounded-[28px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  Almacen
                </div>
                <div className="mt-3 text-3xl font-semibold text-[var(--ui-foreground)]">
                  {filteredWarehouse.length}
                </div>
                <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                  referencias visibles
                </div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-highlight)_20%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] text-[var(--ui-highlight)]">
                <PiArrowDownBold size={22} />
              </div>
            </div>
          </Card>

          <Card className="min-w-0 rounded-[28px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  Tecnicos
                </div>
                <div className="mt-3 text-3xl font-semibold text-[var(--ui-foreground)]">
                  {filteredTechnicianInventory.length}
                </div>
                <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                  asignaciones visibles
                </div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-highlight)_20%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] text-[var(--ui-highlight)]">
                <PiUsersThreeBold size={22} />
              </div>
            </div>
          </Card>

          <Card className="min-w-0 rounded-[28px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  Movimientos
                </div>
                <div className="mt-3 text-3xl font-semibold text-[var(--ui-foreground)]">
                  {filteredHistory.length}
                </div>
                <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                  eventos filtrados
                </div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-highlight)_20%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] text-[var(--ui-highlight)]">
                <PiClockCountdownBold size={22} />
              </div>
            </div>
          </Card>
        </div>

        <Card className="min-w-0 rounded-[32px] border-[color:color-mix(in_srgb,var(--ui-highlight)_16%,var(--ui-border))]">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                Vista modular
              </div>
              <div className="mt-2 text-xl font-semibold text-[var(--ui-foreground)]">
                Catalogo, almacen, entregas y trazabilidad
              </div>
              <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                Consulta rapida por catalogo, stock, entregas y movimientos.
              </div>

            </div>
            <Tag color="purple">Operacion</Tag>
          </div>

          <Tabs
            defaultActiveKey="warehouse"
            items={[
              {
                key: "catalog",
                label: (
                  <span className="inline-flex items-center gap-2">
                    <PiPackageBold size={16} />
                    <span>Catalogo</span>
                  </span>
                ),
                children: (
                  <div className="grid min-w-0 gap-4">
                    <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                        Base de materiales
                      </div>
                      <div className="mt-2 text-lg font-semibold text-[var(--ui-foreground)]">
                        Todo el catalogo en una tabla compacta
                      </div>
                      <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                        Revisa nombre, SKU, unidad y estado sin perder legibilidad en
                        anchos medios o moviles.
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
                    <span>Almacen</span>
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
                            Entrada rapida y estado por referencia
                          </div>
                          <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                            Clic derecho en una fila para registrar nuevas entradas sobre
                            ese material.
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
                      scroll={{ x: 960 }}
                      onRow={(record) => ({
                        onContextMenu: (event) => openWarehouseContextMenu(event, record),
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
                    <span>Tecnicos</span>
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
                            Material asignado por persona
                          </div>
                          <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                            Clic derecho en una fila para entregar mas material al tecnico.
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
                      scroll={{ x: 760 }}
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
                        Historial legible de entradas, entregas y ajustes
                      </div>
                      <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                        La columna de notas rompe mejor el texto y la tabla conserva scroll
                        horizontal cuando hace falta.
                      </div>
                    </div>

                    <Table
                      rowKey="id"
                      dataSource={filteredHistory}
                      columns={historyColumns}
                      loading={loadingHistory}
                      size="small"
                      scroll={{ x: 930 }}
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
      >
        <Card className="rounded-xl">
          <Form
            form={materialForm}
            layout="vertical"
            onFinish={(values) => createMaterialMutation.mutate(values)}
          >
            <Form.Item
              label="Nombre"
              name="name"
              rules={[{ required: true, message: "Ingresa el nombre del material" }]}
            >
              <Input placeholder="Ej. Conector SC/APC" />
            </Form.Item>
            <Form.Item label="Descripcion" name="description">
              <Input.TextArea rows={3} placeholder="Descripcion opcional" />
            </Form.Item>
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item
                label="Unidad"
                name="unit"
                rules={[{ required: true, message: "Ingresa la unidad" }]}
              >
                <Input placeholder="Ej. pieza, metro, paquete" />
              </Form.Item>
              <Form.Item label="SKU" name="sku">
                <Input placeholder="Ej. MAT-019" />
              </Form.Item>
            </div>
          </Form>
        </Card>
      </Modal>

      <Modal
        open={warehouseModalOpen}
        title="Registrar entrada a almacen"
        onCancel={() => {
          setWarehouseModalOpen(false);
          setWarehousePreset(null);
        }}
        onOk={() => warehouseForm.submit()}
        okText="Registrar"
        cancelText="Cancelar"
        confirmLoading={receiveStockMutation.isPending}
      >
        <Card className="rounded-xl">
          <Form
            form={warehouseForm}
            layout="vertical"
            onFinish={(values) =>
              receiveStockMutation.mutate({
                ...values,
                quantity: Number(values.quantity),
                minimum_threshold: Number(values.minimum_threshold),
                reorder_quantity: Number(values.reorder_quantity),
              })
            }
          >
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
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item
                label="Cantidad"
                name="quantity"
                rules={[{ required: true, message: "Ingresa la cantidad" }]}
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>
              <Form.Item
                label="Minimo"
                name="minimum_threshold"
                rules={[{ required: true, message: "Ingresa el minimo" }]}
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </div>
            <Form.Item
              label="Punto de recompra"
              name="reorder_quantity"
              rules={[{ required: true, message: "Ingresa la recompra sugerida" }]}
            >
              <InputNumber className="w-full" min={1} />
            </Form.Item>
            <Form.Item label="Notas" name="notes">
              <Input.TextArea rows={2} placeholder="Compra, entrada manual, ajuste, etc." />
            </Form.Item>
          </Form>
        </Card>
      </Modal>

      <Modal
        open={assignModalOpen}
        title="Asignar material a tecnico"
        onCancel={() => {
          setAssignModalOpen(false);
          setAssignPreset(null);
        }}
        onOk={() => assignForm.submit()}
        okText="Asignar"
        cancelText="Cancelar"
        confirmLoading={assignStockMutation.isPending}
      >
        <Card className="rounded-xl">
          <Form
            form={assignForm}
            layout="vertical"
            onFinish={(values) =>
              assignStockMutation.mutate({
                ...values,
                quantity: Number(values.quantity),
              })
            }
          >
            <Form.Item
              label="Tecnico"
              name="technician"
              rules={[{ required: true, message: "Selecciona un tecnico" }]}
            >
              <Select
                options={technicianOptions}
                placeholder="Selecciona un tecnico"
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
            <Form.Item
              label="Cantidad"
              name="quantity"
              rules={[{ required: true, message: "Ingresa la cantidad" }]}
            >
              <InputNumber className="w-full" min={1} />
            </Form.Item>
            <Form.Item label="Notas" name="notes">
              <Input.TextArea rows={2} placeholder="Entrega para ordenes del dia, reposicion, etc." />
            </Form.Item>
          </Form>
        </Card>
      </Modal>
    </PageLayout>
  );
};

export default Inventory;
