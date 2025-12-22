/**
 * Copy Button Component
 * 
 * A button that copies content to clipboard with animated
 * feedback showing success state.
 * 
 * @module components/ui/copy-button
 * 
 * @example
 * ```tsx
 * <CopyButton content="Text to copy" toastMessage="Code copied!" />
 * ```
 */
import * as React from "react"
import { CheckCircle, Copy01 } from "@untitledui/icons"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { logger } from "@/utils/logger"

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  content: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  showToast?: boolean
  toastMessage?: string
}

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ content, variant = "ghost", size = "sm", showToast = true, toastMessage = "Copied to clipboard", className, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(content)
        setCopied(true)
        if (showToast) {
          toast.success(toastMessage)
        }
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        logger.error("Failed to copy:", err)
        toast.error("Failed to copy")
      }
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        onClick={handleCopy}
        className={cn("relative", className)}
        {...props}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CheckCircle className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Copy01 className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    )
  }
)

CopyButton.displayName = "CopyButton"

export { CopyButton }
