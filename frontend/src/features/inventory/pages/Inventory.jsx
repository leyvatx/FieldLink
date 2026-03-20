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
import { PiArrowDownBold, PiPackageBold, PiPlusBold, PiUsersThreeBold } from "react-icons/pi";
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
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      render: (value) => value || "-",
    },
    {
      title: "Unidad",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "Estado",
      dataIndex: "is_active",
      key: "is_active",
      render: (value) =>
        value ? <Tag color="green">Activo</Tag> : <Tag color="red">Inactivo</Tag>,
    },
  ];

  const warehouseColumns = [
    {
      title: "Material",
      dataIndex: "material_name",
      key: "material_name",
    },
    {
      title: "Disponible",
      dataIndex: "quantity_available",
      key: "quantity_available",
    },
    {
      title: "Reservado",
      dataIndex: "quantity_reserved",
      key: "quantity_reserved",
    },
    {
      title: "Usable",
      dataIndex: "quantity_usable",
      key: "quantity_usable",
    },
    {
      title: "Mínimo",
      dataIndex: "minimum_threshold",
      key: "minimum_threshold",
    },
    {
      title: "Estado",
      key: "needs_restock",
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
      title: "Técnico",
      dataIndex: "technician_name",
      key: "technician_name",
    },
    {
      title: "Material",
      dataIndex: "material_name",
      key: "material_name",
    },
    {
      title: "Cantidad",
      dataIndex: "current_quantity",
      key: "current_quantity",
    },
  ];

  const historyColumns = [
    {
      title: "Material",
      dataIndex: "warehouse_material",
      key: "warehouse_material",
    },
    {
      title: "Tipo",
      dataIndex: "restock_type",
      key: "restock_type",
    },
    {
      title: "Cantidad",
      dataIndex: "quantity_change",
      key: "quantity_change",
    },
    {
      title: "Hecho por",
      dataIndex: "performed_by_name",
      key: "performed_by_name",
      render: (value) => value || "-",
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
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
          placeholder: "Material, técnico, movimiento o nota",
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
        <div className="flex items-center gap-2">
          <Button
            icon={<PiPlusBold size={16} />}
            onClick={() => {
              materialForm.resetFields();
              setMaterialModalOpen(true);
            }}
          >
            Nuevo material
          </Button>
          <Button
            icon={<PiArrowDownBold size={16} />}
            onClick={() => openWarehouseEntry()}
          >
            Entrada a almacén
          </Button>
          <Button
            type="primary"
            icon={<PiUsersThreeBold size={16} />}
            onClick={() => openAssignStock()}
          >
            Asignar a técnico
          </Button>
        </div>
      }
    >
      <Tabs
        items={[
          {
            key: "catalog",
            label: "Catálogo de materiales",
            children: (
              <Table
                rowKey="id"
                dataSource={filteredMaterials}
                columns={materialColumns}
                loading={loadingMaterials}
                pagination={{ pageSize: 8 }}
              />
            ),
          },
          {
            key: "warehouse",
            label: "Almacén central",
            children: (
              <div className="grid gap-3">
                <span className="text-xs ui-text-muted">
                  Clic derecho en una fila para registrar nuevas entradas sobre ese material.
                </span>
                <Table
                  rowKey="id"
                  dataSource={filteredWarehouse}
                  columns={warehouseColumns}
                  loading={loadingWarehouse}
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
            label: "Inventario de técnicos",
            children: (
              <div className="grid gap-3">
                <span className="text-xs ui-text-muted">
                  Clic derecho en una fila para entregar más material al técnico.
                </span>
                <Table
                  rowKey="id"
                  dataSource={filteredTechnicianInventory}
                  columns={technicianColumns}
                  loading={loadingInventory}
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
            label: "Movimientos",
            children: (
              <Table
                rowKey="id"
                dataSource={filteredHistory}
                columns={historyColumns}
                loading={loadingHistory}
                pagination={{ pageSize: 8 }}
              />
            ),
          },
        ]}
      />

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
            <Form.Item label="Descripción" name="description">
              <Input.TextArea rows={3} placeholder="Descripción opcional" />
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
        title="Registrar entrada a almacén"
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
                label="Mínimo"
                name="minimum_threshold"
                rules={[{ required: true, message: "Ingresa el mínimo" }]}
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
        title="Asignar material a técnico"
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
            <Form.Item
              label="Cantidad"
              name="quantity"
              rules={[{ required: true, message: "Ingresa la cantidad" }]}
            >
              <InputNumber className="w-full" min={1} />
            </Form.Item>
            <Form.Item label="Notas" name="notes">
              <Input.TextArea rows={2} placeholder="Entrega para órdenes del día, reposición, etc." />
            </Form.Item>
          </Form>
        </Card>
      </Modal>
    </PageLayout>
  );
};

export default Inventory;
