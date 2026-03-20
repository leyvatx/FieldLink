import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex min-h-[112px] w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-input)] px-3 py-2 text-sm text-[var(--ui-foreground)] shadow-[var(--ui-shadow-soft)] outline-none transition-[border,box-shadow,background] placeholder:text-[var(--ui-muted-foreground)] focus-visible:border-[var(--ui-ring-strong)] focus-visible:ring-[3px] focus-visible:ring-[var(--ui-ring)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
});

export default Textarea;
