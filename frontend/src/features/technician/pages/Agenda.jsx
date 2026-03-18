import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Select,
  Tag,
} from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  PiCameraBold,
  PiCheckCircleBold,
  PiMapPinBold,
  PiPackageBold,
  PiPenNibStraightBold,
  PiTruckBold,
} from "react-icons/pi";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  getWorkOrders,
  getWorkOrder,
  startTransitWorkOrder,
  arriveWorkOrder,
  completeWorkOrder,
} from "@api/workOrderService";
import { getTechnicianInventory } from "@api/inventoryService";
import { createEvidence, createSignature } from "@api/evidenceService";
import {
  createUsedMaterial,
  getUsedMaterials,
} from "@api/materialApprovalService";
import { useMessage } from "@context/MessageProvider";
import queryClient from "@lib/queryClient";
import SignaturePad from "@features/technician/components/SignaturePad";

const STATUS_OPTIONS = [
  { value: "ASSIGNED", label: "Asignada" },
  { value: "IN_TRANSIT", label: "En ruta" },
  { value: "IN_SERVICE", label: "En servicio" },
  { value: "COMPLETED", label: "Completada" },
];

const STATUS_LABELS = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignada",
  IN_TRANSIT: "En ruta",
  IN_SERVICE: "En servicio",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS = {
  PENDING: "default",
  ASSIGNED: "blue",
  IN_TRANSIT: "cyan",
  IN_SERVICE: "gold",
  COMPLETED: "green",
  CANCELLED: "red",
};

const INITIAL_SIGNATURE_DATA = {
  signer_name: "",
  signer_phone: "",
  signer_email: "",
};

