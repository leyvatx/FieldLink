import { Card } from "@/lib/antd-compat";
import { cn } from "@/lib/utils";

const ModuleStatStrip = ({ badge, description, stats = [], className }) => {
  return (
    <Card
      className={cn(
        "rounded-[28px] border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ui-card)_94%,transparent),color-mix(in_srgb,var(--ui-highlight)_6%,var(--ui-card)))]",
        className
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 max-w-xl">
          {badge ? (
            <div className="inline-flex w-fit items-center rounded-full border border-[color:color-mix(in_srgb,var(--ui-highlight)_18%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_7%,var(--ui-card))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-muted-foreground)]">
              {badge}
            </div>
          ) : null}
          {description ? (
            <p className="mt-3 text-sm leading-6 text-[var(--ui-muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>

        {stats.length ? (
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[52rem] xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[22px] border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_96%,transparent)] px-4 py-3 shadow-[var(--ui-shadow-soft)]"
              >
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]">
                  {stat.label}
                </div>
                <div className="mt-2 text-2xl font-semibold text-[var(--ui-foreground)]">
                  {stat.value}
                </div>
                {stat.help ? (
                  <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                    {stat.help}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default ModuleStatStrip;
