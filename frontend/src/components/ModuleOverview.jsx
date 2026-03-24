import { Card } from "@/lib/antd-compat";
import { cn } from "@/lib/utils";

const tones = [
  "from-[#E879F9]/14 via-[#8B5CF6]/8 to-transparent",
  "from-[#60A5FA]/14 via-[#8B5CF6]/7 to-transparent",
  "from-[#34D399]/14 via-[#8B5CF6]/7 to-transparent",
  "from-[#F59E0B]/14 via-[#8B5CF6]/7 to-transparent",
];

const ModuleOverview = ({
  badge,
  title,
  subtitle,
  stats = [],
  tags = [],
  aside = null,
  className,
}) => {
  return (
    <div className="grid gap-4">
      <Card
        className={cn(
          "relative min-w-0 overflow-hidden rounded-[32px] border-[color:color-mix(in_srgb,var(--ui-highlight)_22%,var(--ui-border))] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--ui-card)_76%,transparent),color-mix(in_srgb,var(--ui-highlight)_10%,var(--ui-card)))]",
          className
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--ui-highlight)_18%,transparent),transparent_36%)]" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-44 w-44 rounded-full bg-[color:color-mix(in_srgb,var(--ui-highlight)_12%,transparent)] blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {badge ? (
              <div className="inline-flex w-fit items-center rounded-full border border-[color:color-mix(in_srgb,var(--ui-highlight)_20%,var(--ui-border))] bg-[color:color-mix(in_srgb,var(--ui-highlight)_8%,var(--ui-card))] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                {badge}
              </div>
            ) : null}
            <h2 className="mt-4 text-[clamp(1.65rem,3vw,2.6rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-[var(--ui-foreground)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-sm text-[var(--ui-muted-foreground)] md:text-base">
                {subtitle}
              </p>
            ) : null}
            {tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-[var(--ui-border)] bg-[color:color-mix(in_srgb,var(--ui-card)_92%,transparent)] px-3 py-1 text-xs font-medium text-[var(--ui-muted-foreground)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {aside ? <div className="min-w-0 lg:max-w-[22rem]">{aside}</div> : null}
        </div>
      </Card>

      {stats.length ? (
        <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", stats.length === 3 && "xl:grid-cols-3")}>
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className="relative min-w-0 overflow-hidden rounded-[26px]"
            >
              <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", stat.tone || tones[index % tones.length])} />
              <div className="relative">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-muted-foreground)]">
                  {stat.label}
                </div>
                <div className="mt-3 text-3xl font-semibold text-[var(--ui-foreground)]">
                  {stat.value}
                </div>
                {stat.help ? (
                  <div className="mt-1 text-sm text-[var(--ui-muted-foreground)]">
                    {stat.help}
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ModuleOverview;
