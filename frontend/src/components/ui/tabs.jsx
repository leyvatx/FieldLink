import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-secondary)] p-1 text-[var(--ui-muted-foreground)]",
        className
      )}
      {...props}
    />
  );
});

const TabsTrigger = React.forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-[0.85rem] px-3.5 py-2 text-sm font-medium outline-none transition focus-visible:ring-[3px] focus-visible:ring-[var(--ui-ring)] data-[state=active]:bg-[var(--ui-card)] data-[state=active]:text-[var(--ui-foreground)] data-[state=active]:shadow-[var(--ui-shadow-soft)]",
        className
      )}
      {...props}
    />
  );
});

const TabsContent = React.forwardRef(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn("mt-4 outline-none", className)}
      {...props}
    />
  );
});

export { Tabs, TabsContent, TabsList, TabsTrigger };
