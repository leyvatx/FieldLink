import { useEffect, useMemo, useState } from "react";
import { Button, Card, Image, Input, InputNumber, Table, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import ModuleStatStrip from "@components/ModuleStatStrip";
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
import { matchesText } from "@/lib/filtering";

const STATUS_COLORS = {
  PENDING: "default",
  APPROVED: "green",
  REJECTED: "red",
  ADJUSTED: "gold",
};

const STATUS_LABELS = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  ADJUSTED: "Ajustada",
};

function resolveStatus(record) {
  return record.approval_status || "PENDING";
}

const MaterialApprovals = () => {
  const { success, error } = useMessage();
  const [reviewReason, setReviewReason] = useState("");
  const [reviewQuantity, setReviewQuantity] = useState(undefined);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
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
    onError: () => error("No se pudo actualizar la revisión"),
  });

  const filteredUsedMaterials = useMemo(() => {
    return usedMaterials.filter((record) => {
      if (filters.status && resolveStatus(record) !== filters.status) {
        return false;
      }

      if (!matchesText(record.work_order_id, filters.order)) {
        return false;
      }
      return matchesText(record.material_name, filters.material);
    });
  }, [filters, usedMaterials]);

  useEffect(() => {
    if (!filteredUsedMaterials.length) {
      if (selectedRecordId !== null) {
        setSelectedRecordId(null);
      }
      return;
    }

    const stillVisible = filteredUsedMaterials.some(
      (record) => String(record.id) === String(selectedRecordId)
    );

    if (!stillVisible) {
      setSelectedRecordId(filteredUsedMaterials[0].id);
    }
  }, [filteredUsedMaterials, selectedRecordId]);

  const selectedRecord = useMemo(
    () =>
      filteredUsedMaterials.find((record) => String(record.id) === String(selectedRecordId)) || null,
    [filteredUsedMaterials, selectedRecordId]
  );

  useEffect(() => {
    setReviewReason("");
    setReviewQuantity(selectedRecord?.quantity_used ?? undefined);
  }, [selectedRecord]);

  const approvalMetrics = useMemo(
    () => ({
      total: filteredUsedMaterials.length,
      pending: filteredUsedMaterials.filter(
        (record) => resolveStatus(record) === "PENDING"
      ).length,
      approved: filteredUsedMaterials.filter(
        (record) => resolveStatus(record) === "APPROVED"
      ).length,
      adjusted: filteredUsedMaterials.filter(
        (record) => resolveStatus(record) === "ADJUSTED"
      ).length,
    }),
    [filteredUsedMaterials]
  );

  const searchConfig = useMemo(
    () => ({
      title: "Filtros de evidencias",
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

  const columns = [
    {
      title: "Orden",
      dataIndex: "work_order_id",
      key: "work_order_id",
      width: 180,
      render: (value) => String(value).slice(0, 8),
    },
    {
      title: "Material",
      key: "material",
      width: 300,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="font-semibold text-[var(--ui-foreground)]">{record.material_name}</div>
          <div className="text-sm ui-text-muted">{record.material_unit || "Sin unidad"}</div>
        </div>
      ),
    },
    {
      title: "Uso",
      key: "quantity_used",
      width: 180,
      render: (_, record) => (
        <div className="grid gap-1">
          <div>{record.quantity_used}</div>
          <div className="text-sm ui-text-muted">
            {record.material_unit || "unidad"}
          </div>
        </div>
      ),
    },
    {
      title: "Fotos",
      key: "photos",
      width: 140,
      render: (_, record) => `${record.photos?.filter((photo) => photo.file).length || 0} adjuntas`,
    },
    {
      title: "Estado",
      key: "approval_status",
      width: 180,
      render: (_, record) => {
        const status = resolveStatus(record);
        return (
          <Tag color={STATUS_COLORS[status] || "default"}>
            {STATUS_LABELS[status] || status}
          </Tag>
        );
      },
    },
  ];

  return (
    <PageLayout
      title="Evidencias y material"
      searchConfig={searchConfig}
    >
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.48fr)_minmax(22rem,0.92fr)]">
        <div className="2xl:col-span-2">
          <ModuleStatStrip
            badge="Evidencias"
            description="Selecciona una solicitud de material y revisa fotos, cantidad y decision desde el mismo panel."
            stats={[
              {
                label: "Visibles",
                value: approvalMetrics.total,
                help: "registros filtrados",
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
                help: "con cambio",
              },
            ]}
          />
        </div>

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Revisión de material usado
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                La tabla lista solicitudes y el panel lateral resuelve la revisión completa.
              </div>
            </div>
            <Tag color="purple">{filteredUsedMaterials.length} visibles</Tag>
          </div>
          <Table
            rowKey="id"
            dataSource={filteredUsedMaterials}
            columns={columns}
            loading={isLoading || approvalMutation.isPending}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 920 }}
            onRow={(record) => ({
              onClick: () => setSelectedRecordId(record.id),
              className:
                String(selectedRecordId) === String(record.id)
                  ? "bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))]"
                  : undefined,
            })}
          />
        </Card>

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Evidencia activa
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Revisa fotos, cantidad y registra tu decision sin abrir ventanas aparte.
              </div>
            </div>
            {selectedRecord ? (
              <Tag color={STATUS_COLORS[resolveStatus(selectedRecord)] || "default"}>
                {STATUS_LABELS[resolveStatus(selectedRecord)] || resolveStatus(selectedRecord)}
              </Tag>
            ) : null}
          </div>

          {selectedRecord ? (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Orden</div>
                  <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                    {String(selectedRecord.work_order_id).slice(0, 8)}
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    {selectedRecord.material_name}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] ui-text-muted">Cantidad usada</div>
                  <div className="mt-2 font-medium text-[var(--ui-foreground)]">
                    {selectedRecord.quantity_used}
                  </div>
                  <div className="mt-1 text-sm ui-text-muted">
                    {selectedRecord.material_unit || "unidad"}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_97%,transparent)] p-4">
                <div className="text-sm font-medium text-[var(--ui-foreground)]">
                  Evidencias adjuntas
                </div>
                <div className="mt-3">
                  {selectedRecord.photos?.filter((photo) => photo.file).length ? (
                    <Image.PreviewGroup>
                      {selectedRecord.photos
                        .filter((photo) => photo.file)
                        .map((photo) => (
                          <Image
                            key={photo.id}
                            width={120}
                            src={photo.file}
                            alt="evidencia"
                            className="h-[7.5rem] rounded-2xl border border-[var(--ui-border)] object-cover"
                          />
                        ))}
                    </Image.PreviewGroup>
                  ) : (
                    <div className="text-sm ui-text-muted">Sin fotos adjuntas.</div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--ui-foreground)]">
                    Cantidad aprobada
                  </label>
                  <InputNumber
                    className="w-full"
                    min={0}
                    value={reviewQuantity}
                    onChange={setReviewQuantity}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--ui-foreground)]">
                    Motivo de rechazo
                  </label>
                  <Input.TextArea
                    rows={4}
                    value={reviewReason}
                    onChange={(event) => setReviewReason(event.target.value)}
                    placeholder="Explica por que se rechaza la evidencia"
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="primary"
                  onClick={() =>
                    approvalMutation.mutate({
                      action: "approve",
                      record: selectedRecord,
                      payload: {},
                    })
                  }
                  disabled={resolveStatus(selectedRecord) === "APPROVED"}
                  loading={approvalMutation.isPending}
                >
                  Aprobar
                </Button>
                <Button
                  onClick={() =>
                    approvalMutation.mutate({
                      action: "adjust",
                      record: selectedRecord,
                      payload: { quantity: Number(reviewQuantity) },
                    })
                  }
                  disabled={reviewQuantity == null || Number(reviewQuantity) < 0}
                  loading={approvalMutation.isPending}
                >
                  Ajustar cantidad
                </Button>
                <Button
                  danger
                  onClick={() =>
                    approvalMutation.mutate({
                      action: "reject",
                      record: selectedRecord,
                      payload: { reason: reviewReason.trim() },
                    })
                  }
                  disabled={!reviewReason.trim() || resolveStatus(selectedRecord) === "REJECTED"}
                  loading={approvalMutation.isPending}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm ui-text-muted">
              No hay evidencias disponibles con los filtros actuales.
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default MaterialApprovals;
