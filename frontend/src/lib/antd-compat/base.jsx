/* eslint-disable react-refresh/only-export-components */
import { forwardRef, useState } from "react";
import { PiCheck, PiCircleNotch, PiWarningCircleFill, PiX } from "react-icons/pi";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import UIButton from "@/components/ui/button";
import {
  Card as UICard,
  CardContent as UICardContent,
  CardHeader as UICardHeader,
  CardTitle as UICardTitle,
} from "@/components/ui/card";
import UIInput from "@/components/ui/input";
import UITextarea from "@/components/ui/textarea";
import {
  Avatar as UIAvatar,
  AvatarFallback as UIAvatarFallback,
  AvatarImage as UIAvatarImage,
} from "@/components/ui/avatar";
import Separator from "@/components/ui/separator";

const sizeMap = {
  small: "sm",
  middle: "default",
  default: "default",
  large: "lg",
};

export const inputVariants = cva(
  "ant-input h-10 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-input)] px-3 py-2 text-sm text-[var(--ui-foreground)] shadow-[var(--ui-shadow-soft)] outline-none transition placeholder:text-[var(--ui-muted-foreground)] focus:border-[var(--ui-ring-strong)] focus:ring-[3px] focus:ring-[var(--ui-ring)] disabled:bg-[var(--ui-secondary)] disabled:opacity-70",
  {
    variants: {
      invalid: {
        true: "border-[var(--ui-destructive)] focus:border-[var(--ui-destructive)] focus:ring-[color:color-mix(in_srgb,var(--ui-destructive)_16%,transparent)]",
      },
    },
  }
);

export function statusColorStyles(color, bordered = true) {
  const variants = {
    success: ["var(--sk-bg-subtle-green)", "var(--sk-color-green)", "var(--sk-color-outline-green)"],
    green: ["var(--sk-bg-subtle-green)", "var(--sk-color-green)", "var(--sk-color-outline-green)"],
    error: ["var(--sk-bg-subtle-red)", "var(--sk-color-red)", "var(--sk-color-outline-red)"],
    red: ["var(--sk-bg-subtle-red)", "var(--sk-color-red)", "var(--sk-color-outline-red)"],
    warning: ["var(--sk-bg-subtle-yellow)", "var(--sk-color-yellow)", "var(--sk-color-outline-yellow)"],
    gold: ["var(--sk-bg-subtle-yellow)", "var(--sk-color-yellow)", "var(--sk-color-outline-yellow)"],
    yellow: ["var(--sk-bg-subtle-yellow)", "var(--sk-color-yellow)", "var(--sk-color-outline-yellow)"],
    info: ["var(--sk-bg-subtle-blue)", "var(--sk-color-blue)", "var(--sk-color-outline-blue)"],
    blue: ["var(--sk-bg-subtle-blue)", "var(--sk-color-blue)", "var(--sk-color-outline-blue)"],
    cyan: ["var(--sk-bg-subtle-blue)", "var(--sk-color-blue)", "var(--sk-color-outline-blue)"],
    purple: ["var(--sk-bg-subtle-purple)", "var(--sk-color-purple)", "var(--sk-color-outline-purple)"],
    default: ["var(--sk-color-fill-quaternary)", "var(--sk-color-text)", "var(--sk-color-border-secondary)"],
  };

  const [background, text, border] = variants[color] || variants.default;

  return {
    background,
    color: text,
    borderColor: bordered ? border : "transparent",
  };
}

function resolveButtonVariant(type, danger, color, variant) {
  if (type === "primary") return danger ? "destructive" : "default";
  if (type === "text") return "ghost";
  if (type === "link") return "link";
  if (danger) return "destructive";
  if (variant === "filled" || color === "default") return "secondary";
  return "outline";
}

export function Button({
  children,
  type = "default",
  size = "default",
  block = false,
  danger = false,
  loading = false,
  icon,
  shape,
  color,
  variant,
  className,
  htmlType = "button",
  title,
  "aria-label": ariaLabel,
  ...props
}) {
  const effectiveSize = sizeMap[size] || size;
  const buttonVariant = resolveButtonVariant(type, danger, color, variant);
  const textLabel = typeof children === "string" ? children : undefined;

  return (
    <UIButton
      type={htmlType}
      variant={buttonVariant}
      size={shape === "circle" ? (effectiveSize === "sm" ? "icon-sm" : "icon") : effectiveSize}
      className={cn(
        block && "w-full",
        shape === "circle" && "rounded-full",
        shape === "circle" && effectiveSize === "lg" && "h-11 w-11",
        icon && children && "ui-button-has-icon",
        className
      )}
      disabled={loading || props.disabled}
      title={title ?? textLabel}
      aria-label={ariaLabel ?? textLabel}
      {...props}
    >
      {loading ? <PiCircleNotch className="ui-spinner" size={16} /> : icon ? <span className="ant-btn-icon">{icon}</span> : null}
      {children != null ? <span className="ui-button-label">{children}</span> : null}
    </UIButton>
  );
}

