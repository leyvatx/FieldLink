import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Card, Select, Table, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import ModuleStatStrip from "@components/ModuleStatStrip";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  getServiceRequests,
  approveServiceRequest,
  rejectServiceRequest,
} from "@api/serviceRequestService";
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

const SUSPICIOUS_LABELS = {
  otp_unvalidated: "OTP sin validar",
  blacklisted_phone: "Teléfono en lista negra",
};

function formatDateTime(value) {
  return value ? dayjs(value).format("DD MMM YYYY HH:mm") : "Sin fecha";
}

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

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["service-requests", filters.status],
    queryFn: () =>
      getServiceRequests(filters.status ? { status: filters.status } : {}),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
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
    onError: (mutationError) =>
      error(
        mutationError.response?.data?.error ||
          "No se pudo aprobar la solicitud"
      ),
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

  return (
    <PageLayout
      title="Solicitudes de servicio"
      searchConfig={searchConfig}
    >
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.9fr)]">
        <div className="2xl:col-span-2">
          <ModuleStatStrip
            badge="Solicitudes"
            description="La mesa de revisión deja la tabla al frente y el panel lateral resuelve aprobación, rechazo y asignación."
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
                Aquí decides si la solicitud se convierte en orden y a quién se le envía.
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
                      Descripcion
                    </div>
                    <div className="mt-2 text-sm leading-6 ui-text-muted">
                      {selectedRequest.description}
                    </div>
                  </>
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
                      payload: {},
                    })
                  }
                  disabled={selectedRequest.status === "REJECTED"}
                  loading={approveMutation.isPending}
                >
                  {selectedRequest.work_order_id ? "Actualizar orden" : "Aprobar"}
                </Button>
                <Button
                  onClick={() =>
                    approveMutation.mutate({
                      id: selectedRequest.id,
                      payload: { technician_id: assignTechnicianId },
                    })
                  }
                  disabled={selectedRequest.status === "REJECTED" || !assignTechnicianId}
                  loading={approveMutation.isPending}
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
