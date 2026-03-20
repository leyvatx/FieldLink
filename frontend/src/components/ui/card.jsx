import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }) => (
  <div
    data-slot="card"
    className={cn(
      "rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-card)] text-[var(--ui-card-foreground)] shadow-[var(--ui-shadow-card)] backdrop-blur-xl",
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }) => (
  <div
    data-slot="card-header"
    className={cn("flex flex-col gap-1.5 px-6 pt-6", className)}
    {...props}
  />
);

export const CardTitle = ({ className, ...props }) => (
  <div
    data-slot="card-title"
    className={cn("text-base font-semibold tracking-[-0.02em]", className)}
    {...props}
  />
);

export const CardDescription = ({ className, ...props }) => (
  <div
    data-slot="card-description"
    className={cn("text-sm text-[var(--ui-muted-foreground)]", className)}
    {...props}
  />
);

export const CardContent = ({ className, ...props }) => (
  <div
    data-slot="card-content"
    className={cn("px-6 py-5", className)}
    {...props}
  />
);

export const CardFooter = ({ className, ...props }) => (
  <div
    data-slot="card-footer"
    className={cn("flex items-center gap-3 px-6 pb-6", className)}
    {...props}
  />
);

export default Card;