export function Spin({ spinning, size = "default", children, className }) {
  const iconSize = size === "large" ? 28 : size === "small" ? 14 : 18;
  const spinner = (
    <span className={cn("inline-flex items-center justify-center text-[color:var(--sk-color-primary)]", className)}>
      <PiCircleNotch className="ui-spinner" size={iconSize} />
    </span>
  );

  if (typeof spinning === "boolean") {
    return (
      <div className="relative">
        {spinning ? (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-[color:color-mix(in_srgb,var(--sk-color-bg-container)_75%,transparent)] backdrop-blur-[1px]">
            {spinner}
          </div>
        ) : null}
        {children}
      </div>
    );
  }

  return spinner;
}

export function Divider({ children, className, orientation = "center", plain = false, style }) {
  if (!children) {
    return <Separator className={cn("ant-divider", className)} style={style} />;
  }

  const justify = orientation === "left" ? "justify-start" : orientation === "right" ? "justify-end" : "justify-center";

  return (
    <div className={cn("ant-divider flex items-center gap-3 py-1 text-[color:var(--sk-color-text-secondary)]", justify, className)} style={style}>
      <span className="h-px flex-1 bg-[color:var(--sk-color-border-secondary)]" />
      <span className={cn("text-sm", plain ? "font-normal" : "font-medium")}>{children}</span>
      <span className="h-px flex-1 bg-[color:var(--sk-color-border-secondary)]" />
    </div>
  );
}

export function Empty({ description = "Sin datos", className }) {
  return (
    <div className={cn("ant-empty grid place-items-center gap-2 rounded-2xl border border-dashed border-[color:var(--sk-color-border-secondary)] px-5 py-8 text-center", className)}>
      <div className="text-sm text-[color:var(--sk-color-text-secondary)]">{description}</div>
    </div>
  );
}

export function Alert({ type = "info", message, description, showIcon = false, className, style }) {
  const colors = statusColorStyles(type, true);

  return (
    <div
      className={cn("ant-alert flex gap-3 rounded-2xl border px-4 py-3", className)}
      style={{ background: colors.background, color: colors.color, borderColor: colors.borderColor, ...style }}
    >
      {showIcon ? <PiWarningCircleFill className="mt-0.5 shrink-0" size={18} /> : null}
      <div className="min-w-0">
        {message ? <div className="font-medium">{message}</div> : null}
        {description ? <div className="mt-1 text-sm opacity-90">{description}</div> : null}
      </div>
    </div>
  );
}

export function Badge({ count, children, offset = [0, 0], size = "default" }) {
  const hidden = count == null || count === 0;
  const badgeSize = size === "small" ? "min-h-4 min-w-4 text-[10px]" : "min-h-5 min-w-5 text-xs";

  return (
    <span className="relative inline-flex">
      {children}
      {!hidden ? (
        <span
          className={cn("absolute right-0 top-0 inline-flex -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-[color:var(--sk-color-error)] px-1.5 font-semibold text-white", badgeSize)}
          style={{ marginRight: offset?.[0] ?? 0, marginTop: offset?.[1] ?? 0 }}
        >
          {count}
        </span>
      ) : null}
    </span>
  );
}

export function Tag({ color = "default", children, closable = false, onClose, bordered = true, icon, className, style }) {
  const colors = statusColorStyles(color, bordered);

  return (
    <span
      className={cn("ant-tag inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", className)}
      style={{ background: colors.background, color: colors.color, borderColor: colors.borderColor, ...style }}
    >
      {icon ? <span className="inline-flex items-center">{icon}</span> : null}
      <span>{children}</span>
      {closable ? (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full text-current opacity-70 transition hover:opacity-100"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClose?.(event);
          }}
        >
          <PiX size={12} />
        </button>
      ) : null}
    </span>
  );
}

export function Card({ children, className, title, loading = false, styles, bordered = true, ...props }) {
  return (
    <UICard className={cn("ant-card overflow-hidden", !bordered && "border-transparent", className)} {...props}>
      {title ? (
        <UICardHeader className="border-b border-[var(--ui-border)] py-4">
          <UICardTitle>{title}</UICardTitle>
        </UICardHeader>
      ) : null}
      <UICardContent className="ant-card-body p-5" style={styles?.body}>
        {loading ? <Skeleton active /> : children}
      </UICardContent>
    </UICard>
  );
}

