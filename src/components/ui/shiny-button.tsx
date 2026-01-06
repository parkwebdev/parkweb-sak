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
        // Base styles matching Button size="lg"
        "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium leading-none",
        "h-11 px-6 rounded-md",
        // Use existing btn-primary styling (gradient + box-shadow defined in index.css)
        "btn-primary text-primary-foreground border-[1.5px] border-[#171717]",
        // Focus and disabled states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        // For shine effect
        "relative overflow-hidden",
        className
      )}
    >
      {/* Text with shine sweep effect */}
      <span
        className="relative z-10 flex items-center justify-center gap-2"
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
        className="absolute inset-0 z-10 block rounded-md pointer-events-none"
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
