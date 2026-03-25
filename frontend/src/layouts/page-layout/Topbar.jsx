import { Button } from "@/lib/antd-compat";
import { PiListBold } from "react-icons/pi";
import { useSidebar } from "@context/SidebarProvider";
import UserMenu from "./UserMenu";
import TopbarSearchButton from "./TopbarSearchButton";

const Topbar = ({ title, searchConfig, children }) => {
  const { isMobile, openMobileSidebar } = useSidebar();

  return (
    <div className="page-topbar relative min-w-0 self-start overflow-visible rounded-[28px] border border-[var(--ui-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ui-card)_96%,transparent),color-mix(in_srgb,var(--ui-highlight)_4%,var(--ui-card)))] px-3 py-3 shadow-[var(--ui-shadow-soft)] backdrop-blur-xl md:px-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          {isMobile ? (
            <Button
              className="shrink-0 lg:hidden"
              color="default"
              variant="filled"
              icon={<PiListBold size={18} />}
              onClick={openMobileSidebar}
              aria-label="Abrir menú lateral"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="m-0 truncate text-[clamp(1.2rem,2.4vw,1.55rem)] font-semibold tracking-[-0.04em] text-[var(--ui-foreground)]">
              {title}
            </h1>
          </div>
        </div>
        <div className="page-topbar-actions flex min-w-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          <TopbarSearchButton config={searchConfig} />
          {children}
          <UserMenu />
        </div>
      </div>
    </div>
  );
};

export default Topbar;
