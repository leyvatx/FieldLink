import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { PiCaretRightBold } from "react-icons/pi";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef(function DropdownMenuSubTrigger(
  { className, inset, children, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-xl px-3 py-2 text-sm outline-none transition focus:bg-[var(--ui-accent)] data-[state=open]:bg-[var(--ui-accent)]",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <PiCaretRightBold className="ml-auto" size={12} />
    </DropdownMenuPrimitive.SubTrigger>
  );
});

const DropdownMenuSubContent = React.forwardRef(function DropdownMenuSubContent(
  { className, ...props },
  ref
) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        sideOffset={8}
        collisionPadding={12}
        className={cn(
          "z-[1205] min-w-[12rem] max-h-[min(70vh,24rem)] max-w-[min(calc(100vw-1rem),22rem)] overflow-auto overscroll-contain rounded-[1.1rem] border border-[var(--ui-border)] bg-[var(--ui-popover)] p-2 text-[var(--ui-popover-foreground)] shadow-[var(--ui-shadow-card)] will-change-[opacity,transform] transition-[opacity,transform] duration-180 ease-out data-[state=closed]:translate-x-1.5 data-[state=closed]:scale-[0.98] data-[state=closed]:opacity-0 data-[state=open]:translate-x-0 data-[state=open]:scale-100 data-[state=open]:opacity-100 origin-[var(--radix-dropdown-menu-content-transform-origin)]",
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  );
});

const DropdownMenuContent = React.forwardRef(function DropdownMenuContent(
  { className, sideOffset = 8, ...props },
  ref
) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "z-[1200] min-w-[12rem] max-h-[min(70vh,24rem)] max-w-[min(calc(100vw-1rem),22rem)] overflow-auto overscroll-contain rounded-[1.1rem] border border-[var(--ui-border)] bg-[var(--ui-popover)] p-2 text-[var(--ui-popover-foreground)] shadow-[var(--ui-shadow-card)] will-change-[opacity,transform] transition-[opacity,transform] duration-180 ease-out data-[state=closed]:translate-y-1.5 data-[state=closed]:scale-[0.98] data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100 origin-[var(--radix-dropdown-menu-content-transform-origin)]",
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  );
});

const DropdownMenuItem = React.forwardRef(function DropdownMenuItem(
  { className, inset, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition focus:bg-[var(--ui-accent)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
});

const DropdownMenuLabel = React.forwardRef(function DropdownMenuLabel(
  { className, inset, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        "px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ui-muted-foreground)]",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
});

const DropdownMenuSeparator = React.forwardRef(function DropdownMenuSeparator(
  { className, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-[var(--ui-border)]", className)}
      {...props}
    />
  );
});

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
