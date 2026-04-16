import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Card, DatePicker, Select, Table, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import ModuleStatStrip from "@components/ModuleStatStrip";
import PageLayout from "@layouts/page-layout/PageLayout";
import LocationPicker from "@/common/components/location/LocationPicker";
import {
  getServiceRequests,
  approveServiceRequest,
  rejectServiceRequest,
} from "@api/serviceRequestService";
import { getMyCompanyConfig } from "@api/companyConfigService";
import { getTechnicians } from "@api/userService";
import queryClient from "@lib/queryClient";
import { useMessage } from "@context/MessageProvider";
import { matchesText } from "@/lib/filtering";

const STATUS_COLORS = {
  PENDING: "default",
  VALIDATED: "green",
  REJECTED: "red",
};

const STATUS_LABELS = {
  PENDING: "Pendiente",
  VALIDATED: "Validada",
  REJECTED: "Rechazada",
};

const ORDER_STATUS_COLORS = {
  PENDING: "default",
  ASSIGNED: "blue",
  IN_TRANSIT: "cyan",
  IN_SERVICE: "gold",
  COMPLETED: "green",
  CANCELLED: "red",
};

const ORDER_STATUS_LABELS = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignada",
  IN_TRANSIT: "En ruta",
  IN_SERVICE: "En servicio",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

const PRIORITY_LABELS = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const PRIORITY_COLORS = {
  LOW: "default",
  MEDIUM: "blue",
  HIGH: "gold",
  URGENT: "red",
};

const LABOR_OPTIONS = [
  { value: "BASIC", label: "Básico" },
  { value: "MEDIUM", label: "Medio" },
  { value: "ADVANCED", label: "Avanzado" },
];

const LABOR_LABELS = {
  BASIC: "Básico",
  MEDIUM: "Medio",
  ADVANCED: "Avanzado",
};

const TRANSPORT_OPTIONS = [
  { value: "NEAR", label: "Cercano" },
  { value: "MEDIUM", label: "Medio" },
  { value: "FAR", label: "Lejano" },
];

const TRANSPORT_LABELS = {
  NEAR: "Cercano",
  MEDIUM: "Medio",
  FAR: "Lejano",
};

const LABOR_RATE_KEYS = {
  BASIC: "labor_basic_rate",
  MEDIUM: "labor_medium_rate",
  ADVANCED: "labor_advanced_rate",
};

const TRANSPORT_RATE_KEYS = {
  NEAR: "transport_near_rate",
  MEDIUM: "transport_medium_rate",
  FAR: "transport_far_rate",
};

const SUSPICIOUS_LABELS = {
  otp_unvalidated: "OTP sin validar",
  blacklisted_phone: "Teléfono en lista negra",
};

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatDateTime(value) {
  return value ? dayjs(value).format("DD MMM YYYY HH:mm") : "Sin fecha";
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function getConfiguredRate(config, key) {
  const value = config?.[key];
  return value == null ? 0 : Number(value);
}

function buildApprovalErrorMessage(mutationError) {
  const data = mutationError?.response?.data || {};

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  for (const field of [
    "service_location_address",
    "customer_latitude",
    "customer_longitude",
    "labor_tier",
    "transport_tier",
    "priority",
  ]) {
    const fieldValue = data?.[field];
    if (Array.isArray(fieldValue) && fieldValue[0]) {
      return fieldValue[0];
    }
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      return fieldValue;
    }
  }

  return "No se pudo aprobar la solicitud";
}

const emptyApprovalDraft = {
  priority: "MEDIUM",
  labor_tier: "MEDIUM",
  transport_tier: "NEAR",
  scheduled_date: null,
  service_location_address: "",
  customer_latitude: "",
  customer_longitude: "",
};

