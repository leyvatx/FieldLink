/* eslint-disable react-refresh/only-export-components */
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-[0.01em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[var(--ui-border)] bg-[var(--ui-secondary)] text-[var(--ui-secondary-foreground)]",
        secondary:
          "border-transparent bg-[var(--ui-accent)] text-[var(--ui-accent-foreground)]",
        destructive:
          "border-transparent bg-[var(--ui-destructive)] text-[var(--ui-destructive-foreground)]",
        outline:
          "border-[var(--ui-border)] bg-transparent text-[var(--ui-foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = ({ className, variant, ...props }) => {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
};

export { Badge, badgeVariants };
export default Badge;
