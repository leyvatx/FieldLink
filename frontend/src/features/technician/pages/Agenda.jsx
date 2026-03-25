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
import {
  PiArrowSquareOutBold,
  PiCameraBold,
  PiCheckCircleBold,
  PiMapPinBold,
  PiPackageBold,
  PiPenNibStraightBold,
  PiTruckBold,
} from "react-icons/pi";
import ModuleStatStrip from "@components/ModuleStatStrip";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  arriveWorkOrder,
  completeWorkOrder,
  getWorkOrder,
  getWorkOrders,
  startTransitWorkOrder,
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

const PRIORITY_LABELS = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const PRIORITY_RANK = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const MATERIAL_STATUS_LABELS = {
  PENDING: "En revisión",
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
  { key: "assigned", title: "Asignada" },
  { key: "transit", title: "En ruta" },
  { key: "service", title: "En servicio" },
  { key: "complete", title: "Completada" },
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

function sortOrders(left, right) {
  const leftClosed = TERMINAL_STATUSES.includes(left.status);
  const rightClosed = TERMINAL_STATUSES.includes(right.status);
  if (leftClosed !== rightClosed) {
    return Number(leftClosed) - Number(rightClosed);
  }

  const leftWeight =
    left.status === "IN_SERVICE" ? 3 : left.status === "IN_TRANSIT" ? 2 : left.status === "ASSIGNED" ? 1 : 0;
  const rightWeight =
    right.status === "IN_SERVICE" ? 3 : right.status === "IN_TRANSIT" ? 2 : right.status === "ASSIGNED" ? 1 : 0;
  if (rightWeight !== leftWeight) {
    return rightWeight - leftWeight;
  }

  const priorityDiff = (PRIORITY_RANK[right.priority] || 0) - (PRIORITY_RANK[left.priority] || 0);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return String(left.customer_name || "").localeCompare(String(right.customer_name || ""));
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

  const { data: workOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["technician-work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const visibleOrders = useMemo(
    () =>
      [...workOrders]
        .filter((order) => {
          if (filters.status && order.status !== filters.status) {
            return false;
          }
          if (!matchesText(order.customer_name, filters.customer)) {
            return false;
          }
          if (!matchesText(order.service_location_address, filters.address)) {
            return false;
          }
          return matchesText(order.priority, filters.priority);
        })
        .sort(sortOrders),
    [filters, workOrders]
  );

  useEffect(() => {
    if (!visibleOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (!selectedOrderId || !visibleOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(visibleOrders[0].id);
    }
  }, [selectedOrderId, visibleOrders]);

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
    queryClient.invalidateQueries({ queryKey: ["technician-work-order", selectedOrderId] });
    queryClient.invalidateQueries({ queryKey: ["used-materials", selectedOrderId] });
    queryClient.invalidateQueries({ queryKey: ["technician-inventory", "self"] });
    queryClient.invalidateQueries({ queryKey: ["work-orders"] });
  }, [selectedOrderId]);

  const startTransitMutation = useMutation({
    mutationFn: startTransitWorkOrder,
    onSuccess: () => {
      success("Traslado iniciado");
      refreshWorkspace();
    },
    onError: () => error("No se pudo iniciar el traslado"),
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
      error(requestError.response?.data?.error || "No se pudo completar el servicio"),
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
      success(response.length > 1 ? `${response.length} evidencias subidas` : "Evidencia subida");
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
      success("Material enviado a revisión");
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
      title: "Filtrar agenda",
      values: filters,
      fields: [
        {
          key: "customer",
          label: "Cliente",
          placeholder: "Nombre del cliente",
        },
        {
          key: "address",
          label: "Dirección",
          placeholder: "Dirección del servicio",
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
      onChange: (nextFilters) =>
        setFilters((previous) => ({ ...previous, ...nextFilters })),
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

  const selectedStatus = selectedWorkOrder?.status ?? null;
  const isClosedOrder = TERMINAL_STATUSES.includes(selectedStatus);
  const canCaptureEvidence = selectedStatus === "IN_SERVICE";
  const canCaptureSignature =
    selectedStatus === "IN_SERVICE" && !selectedWorkOrder?.signature;
  const canRequestMaterials = selectedStatus === "IN_SERVICE";

  const readOnlyOrderMessage =
    selectedStatus === "COMPLETED"
      ? "La orden ya está completada. Solo puedes consultar lo que quedó guardado."
      : selectedStatus === "CANCELLED"
        ? "La orden fue cancelada. Ya no admite evidencia, firma ni materiales."
        : "Estas acciones se habilitan cuando marques llegada y la orden pase a En servicio.";

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

  const primaryAction = useMemo(() => {
    if (!selectedWorkOrder || isClosedOrder) {
      return null;
    }

    if (selectedStatus === "ASSIGNED") {
      return {
        label: "Iniciar traslado",
        description: "Marca salida y cambia la orden a ruta.",
        icon: <PiTruckBold size={16} />,
        loading: startTransitMutation.isPending,
        onClick: () => startTransitMutation.mutate(selectedWorkOrder.id),
      };
    }

    if (selectedStatus === "IN_TRANSIT") {
      return {
        label: "Marcar llegada",
        description: "Confirma que ya estás en el sitio.",
        icon: <PiMapPinBold size={16} />,
        loading: arriveMutation.isPending,
        onClick: () => arriveMutation.mutate(selectedWorkOrder.id),
      };
    }

    if (selectedStatus === "IN_SERVICE") {
      return {
        label: "Completar servicio",
        description: "Cierra la orden cuando ya terminaste el trabajo.",
        icon: <PiCheckCircleBold size={16} />,
        loading: completeMutation.isPending,
        onClick: () => completeMutation.mutate(selectedWorkOrder.id),
      };
    }

    return null;
  }, [arriveMutation, completeMutation, isClosedOrder, selectedStatus, selectedWorkOrder, startTransitMutation]);

  const selectedStats = selectedWorkOrder
    ? [
        {
          label: "Estado",
          value: STATUS_LABELS[selectedWorkOrder.status] || selectedWorkOrder.status,
          help: selectedWorkOrder.priority
            ? PRIORITY_LABELS[selectedWorkOrder.priority] || selectedWorkOrder.priority
            : "Sin prioridad",
        },
        {
          label: "Evidencias",
          value: selectedWorkOrder.evidences?.length || 0,
          help: "archivos guardados",
        },
        {
          label: "Firma",
          value: selectedWorkOrder.signature ? "Lista" : "Pendiente",
          help: "confirmación del cliente",
        },
        {
          label: "Material",
          value: usedMaterials.length,
          help: "registros enviados",
        },
      ]
    : [];

  const handleEvidenceUpload = () => {
    if (!canCaptureEvidence) {
      error("Solo puedes subir evidencia cuando la orden está en servicio");
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
      error("La firma solo se puede capturar mientras la orden está en servicio");
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

  const serviceTab = selectedWorkOrder ? (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(20rem,0.96fr)]">
      <Card className="rounded-[28px]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-semibold">Paso actual</div>
            <div className="text-sm ui-text-muted">
              Sigue el flujo de la orden sin mezclar acciones de más.
            </div>
          </div>
          <Tag color={STATUS_COLORS[selectedWorkOrder.status] || "default"}>
            {STATUS_LABELS[selectedWorkOrder.status] || selectedWorkOrder.status}
          </Tag>
        </div>

        <Steps current={getServiceStepIndex(selectedWorkOrder.status)} items={SERVICE_STEPS} />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {selectedStats.map((stat) => (
            <div key={stat.label} className="rounded-[22px] ui-bg-soft px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] ui-text-muted">
                {stat.label}
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--ui-foreground)]">
                {stat.value}
              </div>
              <div className="mt-1 text-sm ui-text-muted">{stat.help}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-[var(--ui-border)] p-4">
            <div className="text-xs uppercase tracking-[0.14em] ui-text-muted">
              Datos del servicio
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <div className="ui-text-muted">Cliente</div>
                <div className="mt-1 font-medium text-[var(--ui-foreground)]">
                  {selectedWorkOrder.customer_name}
                </div>
              </div>
              <div>
                <div className="ui-text-muted">Teléfono</div>
                <div className="mt-1 font-medium text-[var(--ui-foreground)]">
                  {selectedWorkOrder.customer_phone || "Sin dato"}
                </div>
              </div>
              <div>
                <div className="ui-text-muted">Dirección</div>
                <div className="mt-1 font-medium text-[var(--ui-foreground)]">
                  {selectedWorkOrder.service_location_address || "Sin dirección"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--ui-border)] p-4">
            <div className="text-xs uppercase tracking-[0.14em] ui-text-muted">
              Notas del trabajo
            </div>
            <div className="mt-4 text-sm leading-6 text-[var(--ui-muted-foreground)]">
              {selectedWorkOrder.notes || "Sin notas registradas para esta orden."}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Ubicación del servicio</div>
              <div className="text-sm ui-text-muted">
                Consulta la ruta antes de salir o al llegar.
              </div>
            </div>
            {mapUrl ? (
              <a href={mapUrl} target="_blank" rel="noreferrer">
                <Button size="small" icon={<PiArrowSquareOutBold size={14} />}>
                  Abrir mapa
                </Button>
              </a>
            ) : null}
          </div>

          {hasOrderLocation ? (
            <div className="overflow-hidden rounded-[24px] border border-[var(--ui-border)]">
              <StaticLocationMap
                latitude={selectedLatitude}
                longitude={selectedLongitude}
                address={selectedWorkOrder.service_location_address}
                className="h-[300px]"
              />
            </div>
          ) : (
            <Empty description="Esta orden no tiene coordenadas para mostrar en el mapa." />
          )}
        </Card>

        <Card className="rounded-[28px]">
          <div className="font-semibold">Qué te falta</div>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-[22px] border border-[var(--ui-border)] p-4">
              Evidencia: {selectedWorkOrder.evidences?.length ? "lista" : "pendiente"}
            </div>
            <div className="rounded-[22px] border border-[var(--ui-border)] p-4">
              Firma: {selectedWorkOrder.signature ? "lista" : "pendiente"}
            </div>
            <div className="rounded-[22px] border border-[var(--ui-border)] p-4">
              Material: {usedMaterials.length ? `${usedMaterials.length} registro(s)` : "sin registro"}
            </div>
          </div>
        </Card>
      </div>
    </div>
  ) : (
    <Card className="rounded-[28px]">
      <Empty description="No hay órdenes visibles con los filtros actuales." />
    </Card>
  );

  const evidenceTab = selectedWorkOrder ? (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
      <Card className="rounded-[28px]">
        <div className="mb-4 flex items-center gap-2">
          <PiCameraBold size={18} />
          <div className="font-semibold">Subir evidencia</div>
        </div>

        {canCaptureEvidence ? (
          <div className="grid gap-4">
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
                Limpiar
              </Button>
              <Button
                type="primary"
                loading={evidenceMutation.isPending}
                disabled={!evidenceFiles.length}
                onClick={handleEvidenceUpload}
              >
                Guardar evidencia
              </Button>
            </div>

            {evidenceFiles.length ? (
              <Image.PreviewGroup>
                <div className="grid gap-3 sm:grid-cols-2">
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
            ) : (
              <div className="rounded-[22px] border border-dashed border-[var(--ui-border)] px-4 py-5 text-sm ui-text-muted">
                Selecciona fotos del trabajo terminado o del avance en sitio.
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[22px] border border-[var(--ui-border)] bg-[var(--ui-secondary)] px-4 py-4 text-sm ui-text-muted">
            {readOnlyOrderMessage}
          </div>
        )}
      </Card>

      <Card className="rounded-[28px]">
        <div className="mb-4 font-semibold">Evidencia guardada</div>
        {selectedWorkOrder.evidences?.length ? (
          <Image.PreviewGroup>
            <div className="grid gap-3 sm:grid-cols-2">
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
          <Empty description="Todavía no hay evidencias guardadas para esta orden." />
        )}
      </Card>
    </div>
  ) : (
    <Card className="rounded-[28px]">
      <Empty description="No hay una orden activa para gestionar evidencia." />
    </Card>
  );

  const signatureTab = selectedWorkOrder ? (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
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
          <div className="rounded-[22px] border border-[var(--ui-border)] bg-[var(--ui-secondary)] px-4 py-4 text-sm ui-text-muted">
            {readOnlyOrderMessage}
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
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
            </div>

            <SignaturePad resetToken={signatureResetToken} onChange={handleSignaturePadChange} />

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

      <Card className="rounded-[28px]">
        <div className="font-semibold">Antes de cerrar</div>
        <div className="mt-4 grid gap-3 text-sm ui-text-muted">
          <div className="rounded-[22px] border border-[var(--ui-border)] p-4">
            1. Confirma que el cliente revisó el trabajo terminado.
          </div>
          <div className="rounded-[22px] border border-[var(--ui-border)] p-4">
            2. Captura nombre y firma para dejar constancia.
          </div>
          <div className="rounded-[22px] border border-[var(--ui-border)] p-4">
            3. Guarda la firma antes de completar la orden.
          </div>
        </div>
      </Card>
    </div>
  ) : (
    <Card className="rounded-[28px]">
      <Empty description="No hay una orden activa para capturar firma." />
    </Card>
  );

  const materialsTab = selectedWorkOrder ? (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card className="rounded-[28px]">
        <div className="mb-4 flex items-center gap-2">
          <PiPackageBold size={18} />
          <div>
            <div className="font-semibold">Registrar material usado</div>
            <div className="text-sm ui-text-muted">
              Solo toma materiales de tu inventario disponible.
            </div>
          </div>
        </div>

        {canRequestMaterials ? (
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
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item
                label="Material"
                name="material"
                className="md:col-span-2"
                rules={[{ required: true, message: "Selecciona un material" }]}
              >
                <Select options={materialOptions} placeholder="Material disponible" />
              </Form.Item>
              <Form.Item
                label="Cantidad"
                name="quantity_used"
                rules={[{ required: true, message: "Ingresa una cantidad" }]}
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>
              <div className="flex items-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={materialMutation.isPending}
                  disabled={!materialOptions.length}
                  block
                >
                  Guardar consumo
                </Button>
              </div>
            </div>
          </Form>
        ) : (
          <div className="rounded-[22px] border border-[var(--ui-border)] bg-[var(--ui-secondary)] px-4 py-4 text-sm ui-text-muted">
            {readOnlyOrderMessage}
          </div>
        )}
      </Card>

      <div className="grid gap-4">
        <Card className="rounded-[28px]">
          <div className="mb-4 font-semibold">Registros enviados</div>
          {usedMaterials.length ? (
            <div className="grid gap-3">
              {usedMaterials.map((item) => {
                const status = item.approval_status || "PENDING";
                return (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-[var(--ui-border)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-[var(--ui-foreground)]">
                          {item.material_name}
                        </div>
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
            <Empty description="Todavía no registras materiales en esta orden." />
          )}
        </Card>

        <Card className="rounded-[28px]">
          <div className="mb-4 font-semibold">Mi inventario</div>
          {technicianInventory.length ? (
            <div className="grid gap-3">
              {technicianInventory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-[var(--ui-border)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-[var(--ui-foreground)]">
                        {item.material_name}
                      </div>
                      <div className="text-xs ui-text-muted">
                        Unidad: {item.material_unit}
                      </div>
                    </div>
                    <Tag color={item.current_quantity > 0 ? "green" : "red"}>
                      {item.current_quantity}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="Sin inventario asignado." />
          )}
        </Card>
      </div>
    </div>
  ) : (
    <Card className="rounded-[28px]">
      <Empty description="No hay una orden activa para registrar materiales." />
    </Card>
  );

  return (
    <PageLayout title="Mi agenda" searchConfig={searchConfig}>
      <div className="grid gap-4">
        <ModuleStatStrip
          badge="Técnico"
          description="Tus órdenes activas, el siguiente paso y el material del servicio en una sola vista."
          stats={[
            { label: "Por iniciar", value: metrics.assigned, help: "asignadas" },
            { label: "En ruta", value: metrics.inTransit, help: "traslados" },
            { label: "En servicio", value: metrics.inService, help: "trabajos activos" },
            { label: "Completadas", value: metrics.completed, help: "cerradas" },
          ]}
        />

        <div className="grid gap-4 2xl:grid-cols-[22rem_minmax(0,1fr)] 2xl:items-start">
          <Card className="self-start rounded-[28px]" loading={loadingOrders}>
            <div className="mb-4">
              <div className="font-semibold">Mis órdenes</div>
              <div className="text-sm ui-text-muted">
                Se muestran primero las que todavía requieren acción.
              </div>
            </div>

            <div className="grid gap-3">
              {!visibleOrders.length && !loadingOrders ? (
                <Empty description="No hay órdenes visibles con los filtros actuales." />
              ) : null}

              {visibleOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`rounded-[24px] border p-4 text-left transition ${
                    selectedOrderId === order.id
                      ? "ui-border-default ui-bg-elevated"
                      : "ui-border-subtle ui-bg-surface"
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--ui-foreground)]">
                        {order.customer_name}
                      </div>
                      <div className="mt-1 text-xs ui-text-muted">
                        {order.service_location_address || "Sin dirección"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Tag color={STATUS_COLORS[order.status] || "default"}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Tag>
                      {order.priority ? (
                        <Tag>{PRIORITY_LABELS[order.priority] || order.priority}</Tag>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="min-w-0 grid gap-4">
            <Card className="rounded-[28px]" loading={Boolean(selectedOrderId) && loadingDetail}>
              {selectedWorkOrder ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-[0.14em] ui-text-muted">
                          Servicio activo
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-[var(--ui-foreground)]">
                          {selectedWorkOrder.customer_name}
                        </div>
                        <div className="mt-2 text-sm ui-text-muted">
                          {selectedWorkOrder.service_location_address || "Sin dirección"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Tag color={STATUS_COLORS[selectedWorkOrder.status] || "default"}>
                          {STATUS_LABELS[selectedWorkOrder.status] || selectedWorkOrder.status}
                        </Tag>
                        {selectedWorkOrder.priority ? (
                          <Tag>{PRIORITY_LABELS[selectedWorkOrder.priority] || selectedWorkOrder.priority}</Tag>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-highlight)_5%,var(--ui-card))] p-4">
                    <div className="text-xs uppercase tracking-[0.14em] ui-text-muted">
                      Siguiente paso
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[var(--ui-foreground)]">
                      {primaryAction ? primaryAction.label : "Orden cerrada"}
                    </div>
                    <div className="mt-1 text-sm ui-text-muted">
                      {primaryAction ? primaryAction.description : "La orden ya no requiere acciones del técnico."}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {primaryAction ? (
                        <Button
                          type="primary"
                          icon={primaryAction.icon}
                          loading={primaryAction.loading}
                          onClick={primaryAction.onClick}
                        >
                          {primaryAction.label}
                        </Button>
                      ) : (
                        <Tag color="green">Finalizada</Tag>
                      )}

                      {mapUrl ? (
                        <a href={mapUrl} target="_blank" rel="noreferrer">
                          <Button icon={<PiArrowSquareOutBold size={16} />}>Ver ruta</Button>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <Empty description="No hay órdenes activas para mostrar." />
              )}
            </Card>

            <Tabs
              defaultActiveKey="service"
              items={[
                { key: "service", label: "Servicio", children: serviceTab },
                { key: "evidence", label: "Evidencia", children: evidenceTab },
                { key: "signature", label: "Firma", children: signatureTab },
                { key: "materials", label: "Material", children: materialsTab },
              ]}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Agenda;
