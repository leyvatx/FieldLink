import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { PiXBold } from "react-icons/pi";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
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
  "fixed z-[1101] flex flex-col border border-[var(--ui-border)] bg-[var(--ui-card)] text-[var(--ui-card-foreground)] shadow-[var(--ui-shadow-dialog)] will-change-[opacity,transform] transition-[opacity,transform] duration-240 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
  {
    variants: {
      side: {
        top: "inset-x-3 top-3 rounded-[1.75rem] border-b data-[state=closed]:-translate-y-6 data-[state=open]:translate-y-0",
        bottom: "inset-x-3 bottom-3 rounded-[1.75rem] border-t data-[state=closed]:translate-y-6 data-[state=open]:translate-y-0",
        left: "inset-y-3 left-3 h-auto w-[min(94vw,26rem)] rounded-[1.75rem] data-[state=closed]:-translate-x-8 data-[state=open]:translate-x-0",
        right: "inset-y-3 right-3 h-auto w-[min(94vw,26rem)] rounded-[1.75rem] data-[state=closed]:translate-x-8 data-[state=open]:translate-x-0",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

const SheetContent = React.forwardRef(function SheetContent(
  { className, children, side = "right", showClose = true, ...props },
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
  <div className={cn("border-b border-[var(--ui-border)] px-4 py-4 sm:px-6 sm:py-5", className)} {...props} />
);

const SheetFooter = ({ className, ...props }) => (
  <div className={cn("mt-auto border-t border-[var(--ui-border)] px-4 py-4 sm:px-6", className)} {...props} />
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