function TypographyTextBase({ as = "span", strong = false, type, ellipsis, copyable, children, className, style }) {
  const [copied, setCopied] = useState(false);
  const Component = as;
  const tone = type === "secondary" ? "text-[color:var(--sk-color-text-secondary)]" : type === "danger" ? "text-[color:var(--sk-color-error)]" : "text-[color:var(--sk-color-text)]";
  const copyableConfig = copyable === true ? { text: undefined } : copyable;

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(copyableConfig?.text ?? String(children ?? ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // no-op
    }
  };

  const icons = copyableConfig?.icon;
  const iconNode = copied && icons?.[1] ? icons[1] : icons?.[0] ?? <PiCheck size={16} />;

  return (
    <span className={cn("inline-flex max-w-full items-center gap-1.5", tone, className)} style={style}>
      <Component className={cn(strong && "font-semibold", ellipsis && "block truncate")} title={ellipsis && typeof children === "string" ? children : undefined}>
        {children}
      </Component>
      {copyableConfig ? (
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-[color:var(--sk-color-text-secondary)] transition hover:text-[color:var(--sk-color-text)]"
          title={copied ? copyableConfig?.tooltips?.[1] : copyableConfig?.tooltips?.[0]}
          onClick={copyText}
        >
          {iconNode}
        </button>
      ) : null}
    </span>
  );
}

