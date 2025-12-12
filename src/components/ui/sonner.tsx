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
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <div role="region" aria-label="Notifications" aria-live="polite" aria-atomic="false">
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        position="top-right"
        gap={8}
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
            description: "group-[.toast]:text-muted-foreground",
            actionButton:
              "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
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
