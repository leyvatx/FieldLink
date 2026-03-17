import { useState } from "react";
import { Button, Image, Modal, Table, Tag } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
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

const STATUS_COLORS = {
  PENDING: "default",
  APPROVED: "green",
  REJECTED: "red",
  ADJUSTED: "orange",
};

const MaterialApprovals = () => {
  const { success, error } = useMessage();
  const [rejecting, setRejecting] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [reason, setReason] = useState("");
  const [adjustQty, setAdjustQty] = useState(0);

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
    onError: () => error("No se pudo actualizar la evidencia"),
  });

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
    {
      title: "Acciones",
      key: "actions",
          render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            type="primary"
            disabled={record.approval_status === "APPROVED"}
            onClick={() => approvalMutation.mutate({ action: "approve", record })}>
            Aprobar
          </Button>
          <Button
            size="small"
            danger
            disabled={record.approval_status === "REJECTED"}
            onClick={() => setRejecting(record)}>
            Rechazar
          </Button>
          <Button size="small" onClick={() => setAdjusting(record)}>
            Ajustar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout title="Validación de evidencias">
      <Table
        rowKey="id"
        dataSource={usedMaterials}
        columns={columns}
        loading={isLoading}
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
