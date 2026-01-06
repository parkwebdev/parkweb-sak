/**
 * ShinyButton Component
 * 
 * A premium button with animated shine effect.
 * Uses existing btn-primary gradient styling with an animated spotlight sweep.
 * 
 * @module components/ui/shiny-button
 */
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { Spinner } from "@/components/ui/spinner"

interface ShinyButtonProps {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  className?: string
  type?: "button" | "submit" | "reset"
  onClick?: () => void
}

export function ShinyButton({
  children,
  className,
  loading,
  disabled,
  type = "button",
  onClick,
}: ShinyButtonProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.button
      type={type}
      onClick={onClick}
      style={{ "--x": "100%" } as React.CSSProperties}
      animate={{ "--x": "-100%" } as unknown as Record<string, string>}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              repeat: Infinity,
              repeatType: "loop",
              repeatDelay: 1,
              type: "spring",
              stiffness: 20,
              damping: 15,
              mass: 2,
            }
      }
      disabled={disabled || loading}
      className={cn(
        // Base styles
        "relative inline-flex h-11 items-center justify-center gap-2 rounded-md px-8 text-sm font-medium",
        // Use existing btn-primary styling
        "btn-primary text-primary-foreground",
        // Focus and disabled states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Radii for shine effect
        "overflow-hidden",
        className
      )}
    >
      {/* Text with shine sweep effect */}
      <span
        className="relative z-10 flex items-center justify-center gap-2 tracking-tight"
        style={{
          maskImage:
            "linear-gradient(-75deg, hsl(var(--primary)) calc(var(--x) + 20%), transparent calc(var(--x) + 30%), hsl(var(--primary)) calc(var(--x) + 100%))",
          WebkitMaskImage:
            "linear-gradient(-75deg, hsl(var(--primary)) calc(var(--x) + 20%), transparent calc(var(--x) + 30%), hsl(var(--primary)) calc(var(--x) + 100%))",
        }}
      >
        {loading ? <Spinner size="sm" /> : children}
      </span>

      {/* Shine border overlay */}
      <span
        className="absolute inset-0 z-10 block rounded-md"
        style={{
          background:
            "linear-gradient(-75deg, rgba(255,255,255,0) calc(var(--x) + 20%), rgba(255,255,255,0.3) calc(var(--x) + 25%), rgba(255,255,255,0) calc(var(--x) + 100%))",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
        aria-hidden="true"
      />
    </motion.button>
  )
}
