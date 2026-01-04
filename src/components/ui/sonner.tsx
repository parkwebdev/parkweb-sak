/**
 * Toaster Component
 * 
 * A toast notification container using Sonner with
 * theme-aware styling and consistent positioning.
 * 
 * @module components/ui/sonner
 * 
 * @example
 * ```tsx
 * // In app root
 * <Toaster />
 * 
 * // Usage
 * toast.success("Action completed")
 * ```
 */
import * as React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <div role="region" aria-label="Notifications" aria-live="polite" aria-atomic="false">
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        position="bottom-center"
        gap={8}
        toastOptions={{
          classNames: {
            toast:
              "group toast w-auto min-w-0 group-[.toaster]:bg-foreground group-[.toaster]:text-background group-[.toaster]:border-foreground/10 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
            description: "group-[.toast]:text-background/70",
            actionButton:
              "group-[.toast]:bg-background group-[.toast]:text-foreground",
            cancelButton:
              "group-[.toast]:bg-background/20 group-[.toast]:text-background/80",
          },
          duration: 4000,
        }}
        // Custom animation using CSS - Sonner handles its own animations
        // We enhance with additional styling
        {...props}
      />
    </div>
  )
}

export { Toaster, toast }
