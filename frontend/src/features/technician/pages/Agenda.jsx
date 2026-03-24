import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Select,
  Steps,
  Tabs,
  Tag,
} from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import ModuleOverview from "@components/ModuleOverview";
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
import { createUsedMaterial, getUsedMaterials } from "@api/materialApprovalService";
import { useMessage } from "@context/MessageProvider";
import queryClient from "@lib/queryClient";
import SignaturePad from "@features/technician/components/SignaturePad";
import StaticLocationMap from "@/common/components/location/StaticLocationMap";
import { matchesText } from "@/lib/filtering";

const STATUS_OPTIONS = [
  { value: "ASSIGNED", label: "Asignada" },
  { value: "IN_TRANSIT", label: "En ruta" },
  { value: "IN_SERVICE", label: "En servicio" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
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

const MATERIAL_STATUS_LABELS = {
  PENDING: "En revision",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  ADJUSTED: "Ajustado",
};

const MATERIAL_STATUS_COLORS = {
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
  ADJUSTED: "blue",
};

const INITIAL_SIGNATURE_DATA = {
  signer_name: "",
  signer_phone: "",
  signer_email: "",
};

const SERVICE_STEPS = [
  { key: "assigned", title: "Revisa la orden" },
  { key: "transit", title: "Ve al sitio" },
  { key: "service", title: "Trabaja y documenta" },
  { key: "complete", title: "Cierra el servicio" },
];

const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED"];

function getServiceStepIndex(status) {
  if (status === "COMPLETED") return 3;
  if (status === "IN_SERVICE") return 2;
  if (status === "IN_TRANSIT") return 1;
  return 0;
}

function formatMoment(value) {
  if (!value) {
    return "Sin fecha";
  }

  return dayjs(value).format("DD/MM/YYYY HH:mm");
}

const Agenda = () => {
  const { success, error } = useMessage();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [filters, setFilters] = useState({
    customer: "",
    address: "",
    priority: "",
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
      success("Material enviado a solicitudes");
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
      if (!matchesText(record.customer_name, filters.customer)) {
        return false;
      }
      if (!matchesText(record.service_location_address, filters.address)) {
        return false;
      }
      return matchesText(record.priority, filters.priority);
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
      title: "Filtros de agenda",
      description: "Busca por cliente, direccion, prioridad y estado sin mezclar todo en una sola lupa.",
      values: filters,
      fields: [
        {
          key: "customer",
          label: "Cliente",
          placeholder: "Nombre del cliente",
        },
        {
          key: "address",
          label: "Direccion",
          placeholder: "Direccion del servicio",
        },
        {
          key: "priority",
          label: "Prioridad",
          placeholder: "Urgente, alta o media",
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
          customer: "",
          address: "",
          priority: "",
          status: null,
        }),
    }),
    [filters]
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
    if (!canCaptureEvidence) {
      error("Solo puedes subir evidencia cuando la orden esta en servicio");
      return;
    }
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
    if (!canCaptureSignature) {
      error("La firma solo se puede capturar mientras la orden esta en servicio");
      return;
    }
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

  const handleSignaturePadChange = useCallback(({ file }) => {
    setSignatureFile(file);
  }, []);

  const selectedLatitude =
    selectedWorkOrder?.customer_latitude != null
      ? Number(selectedWorkOrder.customer_latitude)
      : null;
  const selectedLongitude =
    selectedWorkOrder?.customer_longitude != null
      ? Number(selectedWorkOrder.customer_longitude)
      : null;
  const hasOrderLocation = selectedLatitude != null && selectedLongitude != null;
  const mapUrl = hasOrderLocation
    ? `https://www.openstreetmap.org/?mlat=${selectedLatitude}&mlon=${selectedLongitude}#map=16/${selectedLatitude}/${selectedLongitude}`
    : null;
  const selectedStatus = selectedWorkOrder?.status ?? null;
  const isClosedOrder = TERMINAL_STATUSES.includes(selectedStatus);
  const canCaptureEvidence = selectedStatus === "IN_SERVICE";
  const canCaptureSignature =
    selectedStatus === "IN_SERVICE" && !selectedWorkOrder?.signature;
  const canRequestMaterials = selectedStatus === "IN_SERVICE";
  const readOnlyOrderMessage =
    selectedStatus === "COMPLETED"
      ? "La orden ya esta completada. Solo puedes consultar lo que ya quedo guardado."
      : selectedStatus === "CANCELLED"
        ? "La orden fue cancelada. Ya no admite evidencia, firma ni solicitudes."
        : "Estas acciones se habilitan cuando marques llegada y la orden pase a En servicio.";

  const overviewTab = selectedWorkOrder ? (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <Card className="rounded-[28px]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-semibold">Resumen del servicio</div>
            <div className="text-xs ui-text-muted">
              Datos operativos y checklist para saber exactamente en que etapa vas.
            </div>
          </div>
          <Tag color={STATUS_COLORS[selectedWorkOrder.status] || "default"}>
            {STATUS_LABELS[selectedWorkOrder.status] || selectedWorkOrder.status}
          </Tag>
        </div>

        <Steps current={getServiceStepIndex(selectedWorkOrder.status)} items={SERVICE_STEPS} />

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl ui-bg-soft p-4">
            <div className="text-xs ui-text-muted">Telefono</div>
            <div className="mt-1 font-medium">
              {selectedWorkOrder.customer_phone || "Sin dato"}
            </div>
          </div>
          <div className="rounded-2xl ui-bg-soft p-4">
            <div className="text-xs ui-text-muted">Firma</div>
            <div className="mt-1 font-medium">
              {selectedWorkOrder.signature ? "Lista" : "Pendiente"}
            </div>
          </div>
          <div className="rounded-2xl ui-bg-soft p-4">
            <div className="text-xs ui-text-muted">Evidencias</div>
            <div className="mt-1 font-medium">
              {selectedWorkOrder.evidences?.length || 0}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border ui-border-subtle p-4">
          <div className="mb-2 font-semibold">Notas del trabajo</div>
          <div className="text-sm text-[var(--ui-muted-foreground)]">
            {selectedWorkOrder.notes || "Sin notas registradas"}
          </div>
        </div>
      </Card>

      <Card className="rounded-[28px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Mapa del servicio</div>
            <div className="text-xs ui-text-muted">
              La ubicacion queda visible para que no trabajes a ciegas.
            </div>
          </div>
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-[var(--ui-foreground)] underline-offset-4 transition hover:underline"
            >
              Abrir mapa
            </a>
          ) : null}
        </div>

        {hasOrderLocation ? (
          <div className="overflow-hidden rounded-[24px] border border-[var(--ui-border)]">
            <StaticLocationMap
              latitude={selectedLatitude}
              longitude={selectedLongitude}
              address={selectedWorkOrder.service_location_address}
              className="h-[320px]"
            />
          </div>
        ) : (
          <Empty description="Esta orden no tiene coordenadas para mostrar en el mapa." />
        )}

        <div className="mt-4 rounded-2xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-secondary)] px-4 py-3 text-sm text-[var(--ui-muted-foreground)]">
          {selectedWorkOrder.service_location_address || "Sin direccion registrada"}
        </div>
      </Card>
    </div>
  ) : (
    <Card className="rounded-[28px]">
      <Empty description="Selecciona una orden para ver el flujo del servicio." />
    </Card>
  );

  const evidenceTab = selectedWorkOrder ? (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
      <Card className="rounded-[28px]">
        <div className="mb-4 flex items-center gap-2">
          <PiCameraBold size={18} />
          <div className="font-semibold">
            {canCaptureEvidence ? "Cargar evidencia nueva" : "Captura de evidencia"}
          </div>
        </div>

        <div className="grid gap-4">
          {canCaptureEvidence ? (
            <>
              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleEvidenceSelection}
              />

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => evidenceInputRef.current?.click()}>
                  Seleccionar fotos
                </Button>
                <Button onClick={clearEvidenceSelection} disabled={!evidenceFiles.length}>
                  Limpiar seleccion
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
                <div className="rounded-2xl border border-dashed border-[var(--ui-border)] px-4 py-5 text-sm text-[var(--ui-muted-foreground)]">
                  Selecciona fotos para enviarlas al expediente del trabajo.
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border ui-border-subtle bg-[var(--ui-secondary)] px-4 py-4 text-sm text-[var(--ui-muted-foreground)]">
              {readOnlyOrderMessage}
            </div>
          )}
        </div>
      </Card>

      <Card className="rounded-[28px]">
        <div className="mb-4 font-semibold">Evidencia ya guardada</div>
        {selectedWorkOrder.evidences?.length ? (
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
        ) : (
          <Empty description="Aun no hay evidencias guardadas para esta orden." />
        )}
      </Card>
    </div>
  ) : (
    <Card className="rounded-[28px]">
      <Empty description="Selecciona una orden para gestionar evidencia." />
    </Card>
  );

  const signatureTab = selectedWorkOrder ? (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
      <Card className="rounded-[28px]">
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
        ) : !canCaptureSignature ? (
          <div className="rounded-2xl border ui-border-subtle bg-[var(--ui-secondary)] px-4 py-4 text-sm text-[var(--ui-muted-foreground)]">
            {readOnlyOrderMessage}
          </div>
        ) : (
          <div className="grid max-w-2xl gap-3 md:grid-cols-2">
            <Input
              className="md:col-span-2"
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
              placeholder="Telefono"
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
            <div className="md:col-span-2">
              <SignaturePad
                resetToken={signatureResetToken}
                onChange={handleSignaturePadChange}
              />
            </div>
            <Button
              className="md:col-span-2"
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

      <Card className="rounded-[28px]">
        <div className="mb-4 font-semibold">Checklist antes de cerrar</div>
        <div className="grid gap-3 text-sm text-[var(--ui-muted-foreground)]">
          <div className="rounded-2xl border ui-border-subtle p-4">
            1. Confirma que el cliente ya reviso el trabajo terminado.
          </div>
          <div className="rounded-2xl border ui-border-subtle p-4">
            2. Completa nombre, telefono o correo para dejar trazabilidad.
          </div>
          <div className="rounded-2xl border ui-border-subtle p-4">
            3. Dibuja una firma continua y guardala antes de cerrar la orden.
          </div>
        </div>
      </Card>
    </div>
  ) : (
    <Card className="rounded-[28px]">
      <Empty description="Selecciona una orden para capturar la firma." />
    </Card>
  );

  const materialsTab = (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
      <Card className="rounded-[28px]">
        <div className="mb-4 flex items-center gap-2">
          <PiPackageBold size={18} />
          <div>
            <div className="font-semibold">Solicitar revision de material</div>
            <div className="text-xs ui-text-muted">
              Cada consumo se descuenta de tu inventario y queda visible en solicitudes.
            </div>
          </div>
        </div>

        {selectedWorkOrder ? (
          canRequestMaterials ? (
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
                disabled={!materialOptions.length}
              >
                Enviar a solicitudes
              </Button>
            </Form>
          ) : (
            <div className="rounded-2xl border ui-border-subtle bg-[var(--ui-secondary)] px-4 py-4 text-sm text-[var(--ui-muted-foreground)]">
              {readOnlyOrderMessage}
            </div>
          )
        ) : (
          <Empty description="Selecciona una orden para registrar material." />
        )}
      </Card>

      <div className="grid gap-6">
        <Card className="rounded-[28px]">
          <div className="mb-4 font-semibold">Solicitudes enviadas</div>
          {selectedWorkOrder ? (
            usedMaterials.length ? (
              <div className="grid gap-3">
                {usedMaterials.map((item) => {
                  const status = item.approval_status || "PENDING";
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border ui-border-subtle p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{item.material_name}</div>
                          <div className="text-sm ui-text-muted">
                            Cantidad: {item.quantity_used} {item.material_unit || ""}
                          </div>
                        </div>
                        <Tag color={MATERIAL_STATUS_COLORS[status] || "default"}>
                          {MATERIAL_STATUS_LABELS[status] || status}
                        </Tag>
                      </div>
                      <div className="mt-3 text-xs ui-text-muted">
                        Enviado: {formatMoment(item.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description="Todavia no has enviado materiales a revision en esta orden." />
            )
          ) : (
            <Empty description="Selecciona una orden para ver sus solicitudes." />
          )}
        </Card>

        <Card className="rounded-[28px]">
          <div className="mb-4 font-semibold">Mi inventario disponible</div>
          <div className="grid gap-3">
            {technicianInventory.length ? (
              technicianInventory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border ui-border-subtle p-4"
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
    </div>
  );

  return (
    <PageLayout
      title="Mi agenda"
      searchConfig={searchConfig}
    >
      <div className="grid gap-6">
        <ModuleOverview
          badge="Agenda"
          title="Mi agenda"
          subtitle="Ruta, evidencias y material."
          tags={["Ruta", "Evidencias", "Material"]}
          stats={[
            {
              label: "Por iniciar",
              value: metrics.assigned,
              help: "asignadas",
            },
            {
              label: "En ruta",
              value: metrics.inTransit,
              help: "desplazamiento",
            },
            {
              label: "En servicio",
              value: metrics.inService,
              help: "trabajo activo",
            },
            {
              label: "Completadas",
              value: metrics.completed,
              help: "cerradas",
            },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-[28px]">
            <div className="text-sm ui-text-muted">Por iniciar</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.assigned}</div>
          </Card>
          <Card className="rounded-[28px]">
            <div className="text-sm ui-text-muted">En ruta</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.inTransit}</div>
          </Card>
          <Card className="rounded-[28px]">
            <div className="text-sm ui-text-muted">En servicio</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.inService}</div>
          </Card>
          <Card className="rounded-[28px]">
            <div className="text-sm ui-text-muted">Completadas</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.completed}</div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[23rem_minmax(0,1fr)] xl:items-start">
          <Card className="self-start rounded-[28px]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Ordenes asignadas</div>
                <div className="text-xs ui-text-muted">
                  Selecciona una orden y sigue el flujo por pasos.
                </div>
              </div>
              {selectedOrderId ? (
                <Button size="small" onClick={() => setSelectedOrderId(null)}>
                  Quitar seleccion
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3">
              {!filteredOrders.length && !isLoading ? (
                <Empty description="Sin ordenes asignadas" />
              ) : null}

              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`rounded-[24px] border p-4 text-left transition ${
                    selectedOrderId === order.id
                      ? "ui-border-default ui-bg-elevated"
                      : "ui-border-subtle ui-bg-surface"
                  }`}
                  onClick={() =>
                    setSelectedOrderId((currentValue) =>
                      currentValue === order.id ? null : order.id
                    )
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{order.customer_name}</div>
                      <div className="mt-1 text-xs ui-text-muted">
                        {order.service_location_address || "Sin direccion"}
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

          <div className="min-w-0 grid gap-6">
            <Card className="rounded-[28px]" loading={loadingDetail}>
              {selectedWorkOrder ? (
                <div className="grid gap-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs ui-text-muted">Servicio seleccionado</div>
                      <div className="text-2xl font-semibold text-[var(--ui-foreground)]">
                        {selectedWorkOrder.customer_name}
                      </div>
                      <div className="mt-1 text-sm ui-text-muted">
                        {selectedWorkOrder.service_location_address || "Sin direccion"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="small" onClick={() => setSelectedOrderId(null)}>
                        Quitar seleccion
                      </Button>
                      {isClosedOrder ? (
                        <Tag color="default">Solo lectura</Tag>
                      ) : null}
                      <Tag color={STATUS_COLORS[selectedWorkOrder.status] || "default"}>
                        {STATUS_LABELS[selectedWorkOrder.status] || selectedWorkOrder.status}
                      </Tag>
                      <Tag>{selectedWorkOrder.priority}</Tag>
                    </div>
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
                </div>
              ) : (
                <Empty description="Selecciona una orden para comenzar" />
              )}
            </Card>

            <Tabs
              defaultActiveKey="overview"
              items={[
                {
                  key: "overview",
                  label: "Servicio",
                  children: overviewTab,
                },
                {
                  key: "evidence",
                  label: "Evidencia",
                  children: evidenceTab,
                },
                {
                  key: "signature",
                  label: "Firma",
                  children: signatureTab,
                },
                {
                  key: "materials",
                  label: "Solicitudes",
                  children: materialsTab,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Agenda;
