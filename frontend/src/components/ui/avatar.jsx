import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export const Avatar = ({ className, ...props }) => (
  <AvatarPrimitive.Root
    data-slot="avatar"
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary)] text-[var(--ui-foreground)] shadow-[var(--ui-shadow-soft)]",
      className
    )}
    {...props}
  />
);

export const AvatarImage = ({ className, ...props }) => (
  <AvatarPrimitive.Image
    data-slot="avatar-image"
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
);

export const AvatarFallback = ({ className, ...props }) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn("flex h-full w-full items-center justify-center text-sm font-semibold", className)}
    {...props}
  />
);

export default Avatar;
