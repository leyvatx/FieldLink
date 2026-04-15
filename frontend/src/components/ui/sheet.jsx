import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { PiXBold } from "react-icons/pi";
import { cn } from "@/lib/utils";

function isSelectPortalTarget(target) {
  return (
    target instanceof Element &&
    Boolean(target.closest(".fd-select__menu-portal, .fd-select__menu"))
  );
}

const Sheet = ({ children, ...props }) => (
  <DialogPrimitive.Root modal={false} {...props}>
    {children}
  </DialogPrimitive.Root>
);
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      forceMount
      ref={ref}
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-[1100] bg-[var(--ui-overlay)] backdrop-blur-md transition-[opacity,backdrop-filter] duration-220 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        className
      )}
      {...props}
    />
  );
});

const sheetVariants = cva(
  "fixed z-[1101] flex min-h-0 flex-col overflow-hidden overscroll-contain border border-[var(--ui-border)] bg-[var(--ui-card)] text-[var(--ui-card-foreground)] shadow-[var(--ui-shadow-dialog)] pointer-events-auto will-change-[opacity,transform] transition-[opacity,transform] duration-240 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 max-h-[100dvh] rounded-b-[1.5rem] border-b data-[state=closed]:-translate-y-6 data-[state=open]:translate-y-0",
        bottom: "inset-x-0 bottom-0 max-h-[100dvh] rounded-t-[1.5rem] border-t data-[state=closed]:translate-y-6 data-[state=open]:translate-y-0",
        left: "left-3 top-3 max-h-[calc(100dvh-1.5rem)] w-[min(94vw,30rem)] rounded-[1.75rem] border data-[state=closed]:-translate-x-8 data-[state=open]:translate-x-0",
        right: "right-3 top-3 max-h-[calc(100dvh-1.5rem)] w-[min(94vw,30rem)] rounded-[1.75rem] border data-[state=closed]:translate-x-8 data-[state=open]:translate-x-0",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

const SheetContent = React.forwardRef(function SheetContent(
  { className, children, side = "right", showClose = true, onInteractOutside, ...props },
  ref
) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        forceMount
        ref={ref}
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetVariants({ side }), className)}
        onInteractOutside={(event) => {
          if (isSelectPortalTarget(event.target)) {
            event.preventDefault();
            return;
          }

          onInteractOutside?.(event);
        }}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-2 text-[var(--ui-muted-foreground)] outline-none transition hover:bg-[var(--ui-accent)] hover:text-[var(--ui-accent-foreground)] focus-visible:ring-[3px] focus-visible:ring-[var(--ui-ring)]">
            <PiXBold size={14} />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});

const SheetHeader = ({ className, ...props }) => (
  <div className={cn("shrink-0 border-b border-[var(--ui-border)] px-4 py-4 pr-14 sm:px-6 sm:py-5 sm:pr-16", className)} {...props} />
);

const SheetFooter = ({ className, ...props }) => (
  <div className={cn("mt-auto shrink-0 border-t border-[var(--ui-border)] px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:flex sm:flex-wrap sm:justify-end sm:gap-2 sm:px-6", className)} {...props} />
);

const SheetTitle = React.forwardRef(function SheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold tracking-[-0.02em]", className)}
      {...props}
    />
  );
});

const SheetDescription = React.forwardRef(function SheetDescription(
  { className, ...props },
  ref
) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("mt-1 text-sm text-[var(--ui-muted-foreground)]", className)}
      {...props}
    />
  );
});

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
