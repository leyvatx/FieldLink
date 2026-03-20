import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-input)] px-3 py-2 text-sm text-[var(--ui-foreground)] shadow-[var(--ui-shadow-soft)] outline-none transition-[border,box-shadow,background] placeholder:text-[var(--ui-muted-foreground)] focus-visible:border-[var(--ui-ring-strong)] focus-visible:ring-[3px] focus-visible:ring-[var(--ui-ring)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
});

export default Input;
