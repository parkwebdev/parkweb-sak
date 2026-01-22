/**
 * Toaster Component
 * 
 * A toast notification container using Sonner with
 * theme-aware styling, custom UntitledUI icons, and consistent positioning.
 * 
 * Features:
 * - Custom UntitledUI icons for each toast type
 * - Maximum 3 visible toasts at once (queued)
 * - Mobile-friendly with bottom offset and swipe gestures
 * - Theme-aware inverted styling (dark bg on light mode, vice versa)
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
 * toast.undo("Item deleted", { onUndo: () => restore() })
 * toast.dedupe('key', 'Preventing spam')
 * ```
 */
import * as React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, InfoCircle, Loading02 } from "@untitledui/icons";

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
        visibleToasts={3}
        mobileOffset={{ bottom: 80 }}
        swipeDirections={['right', 'left']}
        icons={{
          success: <CheckCircle size={16} aria-hidden="true" />,
          error: <XCircle size={16} aria-hidden="true" />,
          warning: <AlertCircle size={16} aria-hidden="true" />,
          info: <InfoCircle size={16} aria-hidden="true" />,
          loading: <Loading02 size={16} className="animate-spin" aria-hidden="true" />,
        }}
        toastOptions={{
          classNames: {
            toast:
              "group toast w-auto min-w-0 !py-2 !px-3 group-[.toaster]:bg-foreground group-[.toaster]:text-background group-[.toaster]:border-foreground/10 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
            description: "group-[.toast]:text-background/70",
            icon: "group-[.toast]:text-background",
            actionButton:
              "group-[.toast]:bg-background group-[.toast]:text-foreground",
            cancelButton:
              "group-[.toast]:bg-background/20 group-[.toast]:text-background/80",
          },
          duration: 4000,
        }}
        {...props}
      />
    </div>
  )
}

export { Toaster, toast }
