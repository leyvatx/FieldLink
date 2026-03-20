import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef(function TooltipContent(
  { className, sideOffset = 8, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-[1300] overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-popover)] px-3 py-2 text-xs text-[var(--ui-popover-foreground)] shadow-[var(--ui-shadow-soft)] backdrop-blur-xl",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
