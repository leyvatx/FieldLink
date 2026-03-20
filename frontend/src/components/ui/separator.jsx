import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

const Separator = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) => (
  <SeparatorPrimitive.Root
    decorative={decorative}
    orientation={orientation}
    data-slot="separator"
    className={cn(
      "shrink-0 bg-[var(--ui-border)]",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
    {...props}
  />
);

export default Separator;
