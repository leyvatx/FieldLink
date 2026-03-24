/* eslint-disable react-refresh/only-export-components */
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium outline-none transition-[transform,box-shadow,background-color,border-color,color,filter] focus-visible:ring-[3px] focus-visible:ring-[var(--ui-ring)] disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--ui-shadow-button)] hover:-translate-y-px hover:brightness-[1.06]",
        destructive:
          "bg-[var(--ui-destructive)] text-[var(--ui-destructive-foreground)] shadow-[var(--ui-shadow-button)] hover:-translate-y-px hover:brightness-[1.06]",
        outline:
          "border border-[var(--ui-border)] bg-[var(--ui-card)] text-[var(--ui-foreground)] shadow-[var(--ui-shadow-soft)] hover:-translate-y-px hover:border-[var(--ui-highlight-outline)] hover:bg-[var(--ui-accent)] hover:text-[var(--ui-accent-foreground)]",
        secondary:
          "bg-[var(--ui-secondary)] text-[var(--ui-secondary-foreground)] hover:-translate-y-px hover:bg-[var(--ui-accent)]",
        ghost:
          "text-[var(--ui-foreground)] hover:bg-[var(--ui-accent)] hover:text-[var(--ui-accent-foreground)]",
        link: "text-[var(--ui-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
        pill: "h-11 rounded-full px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

export default Button;
