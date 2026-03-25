/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/lib/antd-compat/base";
import {
  Dialog,
  DialogContent,
  DialogFooter as UIDialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover as UIPopover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs as UITabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import UICheckbox from "@/components/ui/checkbox";

function getPlacementSide(placement) {
  if (placement?.startsWith("top")) return "top";
  if (placement?.startsWith("left")) return "left";
  if (placement?.startsWith("right")) return "right";
  return "bottom";
}

function getPlacementAlign(placement) {
  return placement?.toLowerCase().includes("right") ? "end" : "start";
}

function normalizeDimension(value) {
  if (value == null) {
    return undefined;
  }

  return typeof value === "number" ? `${value}px` : value;
}

function getResponsiveWidth(width) {
  const normalizedWidth = normalizeDimension(width);

  if (!normalizedWidth) {
    return undefined;
  }

  if (normalizedWidth.includes("%") || normalizedWidth.includes("vw")) {
    return normalizedWidth;
  }

  return `min(calc(100vw - 1rem), ${normalizedWidth})`;
}

function renderDropdownItems(items = [], onAnyClick, level = 0) {
  return items.map((item, index) => {
    const key = item?.key ?? `${level}-${index}`;

    if (item?.type === "divider") {
      return <DropdownMenuSeparator key={key} />;
    }

    if (item?.children?.length) {
      return (
        <DropdownMenuSub key={key}>
          <DropdownMenuSubTrigger disabled={item.disabled}>
            <span className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {renderDropdownItems(item.children, onAnyClick, level + 1)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }

    return (
      <DropdownMenuItem
        key={key}
        disabled={item.disabled}
        className={cn(item.danger && "text-[var(--ui-destructive)] focus:text-[var(--ui-destructive)]")}
        onSelect={(event) => {
          event.preventDefault();
          onAnyClick?.({ key: item.key, item });
          item.onClick?.({ key: item.key, domEvent: event });
        }}
      >
        {item.icon}
        <span className="min-w-0 flex-1">{item.label}</span>
      </DropdownMenuItem>
    );
  });
}

export function Dropdown({ children, menu, placement = "bottomLeft", open, onOpenChange }) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent side={getPlacementSide(placement)} align={getPlacementAlign(placement)}>
        {renderDropdownItems(menu?.items ?? [], menu?.onClick)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Tooltip({ title, children }) {
  if (!title) return children;

  return (
    <TooltipProvider delayDuration={100}>
      <UITooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

export function Popover({ children, content, placement = "bottom", classNames }) {
  return (
    <UIPopover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side={getPlacementSide(placement)} align={getPlacementAlign(placement)} className={classNames?.body}>
        {content}
      </PopoverContent>
    </UIPopover>
  );
}

function DialogFrame({
  title,
  children,
  footer,
  onCancel,
  onOk,
  okText = "Aceptar",
  cancelText = "Cancelar",
  confirmLoading = false,
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
        {children}
      </div>
      {footer === null ? null : footer !== undefined ? (
        <div className="shrink-0 border-t border-[var(--ui-border)] px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-6">
          {footer}
        </div>
      ) : (
        <UIDialogFooter>
          <Button onClick={onCancel}>{cancelText}</Button>
          <Button type="primary" loading={confirmLoading} onClick={onOk}>
            {okText}
          </Button>
        </UIDialogFooter>
      )}
    </>
  );
}

function BaseModal({
  open,
  onCancel,
  onOk,
  title,
  children,
  width,
  footer,
  okText,
  cancelText,
  confirmLoading,
  afterOpenChange,
}) {
  useEffect(() => {
    afterOpenChange?.(open);
  }, [afterOpenChange, open]);

  return (
    <Dialog open={!!open} onOpenChange={(nextOpen) => !nextOpen && onCancel?.()}>
      <DialogContent
        className="p-0"
        style={width ? { width: getResponsiveWidth(width), maxWidth: "calc(100vw - 1rem)" } : undefined}
      >
        <DialogFrame
          title={title}
          footer={footer}
          onCancel={onCancel}
          onOk={onOk}
          okText={okText}
          cancelText={cancelText}
          confirmLoading={confirmLoading}
        >
          {children}
        </DialogFrame>
      </DialogContent>
    </Dialog>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  width,
  footer,
  placement = "right",
  afterOpenChange,
}) {
  const side = placement === "left" ? "left" : placement === "top" ? "top" : placement === "bottom" ? "bottom" : "right";

  useEffect(() => {
    afterOpenChange?.(open);
  }, [afterOpenChange, open]);

  return (
    <Sheet open={!!open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
      <SheetContent
        side={side}
        className="p-0"
        style={width ? { width: getResponsiveWidth(width), maxWidth: "calc(100vw - 1rem)" } : undefined}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-5 sm:pb-8">
          {children}
        </div>
        {footer == null ? null : (
          <SheetFooter>{footer}</SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

function useModalHook() {
  const [modalProps, setModalProps] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const close = () => {
    setConfirmLoading(false);
    setModalProps(null);
  };

  const api = useMemo(
    () => ({
      confirm: (props) => {
        setModalProps(props);
      },
    }),
    []
  );

  const holder = modalProps ? (
    <BaseModal
      open
      title={modalProps.title}
      width={modalProps.width}
      onCancel={close}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={close}>{modalProps.cancelText ?? "Cancelar"}</Button>
          <Button
            type={modalProps.okButtonProps?.type === "primary" ? "primary" : "default"}
            danger={modalProps.okButtonProps?.danger}
            loading={confirmLoading}
            onClick={async () => {
              try {
                setConfirmLoading(true);
                await modalProps.onOk?.();
                close();
              } finally {
                setConfirmLoading(false);
              }
            }}
          >
            {modalProps.okText ?? "Aceptar"}
          </Button>
        </div>
      }
    >
      {modalProps.content}
    </BaseModal>
  ) : null;

  return [api, holder];
}

export const Modal = Object.assign(BaseModal, {
  useModal: useModalHook,
});

export function Tabs({ items = [], defaultActiveKey, activeKey, onChange }) {
  const fallbackKey = defaultActiveKey ?? items[0]?.key;

  return (
    <UITabs value={activeKey} defaultValue={fallbackKey} onValueChange={onChange} className="ant-tabs">
      <TabsList className="mb-5">
        {items.map((item) => (
          <TabsTrigger key={item.key} value={item.key}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.key} value={item.key}>
          {item.children}
        </TabsContent>
      ))}
    </UITabs>
  );
}

export function Checkbox({ checked, disabled, onChange, onClick, className, "aria-label": ariaLabel }) {
  return (
    <UICheckbox
      checked={checked}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      onCheckedChange={(nextValue) => onChange?.({ target: { checked: nextValue === true } })}
      onClick={onClick}
    />
  );
}

export const message = {
  useMessage() {
    const api = useMemo(
      () => ({
        open({ type = "info", content, key }) {
          if (type === "success") return toast.success(content, { id: key });
          if (type === "error") return toast.error(content, { id: key });
          if (type === "loading") return toast.loading(content, { id: key });
          if (type === "warning") return toast.warning(content, { id: key });
          return toast(content, { id: key });
        },
        info(content) {
          toast(content);
        },
        success(content) {
          toast.success(content);
        },
        error(content) {
          toast.error(content);
        },
        warning(content) {
          toast.warning(content);
        },
      }),
      []
    );

    return [api, null];
  },
};
