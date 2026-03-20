import { Card } from "@/lib/antd-compat";
import UserMenu from "./UserMenu";
import TopbarSearchButton from "./TopbarSearchButton";

const Topbar = ({ title, searchConfig, children }) => {
  return (
    <Card
      className="overflow-visible border-[var(--ui-border)] bg-[var(--ui-card)]"
      styles={{ body: { padding: 12 } }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-[1.65rem] font-semibold tracking-[-0.04em] text-[var(--ui-foreground)]">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <TopbarSearchButton config={searchConfig} />
          {children}
          <UserMenu />
        </div>
      </div>
    </Card>
  );
};

export default Topbar;
