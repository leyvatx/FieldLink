import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Select, Table, Tag } from "@/lib/antd-compat";
import ModuleStatStrip from "@components/ModuleStatStrip";
import PageLayout from "@layouts/page-layout/PageLayout";
import {
  createPublicLanding,
  deletePublicLanding,
  getPublicLandings,
  updatePublicLanding,
} from "@api/serviceRequestService";
import { useMessage } from "@context/MessageProvider";
import { matchesAnyText } from "@/lib/filtering";

const DEFAULT_FORM_VALUES = {
  name: "",
  slug: "",
  headline: "",
  subtitle: "",
  cta_text: "Enviar solicitud",
  is_active: true,
  is_default: false,
};

const normalizeLandings = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
};

const parseApiError = (errorResponse, fallbackMessage) => {
  const payload = errorResponse?.response?.data;
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (payload.error) {
    return payload.error;
  }

  if (payload.detail) {
    return payload.detail;
  }

  const messages = Object.values(payload)
    .flat()
    .map((item) => String(item))
    .join(" ");

  return messages || fallbackMessage;
};

const formatDateTime = (value) => {
  if (!value) {
    return "Sin fecha";
  }
  return dayjs(value).format("DD MMM YYYY HH:mm");
};

const toFormValues = (landing) => ({
  name: landing?.name || "",
  slug: landing?.slug || "",
  headline: landing?.headline || "",
  subtitle: landing?.subtitle || "",
  cta_text: landing?.cta_text || "Enviar solicitud",
  is_active: landing?.is_active ?? true,
  is_default: landing?.is_default ?? false,
});

const toPayload = (values) => ({
  name: values.name?.trim(),
  slug: values.slug?.trim() || "",
  headline: values.headline?.trim() || "",
  subtitle: values.subtitle?.trim() || "",
  cta_text: values.cta_text?.trim() || "Enviar solicitud",
  is_active: !!values.is_active,
  is_default: !!values.is_default,
});

