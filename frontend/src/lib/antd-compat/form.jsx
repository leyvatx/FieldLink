import { cloneElement, createContext, isValidElement, useContext } from "react";
import RcForm, { Field, List, useForm, useWatch } from "rc-field-form";
import { cn } from "@/lib/utils";

const FormLayoutContext = createContext({ layout: "vertical" });

function FormFieldLabel({ label, tooltip, required }) {
  if (!label) {
    return null;
  }

  return (
    <label className="mb-1.5 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--sk-color-text)]">
      <span>{label}</span>
      {required ? <span className="text-[color:var(--sk-color-error)]">*</span> : null}
      {tooltip ? (
        <span
          className="cursor-help text-[color:var(--sk-color-text-secondary)]"
          title={typeof tooltip === "string" ? tooltip : undefined}
        >
          ?
        </span>
      ) : null}
    </label>
  );
}

function hasRequiredRule(rules = []) {
  return rules.some((rule) => rule?.required);
}

function renderExtra(extra) {
  if (!extra) {
    return null;
  }

  return (
    <div className="mt-1 text-xs text-[color:var(--sk-color-text-secondary)]">
      {extra}
    </div>
  );
}

function renderErrors(meta) {
  if (!meta?.errors?.length) {
    return null;
  }

  return (
    <div className="mt-1 text-xs text-[color:var(--sk-color-error)]">
      {meta.errors[0]}
    </div>
  );
}

function mergeControl(child, control) {
  if (!isValidElement(child)) {
    return child;
  }

  return cloneElement(child, {
    ...child.props,
    ...control,
  });
}

function FormItem({
  children,
  label,
  name,
  rules,
  noStyle,
  hidden,
  tooltip,
  extra,
  style,
  className,
  valuePropName = "value",
  initialValue,
  shouldUpdate,
  dependencies,
  normalize,
  getValueFromEvent,
  getValueProps,
  trigger,
  validateTrigger,
  preserve,
}) {
  const { layout } = useContext(FormLayoutContext);
  const fieldProps = {
    name,
    rules,
    valuePropName,
    initialValue,
    shouldUpdate,
    dependencies,
    normalize,
    getValueFromEvent,
    getValueProps,
    trigger,
    validateTrigger,
    preserve,
  };

  if (typeof children === "function") {
    return (
      <Field {...fieldProps}>
        {(_, __, form) => children(form)}
      </Field>
    );
  }

  if (name == null) {
    return (
      <div className={cn(noStyle ? "" : "ant-form-item mb-4", hidden && "hidden", className)} style={style}>
        {!noStyle ? (
          <>
            <FormFieldLabel label={label} tooltip={tooltip} required={hasRequiredRule(rules)} />
            {children}
            {renderExtra(extra)}
          </>
        ) : (
          children
        )}
      </div>
    );
  }

  return (
    <Field {...fieldProps}>
      {(control, meta) => {
        const content = mergeControl(children, control);

        if (noStyle) {
          return hidden ? <div className="hidden">{content}</div> : content;
        }

        return (
          <div className={cn("ant-form-item mb-4", hidden && "hidden", className)} style={style}>
            <div className={cn(layout === "vertical" && "flex flex-col")}>
              <FormFieldLabel label={label} tooltip={tooltip} required={hasRequiredRule(rules)} />
              {content}
              {renderErrors(meta)}
              {renderExtra(extra)}
            </div>
          </div>
        );
      }}
    </Field>
  );
}

const FormBase = ({
  children,
  layout = "horizontal",
  className,
  style,
  ...props
}) => {
  return (
    <FormLayoutContext.Provider value={{ layout }}>
      <RcForm className={cn("ant-form", className)} style={style} {...props}>
        {children}
      </RcForm>
    </FormLayoutContext.Provider>
  );
};

FormBase.Item = FormItem;
FormBase.List = List;
FormBase.useForm = useForm;
FormBase.useWatch = useWatch;

export const Form = FormBase;
