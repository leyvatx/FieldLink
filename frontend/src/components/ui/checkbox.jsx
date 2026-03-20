import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { PiCheckBold } from "react-icons/pi";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="checkbox"
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-card)] text-[var(--ui-primary)] shadow-[var(--ui-shadow-soft)] outline-none transition focus-visible:ring-[3px] focus-visible:ring-[var(--ui-ring)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--ui-primary)] data-[state=checked]:bg-[var(--ui-primary)] data-[state=checked]:text-[var(--ui-primary-foreground)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <PiCheckBold size={12} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

export default Checkbox;
