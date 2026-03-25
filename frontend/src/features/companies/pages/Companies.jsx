import { useCallback, useMemo, useState } from "react";
import { Button, Card, Dropdown, Table, Tag } from "@/lib/antd-compat";
import { PiDotsThreeVertical } from "react-icons/pi";
import { useMutation, useQuery } from "@tanstack/react-query";
import ModuleStatStrip from "@components/ModuleStatStrip";
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
      total: filteredCompanies.length,
      active: filteredCompanies.filter((company) => company.is_active).length,
      technicians: filteredCompanies.reduce(
        (sum, company) => sum + (company.technician_count || 0),
        0
      ),
      activeOrders: filteredCompanies.reduce(
        (sum, company) => sum + (company.active_orders || 0),
        0
      ),
    }),
    [filteredCompanies]
  );

  const getCompanyMenuItems = useCallback(
    (company) => [
      {
        key: `active-${company.slug}`,
        label: company.is_active ? "Desactivar empresa" : "Activar empresa",
        onClick: () =>
          updateMutation.mutate({
            slug: company.slug,
            payload: { is_active: !company.is_active },
          }),
      },
      {
        key: `trial-${company.slug}`,
        label: company.is_trial ? "Cerrar periodo de prueba" : "Reactivar prueba",
        onClick: () =>
          updateMutation.mutate({
            slug: company.slug,
            payload: { is_trial: !company.is_trial },
          }),
      },
    ],
    [updateMutation]
  );

  const openCompanyContextMenu = useCallback(
    (event, company) => {
      openContextMenu({
        event,
        items: getCompanyMenuItems(company),
      });
    },
    [getCompanyMenuItems, openContextMenu]
  );

  const columns = [
    {
      title: "Empresa",
      key: "name",
      width: 260,
      render: (_, company) => (
        <div className="grid gap-1">
          <span className="font-semibold text-[var(--ui-foreground)]">{company.name}</span>
          <span className="text-xs ui-text-muted">/{company.slug}</span>
        </div>
      ),
    },
    {
      title: "Contacto",
      key: "contact",
      width: 260,
      render: (_, company) => (
        <div className="grid gap-1">
          <span>{company.email}</span>
          <span className="text-xs ui-text-muted">{company.phone || "Sin teléfono"}</span>
        </div>
      ),
    },
    {
      title: "Plan y estado",
      key: "plan",
      width: 220,
      render: (_, company) => (
        <div className="flex flex-wrap gap-2">
          <Tag color="blue">{company.plan_name || "Sin plan"}</Tag>
          <Tag color={company.is_active ? "green" : "red"}>
            {company.is_active ? "Activa" : "Inactiva"}
          </Tag>
          <Tag color={company.is_trial ? "gold" : "purple"}>
            {company.is_trial ? "Prueba" : "Pago"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Operación",
      key: "ops",
      width: 240,
      render: (_, company) => (
        <div className="grid gap-1">
          <span>{company.active_orders || 0} ordenes activas</span>
          <span className="text-xs ui-text-muted">
            {(company.user_count || 0) + " usuarios"} · {(company.technician_count || 0) + " técnicos"}
          </span>
          <span className="text-xs ui-text-muted">
            {company.city || "Sin ciudad"}, {company.country || "Sin pais"}
          </span>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 72,
      align: "right",
      render: (_, company) => (
        <Dropdown menu={{ items: getCompanyMenuItems(company) }} placement="bottomRight">
          <Button
            type="text"
            size="small"
            icon={<PiDotsThreeVertical size={16} />}
            aria-label={`Acciones de ${company.name}`}
          />
        </Dropdown>
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
    <PageLayout title="Empresas" searchConfig={searchConfig}>
      <div className="grid gap-4">
        <ModuleStatStrip
          badge="Empresas"
          description="Vista compacta para revisar estado, plan y carga operativa sin esconder la tabla."
          stats={[
            {
              label: "Visibles",
              value: metrics.total,
              help: "empresas filtradas",
            },
            {
              label: "Activas",
              value: metrics.active,
              help: "operando",
            },
            {
              label: "Técnicos",
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

        <Card className="rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--ui-foreground)]">
                Operación por empresa
              </div>
              <div className="mt-1 text-sm ui-text-muted">
                Las acciones ya estan visibles en cada fila y el clic derecho sigue disponible.
              </div>
            </div>
            <Tag color="purple">{filteredCompanies.length} visibles</Tag>
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
            scroll={{ x: 1050 }}
          />
        </Card>
      </div>
    </PageLayout>
  );
};

export default Companies;