const ServiceRequests = () => {
  const { success, error } = useMessage();
  const [filters, setFilters] = useState({
    customer: "",
    phone: "",
    address: "",
    technician: "",
    status: null,
  });
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [assignTechnicianId, setAssignTechnicianId] = useState(undefined);
  const [approvalDraft, setApprovalDraft] = useState(emptyApprovalDraft);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["service-requests", filters.status],
    queryFn: () =>
      getServiceRequests(filters.status ? { status: filters.status } : {}),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });

  const { data: companyConfig, isLoading: loadingCompanyConfig } = useQuery({
    queryKey: ["company-config", "my-config"],
    queryFn: getMyCompanyConfig,
  });

  const refreshRequests = () => {
    queryClient.invalidateQueries({ queryKey: ["service-requests"] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, payload }) => approveServiceRequest(id, payload),
    onSuccess: (response) => {
      success(
        response?.technician_name
          ? `Orden creada y asignada a ${response.technician_name}`
          : "Solicitud aprobada y orden creada"
      );
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (mutationError) => error(buildApprovalErrorMessage(mutationError)),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectServiceRequest,
    onSuccess: () => {
      success("Solicitud rechazada");
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
    onError: () => error("No se pudo rechazar la solicitud"),
  });

  const filteredRequests = useMemo(() => {
    return requests.filter((record) => {
      if (!matchesText(record.customer_name, filters.customer)) {
        return false;
      }
      if (!matchesText(record.phone, filters.phone)) {
        return false;
      }
      if (!matchesText(`${record.address || ""} ${record.service_type || ""}`, filters.address)) {
        return false;
      }
      return matchesText(record.technician_name, filters.technician);
    });
  }, [filters.address, filters.customer, filters.phone, filters.technician, requests]);

  useEffect(() => {
    if (!filteredRequests.length) {
      if (selectedRequestId !== null) {
        setSelectedRequestId(null);
      }
      return;
    }

    const stillVisible = filteredRequests.some(
      (record) => String(record.id) === String(selectedRequestId)
    );

    if (!stillVisible) {
      setSelectedRequestId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedRequestId]);

  const selectedRequest = useMemo(
    () =>
      filteredRequests.find((record) => String(record.id) === String(selectedRequestId)) || null,
    [filteredRequests, selectedRequestId]
  );

  useEffect(() => {
    setAssignTechnicianId(undefined);

    if (!selectedRequest) {
      setApprovalDraft(emptyApprovalDraft);
      return;
    }

    setApprovalDraft({
      priority: selectedRequest.work_order_priority || "MEDIUM",
      labor_tier: selectedRequest.work_order_labor_tier || "MEDIUM",
      transport_tier: selectedRequest.work_order_transport_tier || "NEAR",
      scheduled_date: selectedRequest.work_order_scheduled_date
        ? dayjs(selectedRequest.work_order_scheduled_date)
        : null,
      service_location_address:
        selectedRequest.work_order_service_location_address || selectedRequest.address || "",
      customer_latitude:
        selectedRequest.work_order_customer_latitude ?? selectedRequest.latitude ?? "",
      customer_longitude:
        selectedRequest.work_order_customer_longitude ?? selectedRequest.longitude ?? "",
    });
  }, [selectedRequest]);

  const requestMetrics = useMemo(
    () => ({
      total: filteredRequests.length,
      pending: filteredRequests.filter((record) => record.status === "PENDING").length,
      validated: filteredRequests.filter((record) => record.status === "VALIDATED").length,
      suspicious: filteredRequests.filter((record) => record.is_suspicious).length,
    }),
    [filteredRequests]
  );

  const technicianOptions = useMemo(
    () =>
      technicians.map((technician) => ({
        value: technician.id,
        label: technician.name,
      })),
    [technicians]
  );

  const searchConfig = useMemo(
    () => ({
      title: "Filtros de solicitudes",
      values: filters,
      fields: [
        {
          key: "customer",
          label: "Cliente",
          placeholder: "Cliente",
        },
        {
          key: "phone",
          label: "Teléfono",
          placeholder: "Teléfono del solicitante",
        },
        {
          key: "address",
          label: "Dirección / servicio",
          placeholder: "Dirección o tipo de servicio",
        },
        {
          key: "technician",
          label: "Técnico",
          placeholder: "Técnico asignado",
        },
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "PENDING", label: "Pendiente" },
            { value: "VALIDATED", label: "Validada" },
            { value: "REJECTED", label: "Rechazada" },
          ],
        },
      ],
      onChange: (patch) => setFilters((prev) => ({ ...prev, ...patch })),
      onReset: () =>
        setFilters({
          customer: "",
          phone: "",
          address: "",
          technician: "",
          status: null,
        }),
      onRefresh: refreshRequests,
    }),
    [filters]
  );

  const columns = [
    {
      title: "Cliente",
      key: "customer_name",
      width: 260,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="font-semibold text-[var(--ui-foreground)]">{record.customer_name}</div>
          <div className="text-sm ui-text-muted">{record.phone || "Sin teléfono"}</div>
        </div>
      ),
    },
    {
      title: "Solicitud",
      key: "request",
      width: 380,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="line-clamp-2 text-sm leading-5 text-[var(--ui-foreground)]">
            {record.address || "Sin dirección"}
          </div>
          <div className="text-sm ui-text-muted">
            {record.service_type || "Sin servicio"} - {formatDateTime(record.created_at)}
            {record.landing_name ? ` - Landing: ${record.landing_name}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Estado",
      key: "status",
      width: 210,
      render: (_, record) => (
        <div className="flex flex-wrap gap-2">
          <Tag color={STATUS_COLORS[record.status] || "default"}>
            {STATUS_LABELS[record.status] || record.status}
          </Tag>
          {record.work_order_status ? (
            <Tag color={ORDER_STATUS_COLORS[record.work_order_status] || "default"}>
              {ORDER_STATUS_LABELS[record.work_order_status] || record.work_order_status}
            </Tag>
          ) : (
            <Tag color="default">Sin orden</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Revisión",
      key: "review",
      width: 260,
      render: (_, record) => (
        <div className="grid gap-1">
          <div>{record.technician_name || "Sin técnico"}</div>
          <div className="text-sm ui-text-muted">
            {record.is_suspicious
              ? (record.suspicious_reasons || [])
                  .map((reason) => SUSPICIOUS_LABELS[reason] || reason)
                  .join(", ")
              : "Sin alertas"}
          </div>
        </div>
      ),
    },
  ];

  const draftLaborCost = getConfiguredRate(
    companyConfig,
    LABOR_RATE_KEYS[approvalDraft.labor_tier]
  );
  const draftTransportCost = getConfiguredRate(
    companyConfig,
    TRANSPORT_RATE_KEYS[approvalDraft.transport_tier]
  );
  const hasPartialCoordinates =
    (approvalDraft.customer_latitude !== "" || approvalDraft.customer_longitude !== "") &&
    (approvalDraft.customer_latitude === "" || approvalDraft.customer_longitude === "");
  const approvalReady =
    Boolean(approvalDraft.service_location_address?.trim()) &&
    Boolean(approvalDraft.priority) &&
    Boolean(approvalDraft.labor_tier) &&
    Boolean(approvalDraft.transport_tier) &&
    !hasPartialCoordinates &&
    Boolean(companyConfig?.repair_pricing_ready);

  const buildApprovalPayload = (technicianId = undefined) => {
    const payload = {
      priority: approvalDraft.priority,
      labor_tier: approvalDraft.labor_tier,
      transport_tier: approvalDraft.transport_tier,
      service_location_address: approvalDraft.service_location_address?.trim() || "",
      ...(technicianId ? { technician_id: technicianId } : {}),
    };

    if (approvalDraft.scheduled_date) {
      payload.scheduled_date = dayjs(approvalDraft.scheduled_date).toISOString();
    }

    if (
      approvalDraft.customer_latitude !== "" &&
      approvalDraft.customer_longitude !== ""
    ) {
      payload.customer_latitude = Number(approvalDraft.customer_latitude);
      payload.customer_longitude = Number(approvalDraft.customer_longitude);
    }

    return payload;
  };

  return (
    <PageLayout title="Solicitudes de servicio" searchConfig={searchConfig}>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(24rem,0.95fr)]">
        <div className="2xl:col-span-2">
          <ModuleStatStrip
            badge="Solicitudes"
            description="La mesa de revisión deja la tabla al frente y el panel lateral confirma dirección, pricing y asignación antes de convertir a orden."
            stats={[
              {
                label: "Visibles",
                value: requestMetrics.total,
                help: "solicitudes filtradas",
              },
              {
                label: "Pendientes",
                value: requestMetrics.pending,
                help: "por revisar",
              },
              {
                label: "Validadas",
                value: requestMetrics.validated,
                help: "con salida a orden",
              },
              {
                label: "Alertas",
                value: requestMetrics.suspicious,
                help: "casos sospechosos",
              },
            ]}
          />
        </div>

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Cola de solicitudes
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Selecciona una fila para aprobarla, asignarla o rechazarla.
              </div>
            </div>
            <Tag color="purple">{filteredRequests.length} visibles</Tag>
          </div>
          <Table
            rowKey="id"
            dataSource={filteredRequests}
            columns={columns}
            loading={isLoading || approveMutation.isPending || rejectMutation.isPending}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1020 }}
            onRow={(record) => ({
              onClick: () => setSelectedRequestId(record.id),
              className:
                String(selectedRequestId) === String(record.id)
                  ? "bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))]"
                  : undefined,
            })}
          />
        </Card>

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Revisión activa
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Aquí decides si la solicitud se convierte en orden y con qué precio base sale a operación.
              </div>
            </div>
            {selectedRequest ? (
              <Tag color={STATUS_COLORS[selectedRequest.status] || "default"}>
                {STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
              </Tag>
            ) : null}
          </div>

          {selectedRequest ? (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Cliente</div>
                  <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                    {selectedRequest.customer_name}
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    {selectedRequest.phone || "Sin teléfono"}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Servicio</div>
                  <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                    {selectedRequest.service_type || "Sin definir"}
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    {formatDateTime(selectedRequest.created_at)}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_97%,transparent)] p-4">
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.is_suspicious ? (
                    <Tag color="gold">
                      {(selectedRequest.suspicious_reasons || [])
                        .map((reason) => SUSPICIOUS_LABELS[reason] || reason)
                        .join(", ")}
                    </Tag>
                  ) : (
                    <Tag color="green">Sin alertas</Tag>
                  )}
                  {selectedRequest.work_order_status ? (
                    <Tag color={ORDER_STATUS_COLORS[selectedRequest.work_order_status] || "default"}>
                      {ORDER_STATUS_LABELS[selectedRequest.work_order_status] || selectedRequest.work_order_status}
                    </Tag>
                  ) : (
                    <Tag color="default">Sin orden creada</Tag>
                  )}
                  {selectedRequest.tracking_token ? (
                    <Tag color="blue">
                      Tracking {String(selectedRequest.tracking_token).slice(0, 8)}
                    </Tag>
                  ) : null}
                </div>
                <div className="mt-3 text-sm font-medium text-[var(--ui-foreground)]">
                  Dirección solicitada
                </div>
                <div className="mt-2 text-sm leading-6 ui-text-muted">
                  {selectedRequest.address || "Sin dirección registrada"}
                </div>
                {selectedRequest.description ? (
                  <>
                    <div className="mt-4 text-sm font-medium text-[var(--ui-foreground)]">
                      Descripción
                    </div>
                    <div className="mt-2 text-sm leading-6 ui-text-muted">
                      {selectedRequest.description}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--ui-foreground)]">
                  Punto real del servicio
                </label>
                <LocationPicker
                  value={approvalDraft.service_location_address}
                  latitude={approvalDraft.customer_latitude}
                  longitude={approvalDraft.customer_longitude}
                  onChange={(value) =>
                    setApprovalDraft((prev) => ({
                      ...prev,
                      service_location_address: value,
                    }))
                  }
                  onLocationSelect={(location) =>
                    setApprovalDraft((prev) => ({
                      ...prev,
                      service_location_address: location?.address || "",
                      customer_latitude: location?.latitude ?? "",
                      customer_longitude: location?.longitude ?? "",
                    }))
                  }
                />
                <div className="text-sm ui-text-muted">
                  {hasPartialCoordinates
                    ? "Confirma latitud y longitud juntas antes de aprobar."
                    : approvalDraft.customer_latitude !== "" &&
                        approvalDraft.customer_longitude !== ""
                      ? `Coordenadas: ${Number(approvalDraft.customer_latitude).toFixed(5)}, ${Number(
                          approvalDraft.customer_longitude
                        ).toFixed(5)}`
                      : "Si no confirmas el punto, la orden dependerá solo del texto de la dirección."}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--ui-foreground)]">
                    Prioridad
                  </label>
                  <Select
                    options={PRIORITY_OPTIONS}
                    value={approvalDraft.priority}
                    onChange={(value) =>
                      setApprovalDraft((prev) => ({ ...prev, priority: value || "MEDIUM" }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--ui-foreground)]">
                    Fecha programada
                  </label>
                  <DatePicker
                    showTime
                    className="w-full"
                    format="YYYY-MM-DD HH:mm"
                    value={approvalDraft.scheduled_date}
                    onChange={(value) =>
                      setApprovalDraft((prev) => ({ ...prev, scheduled_date: value || null }))
                    }
                    placeholder="Opcional"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--ui-foreground)]">
                    Mano de obra
                  </label>
                  <Select
                    options={LABOR_OPTIONS}
                    value={approvalDraft.labor_tier}
                    onChange={(value) =>
                      setApprovalDraft((prev) => ({ ...prev, labor_tier: value || "MEDIUM" }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--ui-foreground)]">
                    Transporte
                  </label>
                  <Select
                    options={TRANSPORT_OPTIONS}
                    value={approvalDraft.transport_tier}
                    onChange={(value) =>
                      setApprovalDraft((prev) => ({
                        ...prev,
                        transport_tier: value || "NEAR",
                      }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_97%,transparent)] p-4">
                <div className="text-sm font-medium text-[var(--ui-foreground)]">
                  Costeo inicial de la orden
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-[var(--ui-border)] px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Mano de obra</div>
                    <div className="mt-2 font-semibold text-[var(--ui-foreground)]">
                      {formatCurrency(draftLaborCost)}
                    </div>
                    <div className="mt-1 text-sm ui-text-muted">
                      {LABOR_LABELS[approvalDraft.labor_tier] || "Pendiente"}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-[var(--ui-border)] px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Transporte</div>
                    <div className="mt-2 font-semibold text-[var(--ui-foreground)]">
                      {formatCurrency(draftTransportCost)}
                    </div>
                    <div className="mt-1 text-sm ui-text-muted">
                      {TRANSPORT_LABELS[approvalDraft.transport_tier] || "Pendiente"}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Total base</div>
                    <div className="mt-2 font-semibold text-[var(--ui-foreground)]">
                      {formatCurrency(draftLaborCost + draftTransportCost)}
                    </div>
                    <div className="mt-1 text-sm ui-text-muted">
                      Sin material todavía
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Tag color={PRIORITY_COLORS[approvalDraft.priority] || "default"}>
                    {PRIORITY_LABELS[approvalDraft.priority] || approvalDraft.priority}
                  </Tag>
                  <Tag>{LABOR_LABELS[approvalDraft.labor_tier] || "Sin mano de obra"}</Tag>
                  <Tag>
                    {TRANSPORT_LABELS[approvalDraft.transport_tier] || "Sin transporte"}
                  </Tag>
                </div>
                {!companyConfig?.repair_pricing_ready ? (
                  <div className="mt-3 text-sm text-[var(--ui-danger,#b91c1c)]">
                    Configura las tarifas de la empresa antes de aprobar solicitudes.
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--ui-foreground)]">
                  Técnico para la orden
                </label>
                <Select
                  allowClear
                  options={technicianOptions}
                  placeholder="Selecciona un técnico"
                  value={assignTechnicianId}
                  onChange={setAssignTechnicianId}
                  disabled={selectedRequest.status === "REJECTED"}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="primary"
                  onClick={() =>
                    approveMutation.mutate({
                      id: selectedRequest.id,
                      payload: buildApprovalPayload(),
                    })
                  }
                  disabled={selectedRequest.status === "REJECTED" || !approvalReady}
                  loading={approveMutation.isPending || loadingCompanyConfig}
                >
                  {selectedRequest.work_order_id ? "Actualizar orden" : "Aprobar"}
                </Button>
                <Button
                  onClick={() =>
                    approveMutation.mutate({
                      id: selectedRequest.id,
                      payload: buildApprovalPayload(assignTechnicianId),
                    })
                  }
                  disabled={
                    selectedRequest.status === "REJECTED" ||
                    !assignTechnicianId ||
                    !approvalReady
                  }
                  loading={approveMutation.isPending || loadingCompanyConfig}
                >
                  {selectedRequest.technician_name ? "Reasignar orden" : "Aprobar y asignar"}
                </Button>
                <Button
                  danger
                  onClick={() => rejectMutation.mutate(selectedRequest.id)}
                  disabled={selectedRequest.status !== "PENDING"}
                  loading={rejectMutation.isPending}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm ui-text-muted">
              No hay solicitudes disponibles con los filtros actuales.
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default ServiceRequests;
