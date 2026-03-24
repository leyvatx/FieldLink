import { Button, Card } from "@/lib/antd-compat";
import { PiListBold } from "react-icons/pi";
import { useSidebar } from "@context/SidebarProvider";
import UserMenu from "./UserMenu";
import TopbarSearchButton from "./TopbarSearchButton";

const Topbar = ({ title, searchConfig, children }) => {
  const { isMobile, openMobileSidebar } = useSidebar();

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