const Agenda = () => {
  const { success, error } = useMessage();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: null,
  });
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureData, setSignatureData] = useState({ ...INITIAL_SIGNATURE_DATA });
  const [signatureResetToken, setSignatureResetToken] = useState(0);
  const evidenceInputRef = useRef(null);
  const [materialForm] = Form.useForm();

  const clearEvidenceSelection = useCallback(() => {
    setEvidenceFiles((previousFiles) => {
      previousFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
      return [];
    });
  }, []);

  const replaceEvidenceSelection = useCallback((files) => {
    setEvidenceFiles((previousFiles) => {
      previousFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
      return files.map((file, index) => ({
        id: `${file.name}-${file.size}-${index}-${Date.now()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    });
  }, []);

  useEffect(
    () => () => {
      clearEvidenceSelection();
    },
    [clearEvidenceSelection]
  );

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ["technician-work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const { data: selectedWorkOrder, isLoading: loadingDetail } = useQuery({
    queryKey: ["technician-work-order", selectedOrderId],
    queryFn: () => getWorkOrder(selectedOrderId),
    enabled: !!selectedOrderId,
  });

  const { data: technicianInventory = [] } = useQuery({
    queryKey: ["technician-inventory", "self"],
    queryFn: () => getTechnicianInventory(),
  });

  const { data: usedMaterials = [] } = useQuery({
    queryKey: ["used-materials", selectedOrderId],
    queryFn: () => getUsedMaterials({ order: selectedOrderId }),
    enabled: !!selectedOrderId,
  });

  const refreshWorkspace = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["technician-work-orders"] });
    queryClient.invalidateQueries({
      queryKey: ["technician-work-order", selectedOrderId],
    });
    queryClient.invalidateQueries({ queryKey: ["used-materials", selectedOrderId] });
    queryClient.invalidateQueries({ queryKey: ["technician-inventory", "self"] });
    queryClient.invalidateQueries({ queryKey: ["work-orders"] });
  }, [selectedOrderId]);

  const startTransitMutation = useMutation({
    mutationFn: startTransitWorkOrder,
    onSuccess: () => {
      success("Viaje iniciado");
      refreshWorkspace();
    },
    onError: () => error("No se pudo iniciar el viaje"),
  });

  const arriveMutation = useMutation({
    mutationFn: arriveWorkOrder,
    onSuccess: () => {
      success("Llegada registrada");
      refreshWorkspace();
    },
    onError: () => error("No se pudo registrar la llegada"),
  });

  const completeMutation = useMutation({
    mutationFn: completeWorkOrder,
    onSuccess: () => {
      success("Servicio completado");
      refreshWorkspace();
    },
    onError: (requestError) =>
      error(
        requestError.response?.data?.error ||
          "No se pudo completar el servicio"
      ),
  });

  const evidenceMutation = useMutation({
    mutationFn: async ({ orderId, files }) =>
      Promise.all(
        files.map((entry) =>
          createEvidence({
            work_order: orderId,
            file: entry.file,
            captured_at: new Date().toISOString(),
          })
        )
      ),
    onSuccess: (response) => {
      success(
        response.length > 1
          ? `${response.length} evidencias subidas`
          : "Evidencia subida"
      );
      clearEvidenceSelection();
      refreshWorkspace();
    },
    onError: () => error("No se pudo subir la evidencia"),
  });

  const signatureMutation = useMutation({
    mutationFn: createSignature,
    onSuccess: () => {
      success("Firma guardada");
      setSignatureFile(null);
      setSignatureData({ ...INITIAL_SIGNATURE_DATA });
      setSignatureResetToken((previous) => previous + 1);
      refreshWorkspace();
    },
    onError: () => error("No se pudo guardar la firma"),
  });

  const materialMutation = useMutation({
    mutationFn: createUsedMaterial,
    onSuccess: () => {
      success("Material registrado");
      materialForm.resetFields();
      refreshWorkspace();
    },
    onError: (requestError) =>
      error(
        requestError.response?.data?.detail ||
          requestError.response?.data?.error ||
          "No se pudo registrar el material"
      ),
  });

  const filteredOrders = useMemo(() => {
    return workOrders.filter((record) => {
      if (filters.status && record.status !== filters.status) {
        return false;
      }

      const search = filters.search.trim().toLowerCase();
      if (!search) {
        return true;
      }

      return [record.customer_name, record.service_location_address, record.priority]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [filters, workOrders]);

  useEffect(() => {
    if (
      selectedOrderId &&
      !filteredOrders.some((order) => order.id === selectedOrderId)
    ) {
      setSelectedOrderId(null);
    }
  }, [filteredOrders, selectedOrderId]);

  useEffect(() => {
    clearEvidenceSelection();
    setSignatureFile(null);
    setSignatureData({ ...INITIAL_SIGNATURE_DATA });
    setSignatureResetToken((previous) => previous + 1);
    materialForm.resetFields();
  }, [clearEvidenceSelection, materialForm, selectedOrderId]);

  const metrics = useMemo(
    () => ({
      assigned: workOrders.filter((order) => order.status === "ASSIGNED").length,
      inTransit: workOrders.filter((order) => order.status === "IN_TRANSIT").length,
      inService: workOrders.filter((order) => order.status === "IN_SERVICE").length,
      completed: workOrders.filter((order) => order.status === "COMPLETED").length,
    }),
    [workOrders]
  );

  const materialOptions = useMemo(
    () =>
      technicianInventory
        .filter((item) => item.current_quantity > 0)
        .map((item) => ({
          value: item.material,
          label: `${item.material_name} (${item.current_quantity})`,
        })),
    [technicianInventory]
  );

  const searchConfig = useMemo(
    () => ({
      title: "Buscar y filtrar agenda",
      values: filters,
      fields: [
        {
          key: "search",
          label: "Buscar",
          placeholder: "Cliente, dirección o prioridad",
        },
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: STATUS_OPTIONS,
        },
      ],
      onChange: (nextFilters) => setFilters((previous) => ({ ...previous, ...nextFilters })),
      onReset: () =>
        setFilters({
          search: "",
          status: null,
        }),
      onRefresh: refreshWorkspace,
    }),
    [filters, refreshWorkspace]
  );

  const handleEvidenceSelection = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    replaceEvidenceSelection(files);
    event.target.value = "";
  };

  const handleEvidenceUpload = () => {
    if (!selectedOrderId || !evidenceFiles.length) {
      error("Selecciona una orden y al menos una imagen");
      return;
    }

    evidenceMutation.mutate({
      orderId: selectedOrderId,
      files: evidenceFiles,
    });
  };

  const handleSignatureUpload = () => {
    if (!selectedOrderId || !signatureFile || !signatureData.signer_name.trim()) {
      error("Completa el nombre y la firma del cliente");
      return;
    }

    signatureMutation.mutate({
      work_order: selectedOrderId,
      image: signatureFile,
      signer_name: signatureData.signer_name.trim(),
      signer_phone: signatureData.signer_phone.trim(),
      signer_email: signatureData.signer_email.trim(),
    });
  };

  return (
    <PageLayout
      title="Mi agenda"
      searchConfig={searchConfig}
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">Por iniciar</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.assigned}</div>
          </Card>
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">En ruta</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.inTransit}</div>
          </Card>
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">En servicio</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.inService}</div>
          </Card>
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">Completadas</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.completed}</div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <Card className="rounded-2xl">
            <div className="mb-4">
              <div className="font-semibold">Órdenes asignadas</div>
              <div className="text-xs ui-text-muted">
                Selecciona una orden para habilitar evidencia, firma y materiales.
              </div>
            </div>
            <div className="grid gap-3">
              {!filteredOrders.length && !isLoading && (
                <Empty description="Sin órdenes asignadas" />
              )}
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedOrderId === order.id
                      ? "ui-border-default ui-bg-elevated"
                      : "ui-border-subtle ui-bg-surface"
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{order.customer_name}</div>
                      <div className="text-xs ui-text-muted">
                        {order.service_location_address || "Sin dirección"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Tag color={STATUS_COLORS[order.status] || "default"}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Tag>
                      <Tag>{order.priority}</Tag>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-2xl" loading={loadingDetail}>
              {selectedWorkOrder ? (
                <div className="grid gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs ui-text-muted">Orden seleccionada</div>
                      <div className="text-xl font-semibold">
                        {selectedWorkOrder.customer_name}
                      </div>
                      <div className="mt-1 text-sm ui-text-muted">
                        {selectedWorkOrder.service_location_address || "Sin dirección"}
                      </div>
                    </div>
                    <Tag color={STATUS_COLORS[selectedWorkOrder.status] || "default"}>
                      {STATUS_LABELS[selectedWorkOrder.status] || selectedWorkOrder.status}
                    </Tag>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <Button
                      icon={<PiTruckBold size={16} />}
                      disabled={selectedWorkOrder.status !== "ASSIGNED"}
                      loading={startTransitMutation.isPending}
                      onClick={() => startTransitMutation.mutate(selectedWorkOrder.id)}
                    >
                      Iniciar viaje
                    </Button>
                    <Button
                      icon={<PiMapPinBold size={16} />}
                      disabled={selectedWorkOrder.status !== "IN_TRANSIT"}
                      loading={arriveMutation.isPending}
                      onClick={() => arriveMutation.mutate(selectedWorkOrder.id)}
                    >
                      Marcar llegada
                    </Button>
                    <Button
                      type="primary"
                      icon={<PiCheckCircleBold size={16} />}
                      disabled={selectedWorkOrder.status !== "IN_SERVICE"}
                      loading={completeMutation.isPending}
                      onClick={() => completeMutation.mutate(selectedWorkOrder.id)}
                    >
                      Completar servicio
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl ui-bg-soft p-4">
                      <div className="text-xs ui-text-muted">Teléfono</div>
                      <div className="mt-1 font-medium">
                        {selectedWorkOrder.customer_phone || "Sin dato"}
                      </div>
                    </div>
                    <div className="rounded-2xl ui-bg-soft p-4">
                      <div className="text-xs ui-text-muted">Firma requerida</div>
                      <div className="mt-1 font-medium">
                        {selectedWorkOrder.signature ? "Lista" : "Pendiente"}
                      </div>
                    </div>
                    <div className="rounded-2xl ui-bg-soft p-4">
                      <div className="text-xs ui-text-muted">Fotos cargadas</div>
                      <div className="mt-1 font-medium">
                        {selectedWorkOrder.evidences?.length || 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="font-semibold">Notas del trabajo</div>
                    <div className="rounded-2xl border ui-border-subtle p-4 text-sm">
                      {selectedWorkOrder.notes || "Sin notas registradas"}
                    </div>
                  </div>
                </div>
              ) : (
                <Empty description="Selecciona una orden para comenzar" />
              )}
            </Card>

            {selectedWorkOrder ? (
              <>
                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl">
                    <div className="mb-4 flex items-center gap-2">
                      <PiCameraBold size={18} />
                      <div className="font-semibold">Evidencia del servicio</div>
                    </div>
                    <input
                      ref={evidenceInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleEvidenceSelection}
                    />
                    <div className="grid gap-4">
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => evidenceInputRef.current?.click()}>
                          Seleccionar fotos
                        </Button>
                        <Button
                          onClick={clearEvidenceSelection}
                          disabled={!evidenceFiles.length}
                        >
                          Limpiar selección
                        </Button>
                        <Button
                          type="primary"
                          loading={evidenceMutation.isPending}
                          disabled={!evidenceFiles.length}
                          onClick={handleEvidenceUpload}
                        >
                          Subir evidencia
                        </Button>
                      </div>

                      {evidenceFiles.length ? (
                        <div className="grid gap-3">
                          <div className="text-xs ui-text-muted">
                            {evidenceFiles.length} archivo(s) listos para subir
                          </div>
                          <Image.PreviewGroup>
                            <div className="grid grid-cols-2 gap-3">
                              {evidenceFiles.map((entry) => (
                                <Image
                                  key={entry.id}
                                  src={entry.previewUrl}
                                  alt={entry.file.name}
                                  className="rounded-xl"
                                />
                              ))}
                            </div>
                          </Image.PreviewGroup>
                        </div>
                      ) : (
                        <div className="text-sm ui-text-muted">
                          Aún no has seleccionado fotos nuevas para esta orden.
                        </div>
                      )}

                      {selectedWorkOrder.evidences?.length ? (
                        <div className="grid gap-3">
                          <div className="text-xs ui-text-muted">
                            Evidencia ya guardada
                          </div>
                          <Image.PreviewGroup>
                            <div className="grid grid-cols-2 gap-3">
                              {selectedWorkOrder.evidences.map((photo) => (
                                <Image
                                  key={photo.id}
                                  src={photo.file}
                                  alt="Evidencia guardada"
                                  className="rounded-xl"
                                />
                              ))}
                            </div>
                          </Image.PreviewGroup>
                        </div>
                      ) : null}
                    </div>
                  </Card>

                  <Card className="rounded-2xl">
                    <div className="mb-4 flex items-center gap-2">
                      <PiPenNibStraightBold size={18} />
                      <div className="font-semibold">Firma del cliente</div>
                    </div>
                    {selectedWorkOrder.signature ? (
                      <div className="grid gap-3">
                        <div className="text-sm">
                          Firmado por <strong>{selectedWorkOrder.signature.signer_name}</strong>
                        </div>
                        <Image
                          src={selectedWorkOrder.signature.image}
                          alt="Firma guardada"
                          className="rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        <Input
                          placeholder="Nombre de quien firma"
                          value={signatureData.signer_name}
                          onChange={(event) =>
                            setSignatureData((previous) => ({
                              ...previous,
                              signer_name: event.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Teléfono"
                          value={signatureData.signer_phone}
                          onChange={(event) =>
                            setSignatureData((previous) => ({
                              ...previous,
                              signer_phone: event.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Correo"
                          value={signatureData.signer_email}
                          onChange={(event) =>
                            setSignatureData((previous) => ({
                              ...previous,
                              signer_email: event.target.value,
                            }))
                          }
                        />
                        <SignaturePad
                          resetToken={signatureResetToken}
                          onChange={({ file }) => setSignatureFile(file)}
                        />
                        <Button
                          type="primary"
                          loading={signatureMutation.isPending}
                          disabled={!signatureFile}
                          onClick={handleSignatureUpload}
                        >
                          Guardar firma
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <Card className="rounded-2xl">
                    <div className="mb-4 flex items-center gap-2">
                      <PiPackageBold size={18} />
                      <div className="font-semibold">Registrar material usado</div>
                    </div>
                    <Form
                      form={materialForm}
                      layout="vertical"
                      onFinish={(values) =>
                        materialMutation.mutate({
                          work_order: selectedOrderId,
                          material: values.material,
                          quantity_used: Number(values.quantity_used),
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
                          placeholder="Material de tu inventario"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Cantidad"
                        name="quantity_used"
                        rules={[{ required: true, message: "Ingresa una cantidad" }]}
                      >
                        <InputNumber className="w-full" min={1} />
                      </Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={materialMutation.isPending}
                        block
                      >
                        Registrar consumo
                      </Button>
                    </Form>

                    <div className="mt-5 grid gap-2">
                      <div className="font-semibold">Materiales ya registrados</div>
                      {usedMaterials.length ? (
                        usedMaterials.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border ui-border-subtle p-3 text-sm"
                          >
                            <div className="font-medium">{item.material_name}</div>
                            <div className="ui-text-muted">
                              Cantidad usada: {item.quantity_used}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm ui-text-muted">
                          Aún no has registrado materiales en esta orden.
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="rounded-2xl">
                    <div className="mb-4 font-semibold">Mi inventario disponible</div>
                    <div className="grid gap-3">
                      {technicianInventory.length ? (
                        technicianInventory.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border ui-border-subtle p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">{item.material_name}</div>
                                <div className="text-xs ui-text-muted">
                                  Unidad: {item.material_unit}
                                </div>
                              </div>
                              <Tag color={item.current_quantity > 0 ? "green" : "red"}>
                                {item.current_quantity}
                              </Tag>
                            </div>
                          </div>
                        ))
                      ) : (
                        <Empty description="Sin inventario asignado" />
                      )}
                    </div>
                  </Card>
                </div>
              </>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <Card className="rounded-2xl">
                  <Empty description="Selecciona una orden para cargar evidencia, firma y materiales" />
                </Card>
                <Card className="rounded-2xl">
                  <div className="mb-4 font-semibold">Mi inventario disponible</div>
                  <div className="grid gap-3">
                    {technicianInventory.length ? (
                      technicianInventory.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border ui-border-subtle p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium">{item.material_name}</div>
                              <div className="text-xs ui-text-muted">
                                Unidad: {item.material_unit}
                              </div>
                            </div>
                            <Tag color={item.current_quantity > 0 ? "green" : "red"}>
                              {item.current_quantity}
                            </Tag>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Empty description="Sin inventario asignado" />
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Agenda;
