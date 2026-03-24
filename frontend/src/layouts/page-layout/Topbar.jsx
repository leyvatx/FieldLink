import { Button, Card } from "@/lib/antd-compat";
import { PiListBold } from "react-icons/pi";
import { useSidebar } from "@context/SidebarProvider";
import { useLocation } from "react-router-dom";
import UserMenu from "./UserMenu";
import TopbarSearchButton from "./TopbarSearchButton";

const MODULE_CONTEXT = [
  { match: (pathname) => pathname === "/" || pathname.startsWith("/dashboard"), items: ["Cobertura", "Despacho", "Mapa"] },
  { match: (pathname) => pathname.startsWith("/inventory"), items: ["Catalogo", "Almacen", "Movimientos"] },
  { match: (pathname) => pathname.startsWith("/customers"), items: ["Base", "Validacion", "Historial"] },
  { match: (pathname) => pathname.startsWith("/users"), items: ["Equipo", "Roles", "Estado"] },
  { match: (pathname) => pathname.startsWith("/work-orders"), items: ["Prioridad", "Asignacion", "Seguimiento"] },
  { match: (pathname) => pathname.startsWith("/assignments"), items: ["Pendientes", "Tecnicos", "Carga"] },
  { match: (pathname) => pathname.startsWith("/service-requests"), items: ["Entrada", "Validacion", "Ordenes"] },
  { match: (pathname) => pathname.startsWith("/materials-approval"), items: ["Evidencias", "Cantidades", "Revision"] },
  { match: (pathname) => pathname.startsWith("/companies"), items: ["Empresas", "Planes", "Operacion"] },
  { match: (pathname) => pathname.startsWith("/subscription"), items: ["Planes", "Limites", "Facturacion"] },
  { match: (pathname) => pathname.startsWith("/roles-permissions"), items: ["Roles", "Permisos", "Importacion"] },
  { match: (pathname) => pathname.startsWith("/release-notes"), items: ["Versiones", "Cambios", "Publicacion"] },
  { match: (pathname) => pathname.startsWith("/log"), items: ["Actividad", "Auditoria", "Tiempo"] },
  { match: (pathname) => pathname.startsWith("/profile"), items: ["Cuenta", "Seguridad", "Preferencias"] },
  { match: (pathname) => pathname.startsWith("/agenda"), items: ["Ruta", "Evidencias", "Material"] },
];

const Topbar = ({ title, searchConfig, children }) => {
  const { isMobile, openMobileSidebar } = useSidebar();
  const { pathname } = useLocation();
  const contextItems =
    MODULE_CONTEXT.find((entry) => entry.match(pathname))?.items ?? [];

  return (
    <Card
      className="page-topbar overflow-visible border-[var(--ui-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ui-card)_95%,transparent),color-mix(in_srgb,var(--ui-highlight)_5%,var(--ui-card)))]"
      styles={{ body: { padding: 12 } }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {isMobile ? (
            <Button
              className="shrink-0 lg:hidden"
              color="default"
              variant="filled"
              icon={<PiListBold size={18} />}
              onClick={openMobileSidebar}
              aria-label="Abrir menu lateral"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.65rem] font-semibold tracking-[-0.04em] text-[var(--ui-foreground)]">
              {title}
            </h1>
            {contextItems.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {contextItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="page-topbar-actions flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <TopbarSearchButton config={searchConfig} />
          {children}
          <UserMenu />
        </div>
      </div>
    </Card>
  );
};

export default Topbar;
