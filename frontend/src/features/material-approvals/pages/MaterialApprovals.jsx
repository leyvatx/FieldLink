import { useCallback, useMemo, useState } from "react";
import { Card, Image, Modal, Table, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import ModuleOverview from "@components/ModuleOverview";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  getUsedMaterials,
  createMaterialApproval,
  approveMaterialApproval,
  rejectMaterialApproval,
  adjustMaterialApproval,
} from "@api/materialApprovalService";
import queryClient from "@lib/queryClient";
import { useMessage } from "@context/MessageProvider";
import { useDialog } from "@context/DialogProvider";
import { matchesText } from "@/lib/filtering";

const STATUS_COLORS = {
  PENDING: "default",
  APPROVED: "green",
  REJECTED: "red",
  ADJUSTED: "orange",
};

const MaterialApprovals = () => {
  const { success, error } = useMessage();
  const { openContextMenu } = useDialog();
  const [rejecting, setRejecting] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [reason, setReason] = useState("");
  const [adjustQty, setAdjustQty] = useState(0);
  const [filters, setFilters] = useState({
    order: "",
    material: "",
    status: null,
  });

  const { data: usedMaterials = [], isLoading } = useQuery({
    queryKey: ["used-materials"],
    queryFn: () => getUsedMaterials(),
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ action, record, payload }) => {
      let approvalId = record.approval_id;
      if (!approvalId) {
        const created = await createMaterialApproval({
          used_material: record.id,
          work_order: record.work_order,
        });
        approvalId = created.id;
      }
      if (action === "approve") {
        return approveMaterialApproval(approvalId);
      }
      if (action === "reject") {
        return rejectMaterialApproval(approvalId, payload.reason);
      }
      return adjustMaterialApproval(approvalId, payload.quantity);
    },
    onSuccess: () => {
      success("Revisión actualizada");
      queryClient.invalidateQueries({ queryKey: ["used-materials"] });
    },
    onError: () => error("No se pudo actualizar la solicitud"),
  });

  const openApprovalContextMenu = useCallback(
    (event, record) => {
      openContextMenu({
        event,
        items: [
          {
            key: "approve",
            label: "Aprobar material",
            disabled: record.approval_status === "APPROVED",
            onClick: () => approvalMutation.mutate({ action: "approve", record }),
          },
          {
            key: "reject",
            label: "Rechazar material",
            danger: true,
            disabled: record.approval_status === "REJECTED",
            onClick: () => setRejecting(record),
          },
          {
            key: "adjust",
            label: "Ajustar cantidad",
            onClick: () => setAdjusting(record),
          },
        ],
      });
    },
    [approvalMutation, openContextMenu]
  );

  const filteredUsedMaterials = useMemo(() => {
    return usedMaterials.filter((record) => {
      if (filters.status && record.approval_status !== filters.status) {
        return false;
      }

      if (!matchesText(record.work_order_id, filters.order)) {
        return false;
      }
      return matchesText(record.material_name, filters.material);
    });
  }, [filters, usedMaterials]);

  const columns = [
    {
      title: "Orden",
      dataIndex: "work_order_id",
      key: "work_order_id",
    },
    {
      title: "Material",
      dataIndex: "material_name",
      key: "material_name",
    },
    {
      title: "Cantidad usada",
      dataIndex: "quantity_used",
      key: "quantity_used",
    },
    {
      title: "Estado",
      dataIndex: "approval_status",
      key: "approval_status",
      render: (value) =>
        value ? <Tag color={STATUS_COLORS[value]}>{value}</Tag> : <Tag>Sin revisión</Tag>,
    },
  ];

  const approvalMetrics = useMemo(
    () => ({
      total: filteredUsedMaterials.length,
      pending: filteredUsedMaterials.filter(
        (record) => record.approval_status === "PENDING" || !record.approval_status
      ).length,
      approved: filteredUsedMaterials.filter(
        (record) => record.approval_status === "APPROVED"
      ).length,
      adjusted: filteredUsedMaterials.filter(
        (record) => record.approval_status === "ADJUSTED"
      ).length,
    }),
    [filteredUsedMaterials]
  );

  const searchConfig = useMemo(
    () => ({
      title: "Solicitudes de material",
      values: filters,
      fields: [
        {
          key: "order",
          label: "Orden",
          placeholder: "ID de la orden",
        },
        {
          key: "material",
          label: "Material",
          placeholder: "Nombre del material",
        },
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "PENDING", label: "Pendiente" },
            { value: "APPROVED", label: "Aprobada" },
            { value: "REJECTED", label: "Rechazada" },
            { value: "ADJUSTED", label: "Ajustada" },
          ],
        },
      ],
      onChange: (patch) => setFilters((prev) => ({ ...prev, ...patch })),
      onReset: () =>
        setFilters({
          order: "",
          material: "",
          status: null,
        }),
      onRefresh: () => queryClient.invalidateQueries({ queryKey: ["used-materials"] }),
    }),
    [filters]
  );

  return (
    <PageLayout
      title="Validación de evidencias"
      searchConfig={searchConfig}
    >
      <div className="grid gap-6">
        <ModuleOverview
          badge="Material"
          title="Validacion de evidencias"
          subtitle="Revision de fotos, cantidades y aprobacion."
          tags={["Evidencias", "Cantidades", "Revision"]}
          stats={[
            {
              label: "Solicitudes",
              value: approvalMetrics.total,
              help: "visibles",
            },
            {
              label: "Pendientes",
              value: approvalMetrics.pending,
              help: "por revisar",
            },
            {
              label: "Aprobadas",
              value: approvalMetrics.approved,
              help: "confirmadas",
            },
            {
              label: "Ajustadas",
              value: approvalMetrics.adjusted,
              help: "con cambio de cantidad",
            },
          ]}
        />

        <Card className="rounded-2xl">
          <div className="mb-3 text-xs ui-text-muted">
            Menu contextual por fila para aprobar, rechazar o ajustar.
          </div>
          <Table
            rowKey="id"
            dataSource={filteredUsedMaterials}
            columns={columns}
            loading={isLoading}
            onRow={(record) => ({
              onContextMenu: (event) => openApprovalContextMenu(event, record),
            })}
            expandable={{
              expandedRowRender: (record) => (
                <div className="flex flex-wrap gap-3">
                  {record.photos?.filter((photo) => photo.file).length ? (
                    <Image.PreviewGroup>
                      {record.photos
                        .filter((photo) => photo.file)
                        .map((photo) => (
                          <Image
                            key={photo.id}
                            width={120}
                            src={photo.file}
                            alt="evidencia"
                          />
                        ))}
                    </Image.PreviewGroup>
                  ) : (
                    <span className="text-sm ui-text-muted">
                      Sin fotos adjuntas
                    </span>
                  )}
                </div>
              ),
            }}
            pagination={{ pageSize: 8 }}
          />
        </Card>
      </div>

      <Modal
        open={!!rejecting}
        title="Rechazar evidencia"
        onCancel={() => setRejecting(null)}
        onOk={() => {
          approvalMutation.mutate({
            action: "reject",
            record: rejecting,
            payload: { reason },
          });
          setRejecting(null);
          setReason("");
        }}>
        <p className="text-sm ui-text-muted mb-3">
          Indica el motivo del rechazo.
        </p>
        <input
          className="w-full border ui-border-subtle rounded-lg px-3 py-2 ui-bg-surface"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Motivo"
        />
      </Modal>

      <Modal
        open={!!adjusting}
        title="Ajustar cantidad"
        onCancel={() => setAdjusting(null)}
        onOk={() => {
          approvalMutation.mutate({
            action: "adjust",
            record: adjusting,
            payload: { quantity: Number(adjustQty) },
          });
          setAdjusting(null);
          setAdjustQty(0);
        }}>
        <p className="text-sm ui-text-muted mb-3">
          Ingresa la cantidad aprobada.
        </p>
        <input
          type="number"
          className="w-full border ui-border-subtle rounded-lg px-3 py-2 ui-bg-surface"
          value={adjustQty}
          min={0}
          onChange={(event) => setAdjustQty(event.target.value)}
        />
      </Modal>
    </PageLayout>
  );
};

export default MaterialApprovals;