function TypographyTitle({ level = 1, children, className, style, ...props }) {
  const normalizedLevel = Math.min(Math.max(Number(level) || 1, 1), 5);
  const Component = `h${normalizedLevel}`;
  const sizeClass =
    normalizedLevel === 1
      ? "text-4xl"
      : normalizedLevel === 2
        ? "text-3xl"
        : normalizedLevel === 3
          ? "text-2xl"
          : normalizedLevel === 4
            ? "text-xl"
            : "text-lg";

  return (
    <Component
      className={cn("m-0 font-semibold tracking-[-0.03em] text-[color:var(--sk-color-text)]", sizeClass, className)}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}

export const Typography = {
  Title: (props) => <TypographyTitle {...props} />,
  Text: (props) => <TypographyTextBase {...props} />,
  Paragraph: ({ children, className, ...props }) => (
    <TypographyTextBase as="p" className={cn("m-0", className)} {...props}>
      {children}
    </TypographyTextBase>
  ),
};

export function Space({ children, size = "middle", direction = "horizontal", className, style }) {
  const gap = typeof size === "number" ? size : size === "small" ? 8 : size === "large" ? 16 : 12;
  return (
    <div className={cn("ant-space flex", direction === "vertical" ? "flex-col" : "flex-row items-center", className)} style={{ gap, ...style }}>
      {children}
    </div>
  );
}

export function Flex({ children, vertical = false, gap = 0, align, justify, className, style }) {
  return (
    <div
      className={cn("ant-flex flex", vertical && "flex-col", className)}
      style={{ gap: typeof gap === "string" ? (gap === "middle" ? 12 : gap) : gap, alignItems: align, justifyContent: justify, ...style }}
    >
      {children}
    </div>
  );
}

export function Row({ children, gutter = 0, align, justify, className, style }) {
  const [, vertical] = Array.isArray(gutter) ? gutter : [gutter, gutter];
  const justifyClass = justify === "space-between" ? "justify-between" : justify === "center" ? "justify-center" : justify === "end" ? "justify-end" : "justify-start";
  const alignClass = align === "middle" ? "items-center" : align === "bottom" ? "items-end" : "items-start";
  return (
    <div className={cn("ant-row -mx-2 flex flex-wrap", justifyClass, alignClass, className)} style={{ rowGap: vertical, ...style }}>
      {children}
    </div>
  );
}

export function Col({ children, span = 24, flex, className, style }) {
  const width = span ? `${(span / 24) * 100}%` : undefined;
  return (
    <div className={cn("ant-col px-2", className)} style={{ width: flex ? undefined : width, flex: flex || undefined, ...style }}>
      {children}
    </div>
  );
}

export function Segmented({ options = [], value, onChange, block = false, className }) {
  return (
    <div
      className={cn("ant-segmented inline-grid rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-secondary)] p-1 shadow-[var(--ui-shadow-soft)]", block && "w-full", className)}
      style={{ gridTemplateColumns: `repeat(${options.length || 1}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition",
              active ? "bg-[var(--ui-card)] text-[var(--ui-foreground)] shadow-[var(--ui-shadow-soft)]" : "text-[color:var(--sk-color-text-secondary)] hover:bg-[var(--ui-accent)]"
            )}
            onClick={() => onChange?.(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({ src, alt, children, size = "default", className, style }) {
  const dimension = typeof size === "number" ? size : size === "small" ? 28 : size === "large" ? 44 : 36;

  return (
    <UIAvatar
      className={cn("ant-avatar inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: dimension, height: dimension, ...style }}
    >
      {src ? <UIAvatarImage src={src} alt={alt} className="h-full w-full object-cover" /> : null}
      <UIAvatarFallback className="grid h-full w-full place-items-center">{children}</UIAvatarFallback>
    </UIAvatar>
  );
}

export function Image({ src, alt, width, height, className, style }) {
  return <img src={src} alt={alt ?? ""} width={width} height={height} className={className} style={style} />;
}

Image.PreviewGroup = ({ children }) => <div className="flex flex-wrap gap-3">{children}</div>;

function SkeletonBase({ className, style }) {
  return <div className={cn("animate-pulse rounded-xl bg-[color:var(--sk-color-fill-quaternary)]", className)} style={style} />;
}

export const Skeleton = Object.assign(
  ({ className, style }) => <SkeletonBase className={cn("h-4 w-full", className)} style={style} />,
  {
    Input: ({ className, style }) => <SkeletonBase className={cn("h-10 w-full", className)} style={style} />,
    Button: ({ className, style }) => <SkeletonBase className={cn("h-8 w-8 rounded-full", className)} style={style} />,
  }
);

export function Result({ status, title, subTitle, extra }) {
  const tone = String(status) === "success" ? "text-[color:var(--sk-color-green)]" : String(status) === "warning" ? "text-[color:var(--sk-color-yellow)]" : String(status) === "403" ? "text-[color:var(--sk-color-error)]" : "text-[color:var(--sk-color-primary)]";
  return (
    <div className="ant-result grid place-items-center gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-card)] px-6 py-10 text-center shadow-[var(--ui-shadow-soft)]">
      <div className={cn("text-3xl font-bold", tone)}>{status}</div>
      <div className="text-xl font-semibold">{title}</div>
      {subTitle ? <div className="max-w-xl text-sm text-[color:var(--sk-color-text-secondary)]">{subTitle}</div> : null}
      {extra}
    </div>
  );
}

export function Descriptions({ items = [], column = 1, styles, className }) {
  return (
    <div className={cn("ant-descriptions grid gap-2", className)} style={{ gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <div key={item.key ?? item.label} className="grid gap-1 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-card)] p-4 shadow-[var(--ui-shadow-soft)]">
          <div className="text-sm font-medium text-[color:var(--sk-color-text-secondary)]" style={styles?.label}>
            {item.label}
          </div>
          <div className="text-sm text-[color:var(--sk-color-text)]">{item.children}</div>
        </div>
      ))}
    </div>
  );
}

export function Steps({ current = 0, items = [] }) {
  return (
    <div className="ant-steps grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
      {items.map((item, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo";
        return (
          <div key={item.key ?? item.title ?? index} className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                state === "done" && "border-[color:var(--sk-color-primary)] bg-[color:var(--sk-color-primary)] text-white",
                state === "current" && "border-[color:var(--sk-color-primary)] text-[color:var(--sk-color-primary)]",
                state === "todo" && "border-[color:var(--sk-color-border)] text-[color:var(--sk-color-text-secondary)]"
              )}
            >
              {state === "done" ? <PiCheck size={14} /> : index + 1}
            </div>
            <div className="text-sm font-medium">{item.title}</div>
          </div>
        );
      })}
    </div>
  );
}

function InputShell({ prefix, addonBefore, suffix, allowClear, onClear, invalid, className, style, children }) {
  if (!prefix && !addonBefore && !suffix && !allowClear) return <div className={className} style={style}>{children}</div>;

  return (
    <div
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-input)] shadow-[var(--ui-shadow-soft)] transition focus-within:border-[var(--ui-ring-strong)] focus-within:ring-[3px] focus-within:ring-[var(--ui-ring)]",
        invalid && "border-[var(--ui-destructive)] focus-within:border-[var(--ui-destructive)] focus-within:ring-[color:color-mix(in_srgb,var(--ui-destructive)_16%,transparent)]",
        className
      )}
      style={style}
    >
      {addonBefore ? <div className="flex items-center border-r border-[var(--ui-border)] px-3 text-sm text-[var(--ui-muted-foreground)]">{addonBefore}</div> : null}
      {prefix ? <div className="flex items-center px-3 text-[var(--ui-muted-foreground)]">{prefix}</div> : null}
      <div className="min-w-0 flex-1">{children}</div>
      {allowClear || suffix ? (
        <div className="flex items-center px-2">
          {allowClear ? (
            <button type="button" className="rounded-md p-1 text-[var(--ui-muted-foreground)] transition hover:bg-[var(--ui-accent)] hover:text-[var(--ui-foreground)]" onClick={onClear}>
              <PiX size={14} />
            </button>
          ) : null}
          {suffix}
        </div>
      ) : null}
    </div>
  );
}

const InputBase = forwardRef(function InputBase(
  { className, style, allowClear = false, prefix, addonBefore, suffix, onPressEnter, invalid, showCount = false, maxLength, value, defaultValue, onChange, ...props },
  ref
) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const currentValue = isControlled ? value ?? "" : internalValue;

  const handleChange = (event) => {
    if (!isControlled) setInternalValue(event.target.value);
    onChange?.(event);
  };

  return (
    <div className="grid gap-1">
      <InputShell
        prefix={prefix}
        addonBefore={addonBefore}
        suffix={suffix}
        allowClear={allowClear && !!currentValue}
        onClear={() => {
          if (!isControlled) setInternalValue("");
          onChange?.({ target: { value: "" } });
        }}
        invalid={invalid}
        className={className}
        style={style}
      >
        <UIInput
          ref={ref}
          className={cn(inputVariants({ invalid }), (prefix || addonBefore || suffix || allowClear) && "border-0 bg-transparent shadow-none focus:ring-0")}
          value={currentValue}
          maxLength={maxLength}
          onKeyDown={(event) => {
            if (event.key === "Enter") onPressEnter?.(event);
            props.onKeyDown?.(event);
          }}
          onChange={handleChange}
          {...props}
        />
      </InputShell>
      {showCount ? (
        <div className="text-right text-xs text-[color:var(--sk-color-text-secondary)]">
          {String(currentValue ?? "").length}
          {maxLength ? ` / ${maxLength}` : ""}
        </div>
      ) : null}
    </div>
  );
});

const TextArea = forwardRef(function TextArea(
  { rows = 4, autoSize = false, allowClear = false, showCount = false, maxLength, className, style, value, defaultValue, onChange, invalid, ...props },
  ref
) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const currentValue = isControlled ? value ?? "" : internalValue;
  const minRows = typeof autoSize === "object" ? autoSize.minRows : rows;

  const handleChange = (event) => {
    if (!isControlled) setInternalValue(event.target.value);
    onChange?.(event);
  };

  return (
    <div className="grid gap-1">
      <div className="relative">
        <UITextarea
          ref={ref}
          rows={autoSize ? minRows ?? 3 : rows}
          value={currentValue}
          maxLength={maxLength}
          onChange={handleChange}
          className={cn(
            "min-h-[96px] resize-y",
            invalid && "border-[var(--ui-destructive)] focus:border-[var(--ui-destructive)] focus:ring-[color:color-mix(in_srgb,var(--ui-destructive)_16%,transparent)]",
            className
          )}
          style={style}
          {...props}
        />
        {allowClear && currentValue ? (
          <button
            type="button"
            className="absolute right-2 top-2 rounded-md p-1 text-[var(--ui-muted-foreground)] transition hover:bg-[var(--ui-accent)] hover:text-[var(--ui-foreground)]"
            onClick={() => {
              if (!isControlled) setInternalValue("");
              onChange?.({ target: { value: "" } });
            }}
          >
            <PiX size={14} />
          </button>
        ) : null}
      </div>
      {showCount ? (
        <div className="text-right text-xs text-[color:var(--sk-color-text-secondary)]">
          {String(currentValue ?? "").length}
          {maxLength ? ` / ${maxLength}` : ""}
        </div>
      ) : null}
    </div>
  );
});

const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  return <InputBase ref={ref} type="password" {...props} />;
});

export const Input = Object.assign(InputBase, {
  TextArea,
  Password: PasswordInput,
});

export function InputNumber({ value, defaultValue, onChange, min, max, className, style, ...props }) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const currentValue = isControlled ? value ?? "" : internalValue;

  return (
    <input
      type="number"
      className={cn(inputVariants(), className)}
      value={currentValue}
      min={min}
      max={max}
      onChange={(event) => {
        if (!isControlled) setInternalValue(event.target.value);
        const next = event.target.value === "" ? undefined : Number(event.target.value);
        onChange?.(Number.isNaN(next) ? undefined : next);
      }}
      style={style}
      {...props}
    />
  );
}
