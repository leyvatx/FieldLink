import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { PiCaretLeftBold, PiCaretRightBold } from "react-icons/pi";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const Calendar = ({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) => {
  const isRange = props.mode === "range";
  const cellClass = cn(
    "relative p-0 text-center text-sm [&:has([aria-selected])]:bg-[color:color-mix(in_srgb,var(--ui-primary)_10%,transparent)]",
    isRange
      ? "[&:has(.day-range-end)]:rounded-r-lg [&:has(.day-range-start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
      : "[&:has([aria-selected])]:rounded-lg"
  );
  const dayButtonClass = cn(
    buttonVariants({ variant: "ghost", size: "icon-sm" }),
    "h-9 w-9 rounded-lg p-0 font-normal"
  );
  const selectedClass =
    "bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] hover:bg-[var(--ui-primary)] hover:text-[var(--ui-primary-foreground)] focus:bg-[var(--ui-primary)] focus:text-[var(--ui-primary-foreground)]";
  const todayClass =
    "border border-[var(--ui-border-strong)] bg-[var(--ui-accent)] text-[var(--ui-foreground)]";
  const outsideClass =
    "text-[var(--ui-muted-foreground)] opacity-40 aria-selected:bg-[var(--ui-accent)] aria-selected:text-[var(--ui-muted-foreground)] aria-selected:opacity-30";

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout="label"
      className={cn("p-3", className)}
      locale={es}
      classNames={{
        root: "rdp-root",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-medium text-[var(--ui-foreground)]",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute left-1 top-0 h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute right-1 top-0 h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-[0.8rem] font-medium text-[var(--ui-muted-foreground)]",
        week: "mt-2 flex w-full",
        day: cellClass,
        cell: cellClass,
        day_button: dayButtonClass,
        button: dayButtonClass,
        range_start: "day-range-start",
        day_range_start: "day-range-start",
        range_middle:
          "aria-selected:bg-[color:color-mix(in_srgb,var(--ui-primary)_12%,transparent)] aria-selected:text-[var(--ui-foreground)]",
        day_range_middle:
          "aria-selected:bg-[color:color-mix(in_srgb,var(--ui-primary)_12%,transparent)] aria-selected:text-[var(--ui-foreground)]",
        range_end: "day-range-end",
        day_range_end: "day-range-end",
        selected: selectedClass,
        day_selected: selectedClass,
        today: todayClass,
        day_today: todayClass,
        outside: outsideClass,
        day_outside: outsideClass,
        disabled: "opacity-30",
        day_disabled: "opacity-30",
        hidden: "invisible",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) =>
          orientation === "left" ? (
            <PiCaretLeftBold
              className={cn("h-4 w-4", chevronClassName)}
              {...chevronProps}
            />
          ) : (
            <PiCaretRightBold
              className={cn("h-4 w-4", chevronClassName)}
              {...chevronProps}
            />
          ),
      }}
      {...props}
    />
  );
};

export default Calendar;
