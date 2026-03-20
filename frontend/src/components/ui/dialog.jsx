import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PiXBold } from "react-icons/pi";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      forceMount
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-[1100] bg-[var(--ui-overlay)] backdrop-blur-md transition-[opacity,backdrop-filter] duration-220 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        className
      )}
      {...props}
    />
  );
});

const DialogContent = React.forwardRef(function DialogContent(
  { className, children, showClose = true, ...props },
  ref
) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        forceMount
        ref={ref}
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-[1101] grid w-[min(94vw,36rem)] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-hidden rounded-[1.75rem] border border-[var(--ui-border)] bg-[var(--ui-card)] text-[var(--ui-card-foreground)] shadow-[var(--ui-shadow-dialog)] will-change-[opacity,transform] transition-[opacity,transform] duration-220 ease-out data-[state=closed]:translate-y-[calc(-50%+14px)] data-[state=closed]:scale-[0.965] data-[state=closed]:opacity-0 data-[state=open]:translate-y-[-50%] data-[state=open]:scale-100 data-[state=open]:opacity-100",
          className
        )}
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
    </DialogPortal>
  );
});

const DialogHeader = ({ className, ...props }) => (
  <div
    data-slot="dialog-header"
    className={cn("flex flex-col gap-1.5 border-b border-[var(--ui-border)] px-6 py-5", className)}
    {...props}
  />
);

const DialogFooter = ({ className, ...props }) => (
  <div
    data-slot="dialog-footer"
    className={cn("flex flex-col-reverse gap-2 border-t border-[var(--ui-border)] px-6 py-4 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);

const DialogTitle = React.forwardRef(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="dialog-title"
      className={cn("text-lg font-semibold tracking-[-0.02em]", className)}
      {...props}
    />
  );
});

const DialogDescription = React.forwardRef(function DialogDescription(
  { className, ...props },
  ref
) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="dialog-description"
      className={cn("text-sm text-[var(--ui-muted-foreground)]", className)}
      {...props}
    />
  );
});

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
