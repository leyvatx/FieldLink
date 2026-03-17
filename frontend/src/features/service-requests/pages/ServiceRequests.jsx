import { useState } from "react";
import { Button, Card, Select, Table, Tag } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  getServiceRequests,
  approveServiceRequest,
  rejectServiceRequest,
} from "@api/serviceRequestService";
import queryClient from "@lib/queryClient";
import { useMessage } from "@context/MessageProvider";

const STATUS_COLORS = {
  PENDING: "default",
  VALIDATED: "green",
  REJECTED: "red",
};

const SUSPICIOUS_LABELS = {
  otp_unvalidated: "OTP sin validar",
  blacklisted_phone: "Teléfono en lista negra",
};

const ServiceRequests = () => {
  const { success, error } = useMessage();
  const [status, setStatus] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["service-requests", status],
    queryFn: () => getServiceRequests(status ? { status } : {}),
  });

  const approveMutation = useMutation({
    mutationFn: approveServiceRequest,
    onSuccess: () => {
      success("Solicitud aprobada");
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
    onError: () => error("No se pudo aprobar la solicitud"),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectServiceRequest,
    onSuccess: () => {
      success("Solicitud rechazada");
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
    onError: () => error("No se pudo rechazar la solicitud"),
  });

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
      render: (value) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>,
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
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            type="primary"
            disabled={record.status !== "PENDING"}
            onClick={() => approveMutation.mutate(record.id)}>
            Aprobar
          </Button>
          <Button
            size="small"
            danger
            disabled={record.status !== "PENDING"}
            onClick={() => rejectMutation.mutate(record.id)}>
            Rechazar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout title="Validación de solicitudes">
      <div className="grid gap-4">
        <Card className="rounded-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold">Filtrar por estado</span>
            <Select
              allowClear
              className="min-w-[200px]"
              placeholder="Estado"
              onChange={(value) => setStatus(value)}
              options={[
                { value: "PENDING", label: "Pendiente" },
                { value: "VALIDATED", label: "Validada" },
                { value: "REJECTED", label: "Rechazada" },
              ]}
            />
          </div>
        </Card>
        <Table
          rowKey="id"
          dataSource={requests}
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 8 }}
        />
      </div>
    </PageLayout>
  );
};

export default ServiceRequests;
