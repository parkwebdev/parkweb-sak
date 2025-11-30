import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { motion, useSpring, useTransform } from "motion/react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  thumbIcon?: React.ReactNode
  pressedWidth?: number
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, startIcon, endIcon, thumbIcon, pressedWidth = 1.3, ...props }, ref) => {
  const [checked, setChecked] = React.useState(props.defaultChecked || false)
  const [isPressed, setIsPressed] = React.useState(false)

  const spring = useSpring(checked ? 1 : 0, {
    stiffness: 500,
    damping: 30,
  })

  const thumbScale = useSpring(1, {
    stiffness: 500,
    damping: 25,
  })

  const x = useTransform(spring, [0, 1], ["0%", "100%"])

  React.useEffect(() => {
    spring.set(checked ? 1 : 0)
  }, [checked, spring])

  React.useEffect(() => {
    thumbScale.set(isPressed ? pressedWidth : 1)
  }, [isPressed, pressedWidth, thumbScale])

  const handleCheckedChange = (value: boolean) => {
    setChecked(value)
    props.onCheckedChange?.(value)
  }

  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-success data-[state=unchecked]:bg-input",
        className
      )}
      {...props}
      checked={checked}
      onCheckedChange={handleCheckedChange}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
    >
      {startIcon && (
        <span className="absolute left-1.5 z-10 text-[10px] text-primary-foreground opacity-0 transition-opacity data-[state=checked]:opacity-100">
          {startIcon}
        </span>
      )}
      {endIcon && (
        <span className="absolute right-1.5 z-10 text-[10px] text-muted-foreground opacity-0 transition-opacity data-[state=unchecked]:opacity-100">
          {endIcon}
        </span>
      )}
      <SwitchPrimitives.Thumb asChild>
        <motion.span
          className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-lg ring-0"
          style={{
            x,
            scaleX: thumbScale,
          }}
        >
          {thumbIcon && <span className="text-[10px]">{thumbIcon}</span>}
        </motion.span>
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )
})

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
