/**
 * Radio Group Component
 * 
 * A set of radio buttons for selecting a single option from multiple choices.
 * Built on Radix UI with animated selection indicator and whileTap feedback.
 * 
 * @module components/ui/radio-group
 * 
 * @example
 * ```tsx
 * <RadioGroup value={value} onValueChange={setValue}>
 *   <RadioGroupItem value="option1">Option 1</RadioGroupItem>
 *   <RadioGroupItem value="option2">Option 2</RadioGroupItem>
 * </RadioGroup>
 * ```
 */
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { tapPress, springs } from "@/lib/motion-variants"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <div className="flex items-center space-x-2">
      <motion.div
        whileTap={prefersReducedMotion ? undefined : tapPress}
        transition={springs.micro}
        className="inline-flex"
      >
        <RadioGroupPrimitive.Item
          ref={ref}
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
                <circle cx="4" cy="4" r="4" />
              </svg>
            </motion.div>
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
      </motion.div>
      {children && (
        <label
          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          onClick={() => {
            const item = document.querySelector(`[value="${props.value}"]`) as HTMLElement;
            item?.click();
          }}
        >
          {children}
        </label>
      )}
    </div>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
