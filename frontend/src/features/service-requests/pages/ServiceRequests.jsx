import { useCallback, useMemo, useState } from "react";
import { Table, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  getServiceRequests,
  approveServiceRequest,
  rejectServiceRequest,
} from "@api/serviceRequestService";
import { getTechnicians } from "@api/userService";
import queryClient from "@lib/queryClient";
import { useMessage } from "@context/MessageProvider";
import { useDialog } from "@context/DialogProvider";
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

const ServiceRequests = () => {
  const { success, error } = useMessage();
  const { openContextMenu } = useDialog();
  const [filters, setFilters] = useState({
    customer: "",
    phone: "",
    address: "",
    technician: "",
    status: null,
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["service-requests", filters.status],
    queryFn: () =>
      getServiceRequests(filters.status ? { status: filters.status } : {}),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });

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

  const openRequestContextMenu = useCallback(
    (event, record) => {
      const technicianItems = technicians.length
        ? technicians.map((technician) => ({
            key: `assign-${technician.id}`,
            label: technician.name,
            onClick: () =>
              approveMutation.mutate({
                id: record.id,
                payload: { technician_id: technician.id },
              }),
          }))
        : [
            {
              key: "no-technicians",
              label: "Sin técnicos disponibles",
              disabled: true,
            },
          ];

      openContextMenu({
        event,
        items: [
          {
            key: "approve",
            label: record.work_order_id
              ? "Actualizar orden"
              : "Aprobar y crear orden",
            disabled: record.status === "REJECTED",
            onClick: () =>
              approveMutation.mutate({
                id: record.id,
                payload: {},
              }),
          },
          {
            key: "assign",
            label: record.technician_name
              ? `Reasignar de ${record.technician_name}`
              : "Aprobar y asignar",
            disabled: record.status === "REJECTED" || technicians.length === 0,
            children: technicianItems,
          },
          {
            key: "reject",
            label: "Rechazar solicitud",
            danger: true,
            disabled: record.status !== "PENDING",
            onClick: () => rejectMutation.mutate(record.id),
          },
        ],
      });
    },
    [approveMutation, openContextMenu, rejectMutation, technicians]
  );

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

  const columns = [
    {
      title: "Cliente",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "Teléfono",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Dirección",
      dataIndex: "address",
      key: "address",
      render: (value) => value || "-",
    },
    {
      title: "Servicio",
      dataIndex: "service_type",
      key: "service_type",
      render: (value) => value || "-",
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag color={STATUS_COLORS[value]}>{STATUS_LABELS[value] || value}</Tag>
      ),
    },
    {
      title: "Orden",
      key: "work_order_status",
      render: (_, record) =>
        record.work_order_status ? (
          <Tag color={ORDER_STATUS_COLORS[record.work_order_status] || "default"}>
            {ORDER_STATUS_LABELS[record.work_order_status] || record.work_order_status}
          </Tag>
        ) : (
          <Tag>Sin crear</Tag>
        ),
    },
    {
      title: "Técnico",
      dataIndex: "technician_name",
      key: "technician_name",
      render: (value) => value || "Sin asignar",
    },
    {
      title: "Anti-spam",
      key: "suspicious",
      render: (_, record) =>
        record.is_suspicious ? (
          <Tag color="orange">
            Sospechosa{" "}
            {(record.suspicious_reasons || [])
              .map((reason) => SUSPICIOUS_LABELS[reason] || reason)
              .join(", ")}
          </Tag>
        ) : (
          <Tag color="green">OK</Tag>
        ),
    },
  ];

  const searchConfig = useMemo(
    () => ({
      title: "Buscar y filtrar solicitudes",
      values: filters,
      fields: [
        {
          key: "customer",
          label: "Cliente",
          placeholder: "Cliente, teléfono, dirección o técnico",
        },
        {
          key: "phone",
          label: "Telefono",
          placeholder: "Telefono del solicitante",
        },
        {
          key: "address",
          label: "Direccion / servicio",
          placeholder: "Direccion o tipo de servicio",
        },
        {
          key: "technician",
          label: "Tecnico",
          placeholder: "Tecnico asignado",
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
      onRefresh: () => queryClient.invalidateQueries({ queryKey: ["service-requests"] }),
    }),
    [filters]
  );

  return (
    <PageLayout
      title="Validación de solicitudes"
      searchConfig={searchConfig}
    >
      <Table
        rowKey="id"
        dataSource={filteredRequests}
        columns={columns}
        loading={isLoading}
        onRow={(record) => ({
          onContextMenu: (event) => openRequestContextMenu(event, record),
        })}
        pagination={{ pageSize: 8 }}
      />
    </PageLayout>
  );
};

export default ServiceRequests;
