import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-primary bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:bg-primary/90",
        destructive:
          "border border-destructive bg-destructive text-destructive-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-accent hover:text-accent-foreground hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_2px_4px_0_rgba(0,0,0,0.08)]",
        secondary:
          "border border-secondary bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