const LandingManager = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { success, error, warning } = useMessage();

  const [editingLanding, setEditingLanding] = useState(null);
  const [filters, setFilters] = useState({
    query: "",
    status: null,
  });

  useEffect(() => {
    form.setFieldsValue(DEFAULT_FORM_VALUES);
  }, [form]);

  const {
    data: landingPayload,
    isLoading,
  } = useQuery({
    queryKey: ["public-landings"],
    queryFn: getPublicLandings,
  });

  const landings = useMemo(() => normalizeLandings(landingPayload), [landingPayload]);

  const filteredLandings = useMemo(() => {
    return landings.filter((landing) => {
      if (!matchesAnyText([landing.name, landing.slug, landing.headline], filters.query)) {
        return false;
      }

      if (filters.status === "ACTIVE" && !landing.is_active) {
        return false;
      }

      if (filters.status === "INACTIVE" && landing.is_active) {
        return false;
      }

      return true;
    });
  }, [filters.query, filters.status, landings]);

  const stats = useMemo(
    () => ({
      total: landings.length,
      active: landings.filter((item) => item.is_active).length,
      inactive: landings.filter((item) => !item.is_active).length,
      defaults: landings.filter((item) => item.is_default).length,
    }),
    [landings]
  );

  const refreshLandings = () => {
    queryClient.invalidateQueries({ queryKey: ["public-landings"] });
  };

  const resetEditor = () => {
    setEditingLanding(null);
    form.setFieldsValue(DEFAULT_FORM_VALUES);
  };

  const upsertMutation = useMutation({
    mutationFn: async (values) => {
      const payload = toPayload(values);
      if (editingLanding) {
        return updatePublicLanding(editingLanding.id, payload);
      }
      return createPublicLanding(payload);
    },
    onSuccess: () => {
      success(editingLanding ? "Landing actualizada" : "Landing creada");
      refreshLandings();
      resetEditor();
    },
    onError: (mutationError) => {
      error(parseApiError(mutationError, "No se pudo guardar la landing"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePublicLanding,
    onSuccess: () => {
      success("Landing eliminada");
      refreshLandings();
      if (editingLanding) {
        resetEditor();
      }
    },
    onError: (mutationError) => {
      error(parseApiError(mutationError, "No se pudo eliminar la landing"));
    },
  });

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      upsertMutation.mutate(values);
    } catch {
      // Validation errors are rendered by form items.
    }
  };

  const handleEdit = (landing) => {
    setEditingLanding(landing);
    form.setFieldsValue(toFormValues(landing));
  };

  const handleDelete = (landing) => {
    if (!window.confirm(`Eliminar landing "${landing.name}"?`)) {
      return;
    }
    deleteMutation.mutate(landing.id);
  };

  const copyLink = async (label, linkValue) => {
    if (!linkValue) {
      warning("No hay enlace disponible.");
      return;
    }

    try {
      await navigator.clipboard.writeText(linkValue);
      success(`${label} copiado`);
    } catch {
      warning(`No se pudo copiar automaticamente: ${linkValue}`);
    }
  };

  const searchConfig = useMemo(
    () => ({
      title: "Filtros de landing",
      values: filters,
      fields: [
        {
          key: "query",
          label: "Buscar",
          placeholder: "Nombre, slug o titulo",
        },
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "ACTIVE", label: "Activas" },
            { value: "INACTIVE", label: "Inactivas" },
          ],
        },
      ],
      onChange: (patch) => setFilters((prev) => ({ ...prev, ...patch })),
      onReset: () =>
        setFilters({
          query: "",
          status: null,
        }),
      onRefresh: refreshLandings,
    }),
    [filters]
  );

  const columns = [
    {
      title: "Landing",
      key: "landing",
      width: 280,
      render: (_, record) => (
        <div className="grid gap-1">
          <div className="font-semibold text-[var(--ui-foreground)]">{record.name}</div>
          <div className="text-sm ui-text-muted">/{record.slug}</div>
          {record.headline ? (
            <div className="text-sm ui-text-muted line-clamp-2">{record.headline}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Estado",
      key: "status",
      width: 180,
      render: (_, record) => (
        <div className="flex flex-wrap gap-2">
          <Tag color={record.is_active ? "green" : "red"}>
            {record.is_active ? "Activa" : "Inactiva"}
          </Tag>
          {record.is_default ? <Tag color="blue">Default</Tag> : null}
        </div>
      ),
    },
    {
      title: "Links",
      key: "links",
      width: 380,
      render: (_, record) => (
        <div className="grid gap-2">
          <div className="text-xs ui-text-muted break-all">
            {record.share_links?.path_url || "Sin enlace por ruta"}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              onClick={() => copyLink("Enlace de ruta", record.share_links?.path_url)}
            >
              Copiar ruta
            </Button>
            <Button
              size="small"
              onClick={() => copyLink("Enlace de subdominio", record.share_links?.subdomain_url)}
              disabled={!record.share_links?.subdomain_url}
            >
              Copiar subdominio
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: "Actualizado",
      key: "updated_at",
      width: 180,
      render: (_, record) => <span className="text-sm">{formatDateTime(record.updated_at)}</span>,
    },
    {
      title: "Acciones",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <div className="flex flex-wrap gap-2">
          <Button size="small" onClick={() => handleEdit(record)}>
            Editar
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout title="Landings publicas" searchConfig={searchConfig}>
      <div className="grid gap-4">
        <ModuleStatStrip
          badge="Portal clientes"
          description="Crea landings por empresa, comparte los enlaces y recibe solicitudes para convertirlas en ordenes."
          stats={[
            {
              label: "Total",
              value: stats.total,
              help: "landings registradas",
            },
            {
              label: "Activas",
              value: stats.active,
              help: "disponibles para clientes",
            },
            {
              label: "Inactivas",
              value: stats.inactive,
              help: "sin recibir formularios",
            },
            {
              label: "Default",
              value: stats.defaults,
              help: "landing principal",
            },
          ]}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="rounded-[28px]">
            <div className="mb-4">
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                {editingLanding ? "Editar landing" : "Crear landing"}
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Define nombre, slug y texto visible para el formulario publico.
              </div>
            </div>

            <Form form={form} layout="vertical" initialValues={DEFAULT_FORM_VALUES}>
              <Form.Item
                label="Nombre"
                name="name"
                rules={[{ required: true, message: "Ingresa el nombre de la landing." }]}
              >
                <Input placeholder="Landing principal" />
              </Form.Item>

              <Form.Item
                label="Slug"
                name="slug"
                extra="Opcional. Si lo dejas vacio se genera automaticamente."
              >
                <Input placeholder="principal" />
              </Form.Item>

              <Form.Item
                label="Titular"
                name="headline"
                extra="Texto principal visible para el cliente."
              >
                <Input placeholder="Agenda tu visita tecnica en minutos" />
              </Form.Item>

              <Form.Item label="Subtitulo" name="subtitle">
                <Input.TextArea rows={3} placeholder="Describe en pocas lineas como funciona." />
              </Form.Item>

              <Form.Item
                label="Texto del boton"
                name="cta_text"
                rules={[{ required: true, message: "Ingresa el texto del boton." }]}
              >
                <Input placeholder="Enviar solicitud" maxLength={80} />
              </Form.Item>

              <Form.Item
                label="Estado"
                name="is_active"
                rules={[{ required: true, message: "Selecciona el estado." }]}
              >
                <Select
                  options={[
                    { value: true, label: "Activa (recibe solicitudes)" },
                    { value: false, label: "Inactiva" },
                  ]}
                  showSearch={false}
                />
              </Form.Item>

              <Form.Item
                label="Default"
                name="is_default"
                rules={[{ required: true, message: "Selecciona si sera default." }]}
              >
                <Select
                  options={[
                    { value: false, label: "No" },
                    { value: true, label: "Si, usar como principal" },
                  ]}
                  showSearch={false}
                />
              </Form.Item>
            </Form>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="primary"
                onClick={handleSave}
                loading={upsertMutation.isPending}
                disabled={deleteMutation.isPending}
              >
                {editingLanding ? "Guardar cambios" : "Crear landing"}
              </Button>
              <Button onClick={resetEditor} disabled={upsertMutation.isPending || deleteMutation.isPending}>
                Limpiar
              </Button>
            </div>
          </Card>

          <Card className="rounded-[28px]">
            <div className="mb-4">
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Landings de la empresa
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Copia los links para compartirlos con clientes y recibir solicitudes directas.
              </div>
            </div>
            <Table
              rowKey="id"
              dataSource={filteredLandings}
              columns={columns}
              loading={isLoading || upsertMutation.isPending || deleteMutation.isPending}
              pagination={{ pageSize: 6 }}
              scroll={{ x: 1180 }}
            />
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default LandingManager;
