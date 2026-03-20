import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef(function PopoverContent(
  { className, align = "center", sideOffset = 10, ...props },
  ref
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[1200] w-auto rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-popover)] p-4 text-[var(--ui-popover-foreground)] shadow-[var(--ui-shadow-card)] outline-none backdrop-blur-xl will-change-[opacity,transform] transition-[opacity,transform] duration-180 ease-out data-[state=closed]:translate-y-1.5 data-[state=closed]:scale-[0.98] data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100 origin-[var(--radix-popover-content-transform-origin)]",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
