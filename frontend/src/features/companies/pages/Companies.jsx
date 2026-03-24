import { useCallback, useMemo, useState } from "react";
import { Card, Table, Tag } from "@/lib/antd-compat";
import { useMutation, useQuery } from "@tanstack/react-query";
import ModuleOverview from "@components/ModuleOverview";
import PageLayout from "@layouts/page-layout/PageLayout";
import { getCompanies, updateCompany } from "@api/companyService";
import { useDialog } from "@context/DialogProvider";
import { useMessage } from "@context/MessageProvider";
import queryClient from "@lib/queryClient";
import { matchesText } from "@/lib/filtering";

const Companies = () => {
  const { success, error } = useMessage();
  const { openContextMenu } = useDialog();
  const [filters, setFilters] = useState({
    name: "",
    slug: "",
    email: "",
    city: "",
    status: null,
    plan: null,
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies,
  });

  const updateMutation = useMutation({
    mutationFn: ({ slug, payload }) => updateCompany(slug, payload),
    onSuccess: () => {
      success("Empresa actualizada");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: () => error("No se pudo actualizar la empresa"),
  });

  const planOptions = useMemo(() => {
    const names = [...new Set(companies.map((company) => company.plan_name).filter(Boolean))];
    return names.map((name) => ({ value: name, label: name }));
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      if (filters.status === "active" && !company.is_active) {
        return false;
      }
      if (filters.status === "inactive" && company.is_active) {
        return false;
      }
      if (filters.plan && company.plan_name !== filters.plan) {
        return false;
      }

      if (!matchesText(company.name, filters.name)) {
        return false;
      }
      if (!matchesText(company.slug, filters.slug)) {
        return false;
      }
      if (!matchesText(company.email, filters.email)) {
        return false;
      }
      return matchesText(`${company.city || ""} ${company.country || ""}`, filters.city);
    });
  }, [companies, filters]);

  const metrics = useMemo(
    () => ({
      total: companies.length,
      active: companies.filter((company) => company.is_active).length,
      technicians: companies.reduce(
        (sum, company) => sum + (company.technician_count || 0),
        0
      ),
      activeOrders: companies.reduce(
        (sum, company) => sum + (company.active_orders || 0),
        0
      ),
    }),
    [companies]
  );

  const openCompanyContextMenu = useCallback(
    (event, company) => {
      openContextMenu({
        event,
        items: [
          {
            key: "toggle-active",
            label: company.is_active ? "Desactivar empresa" : "Activar empresa",
            onClick: () =>
              updateMutation.mutate({
                slug: company.slug,
                payload: { is_active: !company.is_active },
              }),
          },
          {
            key: "toggle-trial",
            label: company.is_trial ? "Cerrar periodo de prueba" : "Reactivar prueba",
            onClick: () =>
              updateMutation.mutate({
                slug: company.slug,
                payload: { is_trial: !company.is_trial },
              }),
          },
        ],
      });
    },
    [openContextMenu, updateMutation]
  );

  const columns = [
    {
      title: "Empresa",
      key: "name",
      render: (_, company) => (
        <div className="grid gap-1">
          <span className="font-semibold">{company.name}</span>
          <span className="text-xs ui-text-muted">/{company.slug}</span>
        </div>
      ),
    },
    {
      title: "Contacto",
      key: "contact",
      render: (_, company) => (
        <div className="grid gap-1">
          <span>{company.email}</span>
          <span className="text-xs ui-text-muted">{company.phone || "Sin teléfono"}</span>
        </div>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan_name",
      key: "plan_name",
      render: (value) => value || "Sin plan",
    },
    {
      title: "Equipo",
      key: "team",
      render: (_, company) => (
        <div className="grid gap-1">
          <span>{company.user_count || 0} usuarios</span>
          <span className="text-xs ui-text-muted">
            {company.technician_count || 0} técnicos
          </span>
        </div>
      ),
    },
    {
      title: "Operación",
      key: "ops",
      render: (_, company) => (
        <div className="grid gap-1">
          <span>{company.active_orders || 0} órdenes activas</span>
          <span className="text-xs ui-text-muted">
            {company.city || "Sin ciudad"}, {company.country || "Sin país"}
          </span>
        </div>
      ),
    },
    {
      title: "Estado",
      key: "status",
      render: (_, company) => (
        <div className="flex flex-wrap gap-2">
          <Tag color={company.is_active ? "green" : "red"}>
            {company.is_active ? "Activa" : "Inactiva"}
          </Tag>
          <Tag color={company.is_trial ? "gold" : "blue"}>
            {company.is_trial ? "Prueba" : "Pago"}
          </Tag>
        </div>
      ),
    },
  ];

  const searchConfig = useMemo(
    () => ({
      title: "Buscar y filtrar empresas",
      values: filters,
      fields: [
        {
          key: "name",
          label: "Empresa",
          placeholder: "Nombre de la empresa",
        },
        {
          key: "slug",
          label: "Slug",
          placeholder: "Slug o identificador",
        },
        {
          key: "email",
          label: "Correo",
          placeholder: "Correo de contacto",
        },
        {
          key: "city",
          label: "Ciudad / pais",
          placeholder: "Ciudad o pais",
        },
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "active", label: "Activa" },
            { value: "inactive", label: "Inactiva" },
          ],
        },
        {
          key: "plan",
          label: "Plan",
          type: "select",
          options: planOptions,
        },
      ],
      onChange: (nextFilters) => setFilters((prev) => ({ ...prev, ...nextFilters })),
      onReset: () =>
        setFilters({
          name: "",
          slug: "",
          email: "",
          city: "",
          status: null,
          plan: null,
        }),
      onRefresh: () => queryClient.invalidateQueries({ queryKey: ["companies"] }),
    }),
    [filters, planOptions]
  );

  return (
    <PageLayout
      title="Empresas"
      searchConfig={searchConfig}
    >
      <div className="grid gap-6">
        <ModuleOverview
          badge="Empresas"
          title="Empresas"
          subtitle="Estado, plan y operacion."
          tags={["Empresas", "Planes", "Operacion"]}
          stats={[
            {
              label: "Empresas",
              value: metrics.total,
              help: "registradas",
            },
            {
              label: "Activas",
              value: metrics.active,
              help: "en operacion",
            },
            {
              label: "Tecnicos",
              value: metrics.technicians,
              help: "acumulados",
            },
            {
              label: "Ordenes",
              value: metrics.activeOrders,
              help: "activas",
            },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">Empresas</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.total}</div>
          </Card>
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">Activas</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.active}</div>
          </Card>
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">Técnicos</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.technicians}</div>
          </Card>
          <Card className="rounded-2xl">
            <div className="text-sm ui-text-muted">Órdenes activas</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.activeOrders}</div>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <div className="mb-3 text-xs ui-text-muted">
            Clic derecho en una empresa para activarla, desactivarla o ajustar su estado.
          </div>
          <Table
            rowKey="id"
            dataSource={filteredCompanies}
            columns={columns}
            loading={isLoading || updateMutation.isPending}
            onRow={(company) => ({
              onContextMenu: (event) => openCompanyContextMenu(event, company),
            })}
            pagination={{ pageSize: 8 }}
          />
        </Card>
      </div>
    </PageLayout>
  );
};

export default Companies;
